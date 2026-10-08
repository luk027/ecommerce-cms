import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

let payload: Payload

describe('RBAC and Brands Integration Tests', () => {
  const testId = Date.now().toString()
  let adminUser: any
  let userBob: any
  let userCharlie: any

  let brandBobINR: any
  let brandBobUSD: any
  let brandCharlie: any

  let testCategory: any
  let testTag: any

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Create Admin User
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: `admin_${testId}@example.com`,
        password: 'password123',
        role: 'admin',
      },
    })

    // Create User Bob
    userBob = await payload.create({
      collection: 'users',
      data: {
        email: `bob_${testId}@example.com`,
        password: 'password123',
        role: 'user',
      },
    })

    // Create User Charlie
    userCharlie = await payload.create({
      collection: 'users',
      data: {
        email: `charlie_${testId}@example.com`,
        password: 'password123',
        role: 'user',
      },
    })

    // Create Test Category via Admin
    testCategory = await payload.create({
      collection: 'categories',
      user: adminUser,
      overrideAccess: false,
      data: {
        name: `RBAC Category ${testId}`,
      },
    })

    // Create Test Tag via Admin
    testTag = await payload.create({
      collection: 'tags',
      user: adminUser,
      overrideAccess: false,
      data: {
        name: `RBAC Tag ${testId}`,
        category: testCategory.id,
        attributes: [{ label: 'Color', validation: { type: 'text' } }],
      },
    })
  })

  afterAll(async () => {
    // Cleanup products
    await payload.delete({
      collection: 'products',
      where: {
        title: {
          contains: testId,
        },
      },
    })

    // Cleanup brands
    await payload.delete({
      collection: 'brands',
      where: {
        name: {
          contains: testId,
        },
      },
    })

    // Cleanup tags
    if (testTag?.id) {
      await payload.delete({ collection: 'tags', id: testTag.id })
    }

    // Cleanup categories
    if (testCategory?.id) {
      await payload.delete({ collection: 'categories', id: testCategory.id })
    }

    // Cleanup users
    if (adminUser?.id) await payload.delete({ collection: 'users', id: adminUser.id })
    if (userBob?.id) await payload.delete({ collection: 'users', id: userBob.id })
    if (userCharlie?.id) await payload.delete({ collection: 'users', id: userCharlie.id })
  })

  describe('Brands collection and ownership', () => {
    it('user can create brand and owner is automatically assigned to that user', async () => {
      brandBobINR = await payload.create({
        collection: 'brands',
        user: userBob,
        overrideAccess: false,
        data: {
          name: `Bob Brand INR ${testId}`,
          details: 'Bob electronic gadgets',
          currency: 'INR',
        },
      })

      expect(brandBobINR).toBeDefined()
      const ownerId =
        typeof brandBobINR.owner === 'object' ? brandBobINR.owner.id : brandBobINR.owner
      expect(String(ownerId)).toBe(String(userBob.id))
      expect(brandBobINR.currency).toBe('INR')
    })

    it('user can create multiple brands with different currencies (e.g. USD)', async () => {
      brandBobUSD = await payload.create({
        collection: 'brands',
        user: userBob,
        overrideAccess: false,
        data: {
          name: `Bob Brand USD ${testId}`,
          details: 'Bob international accessories',
          currency: 'USD',
        },
      })

      expect(brandBobUSD.currency).toBe('USD')
      const ownerId =
        typeof brandBobUSD.owner === 'object' ? brandBobUSD.owner.id : brandBobUSD.owner
      expect(String(ownerId)).toBe(String(userBob.id))
    })

    it('another user can create their own brand', async () => {
      brandCharlie = await payload.create({
        collection: 'brands',
        user: userCharlie,
        overrideAccess: false,
        data: {
          name: `Charlie Brand ${testId}`,
          details: 'Charlie apparel',
          currency: 'INR',
        },
      })

      const ownerId =
        typeof brandCharlie.owner === 'object' ? brandCharlie.owner.id : brandCharlie.owner
      expect(String(ownerId)).toBe(String(userCharlie.id))
    })

    it('user can only list their own brands', async () => {
      const bobBrands = await payload.find({
        collection: 'brands',
        user: userBob,
        overrideAccess: false,
      })

      const brandIds = bobBrands.docs.map((b) => String(b.id))
      expect(brandIds).toContain(String(brandBobINR.id))
      expect(brandIds).toContain(String(brandBobUSD.id))
      expect(brandIds).not.toContain(String(brandCharlie.id))
    })

    it('user cannot update another user brand', async () => {
      await expect(
        payload.update({
          collection: 'brands',
          id: brandCharlie.id,
          user: userBob,
          overrideAccess: false,
          data: {
            details: 'Hacked by Bob',
          },
        }),
      ).rejects.toThrow()
    })

    it('admin can see all brands from all users', async () => {
      const adminBrands = await payload.find({
        collection: 'brands',
        user: adminUser,
        overrideAccess: false,
      })

      const brandIds = adminBrands.docs.map((b) => String(b.id))
      expect(brandIds).toContain(String(brandBobINR.id))
      expect(brandIds).toContain(String(brandBobUSD.id))
      expect(brandIds).toContain(String(brandCharlie.id))
    })
  })

  describe('Categories and Tags RBAC mutation guards', () => {
    it('user cannot create a category', async () => {
      await expect(
        payload.create({
          collection: 'categories',
          user: userBob,
          overrideAccess: false,
          data: {
            name: `Forbidden Category ${testId}`,
          },
        }),
      ).rejects.toThrow()
    })

    it('user cannot update a category', async () => {
      await expect(
        payload.update({
          collection: 'categories',
          id: testCategory.id,
          user: userBob,
          overrideAccess: false,
          data: {
            name: `Renamed Category ${testId}`,
          },
        }),
      ).rejects.toThrow()
    })

    it('user cannot delete a category', async () => {
      await expect(
        payload.delete({
          collection: 'categories',
          id: testCategory.id,
          user: userBob,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('user cannot create, update, or delete a tag', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          user: userBob,
          overrideAccess: false,
          data: {
            name: `Forbidden Tag ${testId}`,
            category: testCategory.id,
          },
        }),
      ).rejects.toThrow()

      await expect(
        payload.update({
          collection: 'tags',
          id: testTag.id,
          user: userBob,
          overrideAccess: false,
          data: {
            name: `Renamed Tag ${testId}`,
          },
        }),
      ).rejects.toThrow()

      await expect(
        payload.delete({
          collection: 'tags',
          id: testTag.id,
          user: userBob,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('user can read categories and tags', async () => {
      const categories = await payload.find({
        collection: 'categories',
        user: userBob,
        overrideAccess: false,
      })
      expect(categories.docs.length).toBeGreaterThan(0)

      const tags = await payload.find({
        collection: 'tags',
        user: userBob,
        overrideAccess: false,
      })
      expect(tags.docs.length).toBeGreaterThan(0)
    })
  })

  describe('Products with Brands and RBAC scoping', () => {
    let productBobINR: any
    let productBobUSD: any
    let productCharlie: any

    it('user product inherits currency from selected INR brand', async () => {
      productBobINR = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Bob INR Product ${testId}`,
          sku: `SKU-BOB-INR-${testId}`,
          category: testCategory.id,
          brand: brandBobINR.id,
          sellingPrice: 1999,
          mrp: 2499,
          status: 'draft',
        },
      })

      expect(productBobINR.currency).toBe('INR')
    })

    it('user product inherits currency from selected USD brand', async () => {
      productBobUSD = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Bob USD Product ${testId}`,
          sku: `SKU-BOB-USD-${testId}`,
          category: testCategory.id,
          brand: brandBobUSD.id,
          sellingPrice: 49,
          mrp: 59,
          status: 'draft',
        },
      })

      expect(productBobUSD.currency).toBe('USD')
    })

    it('user cannot assign a product to another user brand', async () => {
      await expect(
        payload.create({
          collection: 'products',
          user: userBob,
          overrideAccess: false,
          data: {
            title: `Spoofed Product ${testId}`,
            sku: `SKU-SPOOF-${testId}`,
            category: testCategory.id,
            brand: brandCharlie.id,
            sellingPrice: 100,
            status: 'draft',
          },
        }),
      ).rejects.toThrow('You can only assign products to your own brands.')
    })

    it('Charlie creates a product under his brand', async () => {
      productCharlie = await payload.create({
        collection: 'products',
        user: userCharlie,
        overrideAccess: false,
        data: {
          title: `Charlie Product ${testId}`,
          sku: `SKU-CHARLIE-${testId}`,
          category: testCategory.id,
          brand: brandCharlie.id,
          sellingPrice: 899,
          status: 'draft',
        },
      })

      expect(productCharlie).toBeDefined()
    })

    it('Bob only sees products belonging to his own brands/created by him', async () => {
      const bobProducts = await payload.find({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
      })

      const productIds = bobProducts.docs.map((p) => String(p.id))
      expect(productIds).toContain(String(productBobINR.id))
      expect(productIds).toContain(String(productBobUSD.id))
      expect(productIds).not.toContain(String(productCharlie.id))
    })

    it('Charlie only sees products belonging to his own brands', async () => {
      const charlieProducts = await payload.find({
        collection: 'products',
        user: userCharlie,
        overrideAccess: false,
      })

      const productIds = charlieProducts.docs.map((p) => String(p.id))
      expect(productIds).toContain(String(productCharlie.id))
      expect(productIds).not.toContain(String(productBobINR.id))
      expect(productIds).not.toContain(String(productBobUSD.id))
    })

    it('Admin sees all products across all brands and users', async () => {
      const adminProducts = await payload.find({
        collection: 'products',
        user: adminUser,
        overrideAccess: false,
      })

      const productIds = adminProducts.docs.map((p) => String(p.id))
      expect(productIds).toContain(String(productBobINR.id))
      expect(productIds).toContain(String(productBobUSD.id))
      expect(productIds).toContain(String(productCharlie.id))
    })

    it('Bob cannot update or delete Charlie product', async () => {
      await expect(
        payload.update({
          collection: 'products',
          id: productCharlie.id,
          user: userBob,
          overrideAccess: false,
          data: {
            title: 'Hacked by Bob',
          },
        }),
      ).rejects.toThrow()

      await expect(
        payload.delete({
          collection: 'products',
          id: productCharlie.id,
          user: userBob,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })
})
