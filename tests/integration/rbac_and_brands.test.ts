import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { Brand, Category, Product, Tag, User } from '@/payload-types'
import { relationId } from '@/utilities/relationId'

let payload: Payload

describe('RBAC and Brands Integration Tests', () => {
  const testId = Date.now().toString()
  let adminUser: User
  let userBob: User
  let userCharlie: User

  let brandBobINR: Brand
  let brandBobSecond: Brand
  let brandCharlie: Brand

  let testCategory: Category
  let testTag: Tag

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
        role: 'seller',
      },
    })

    // Create User Charlie
    userCharlie = await payload.create({
      collection: 'users',
      data: {
        email: `charlie_${testId}@example.com`,
        password: 'password123',
        role: 'seller',
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
          category: testCategory.id,
          details: 'Bob electronic gadgets',
          currency: 'INR',
        },
      })

      expect(brandBobINR).toBeDefined()
      const ownerId = relationId(brandBobINR.owner)
      expect(ownerId).toBe(String(userBob.id))
      expect(brandBobINR.currency).toBe('INR')
      expect(brandBobINR.verified).toEqual({ email: false, phone: false })
    })

    it('a seller cannot mark their own brand as verified', async () => {
      const updated = await payload.update({
        collection: 'brands',
        id: brandBobINR.id,
        user: userBob,
        overrideAccess: false,
        data: { verified: { email: true, phone: true } },
      })
      expect(updated.verified).toEqual({ email: false, phone: false })
    })

    it('user can create multiple brands (all using INR currency)', async () => {
      brandBobSecond = await payload.create({
        collection: 'brands',
        user: userBob,
        overrideAccess: false,
        data: {
          name: `Bob Second Brand ${testId}`,
          category: testCategory.id,
          details: 'Bob accessories',
          currency: 'INR',
        },
      })

      expect(brandBobSecond.currency).toBe('INR')
      const ownerId = relationId(brandBobSecond.owner)
      expect(ownerId).toBe(String(userBob.id))
    })

    it('another user can create their own brand', async () => {
      brandCharlie = await payload.create({
        collection: 'brands',
        user: userCharlie,
        overrideAccess: false,
        data: {
          name: `Charlie Brand ${testId}`,
          category: testCategory.id,
          details: 'Charlie apparel',
          currency: 'INR',
        },
      })

      const ownerId = relationId(brandCharlie.owner)
      expect(ownerId).toBe(String(userCharlie.id))
    })

    it('user can only list their own brands', async () => {
      const bobBrands = await payload.find({
        collection: 'brands',
        user: userBob,
        overrideAccess: false,
      })

      const brandIds = bobBrands.docs.map((b) => String(b.id))
      expect(brandIds).toContain(String(brandBobINR.id))
      expect(brandIds).toContain(String(brandBobSecond.id))
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
      expect(brandIds).toContain(String(brandBobSecond.id))
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
    let productBobINR: Product
    let productBobSecond: Product
    let productCharlie: Product

    it('user product inherits currency from selected INR brand', async () => {
      productBobINR = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Bob INR Product ${testId}`,
          sku: `SKU-BOB-INR-${testId}`,
          brand: brandBobINR.id,
          sellingPrice: 1999,
          mrp: 2499,
          status: 'draft',
        },
      })

      expect(productBobINR.currency).toBe('INR')
    })

    it('user product inherits currency from second brand', async () => {
      productBobSecond = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Bob Second Product ${testId}`,
          sku: `SKU-BOB-SEC-${testId}`,
          brand: brandBobSecond.id,
          sellingPrice: 499,
          mrp: 599,
          status: 'draft',
        },
      })

      expect(productBobSecond.currency).toBe('INR')
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
      expect(productIds).toContain(String(productBobSecond.id))
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
      expect(productIds).not.toContain(String(productBobSecond.id))
    })

    it('Admin sees all products across all brands and users', async () => {
      const adminProducts = await payload.find({
        collection: 'products',
        user: adminUser,
        overrideAccess: false,
      })

      const productIds = adminProducts.docs.map((p) => String(p.id))
      expect(productIds).toContain(String(productBobINR.id))
      expect(productIds).toContain(String(productBobSecond.id))
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

  describe('Product hook guards', () => {
    it('forces createdBy to the creating non-admin user', async () => {
      const prod = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `CreatedBy Spoof ${testId}`,
          sku: `SKU-CB-SPOOF-${testId}`,
          brand: brandBobINR.id,
          createdBy: userCharlie.id,
          status: 'draft',
        },
      })

      const createdById = relationId(prod.createdBy)
      expect(createdById).toBe(String(userBob.id))
    })

    it('returns hook validation errors as public 400 errors', async () => {
      await expect(
        payload.create({
          collection: 'products',
          user: userBob,
          overrideAccess: false,
          data: {
            title: `Status Check ${testId}`,
            sku: `SKU-STATUS-${testId}`,
            brand: brandCharlie.id,
            status: 'draft',
          },
        }),
      ).rejects.toMatchObject({ status: 400 })
    })

    it('requires all tag attribute values when publishing', async () => {
      await expect(
        payload.create({
          collection: 'products',
          user: userBob,
          overrideAccess: false,
          data: {
            title: `Publish No Attrs ${testId}`,
            sku: `SKU-PUB-NOATTR-${testId}`,
            brand: brandBobINR.id,
            tags: [testTag.id],
            sellingPrice: 100,
            stockStatus: 'in_stock',
            status: 'active',
          },
        }),
      ).rejects.toThrow(/Attribute "Color" value cannot be empty/)
    })

    it("takes the product's category from its brand", async () => {
      const prod = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Brand Category ${testId}`,
          sku: `SKU-BRAND-CAT-${testId}`,
          brand: brandBobINR.id,
          status: 'draft',
        },
      })
      expect(relationId(prod.category)).toBe(String(testCategory.id))
    })

    it("blocks changing a brand's category once it has products", async () => {
      const otherCategory = await payload.create({
        collection: 'categories',
        data: { name: `RBAC Other Category ${testId}` },
      })
      try {
        await expect(
          payload.update({
            collection: 'brands',
            id: brandBobINR.id,
            user: userBob,
            overrideAccess: false,
            data: { category: otherCategory.id },
          }),
        ).rejects.toThrow(/Cannot change the category/)
      } finally {
        await payload.delete({ collection: 'categories', id: otherCategory.id })
      }
    })

    it('keeps the slug immutable once the product is published', async () => {
      const prod = await payload.create({
        collection: 'products',
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Published Slug ${testId}`,
          sku: `SKU-PUB-SLUG-${testId}`,
          brand: brandBobINR.id,
          tags: [testTag.id],
          attributes: [{ label: 'Color', value: 'Red' }],
          sellingPrice: 100,
          stockStatus: 'in_stock',
          status: 'active',
        },
      })
      expect(prod.slug).toBe(`published-slug-${testId}`)

      const updated = await payload.update({
        collection: 'products',
        id: prod.id,
        user: userBob,
        overrideAccess: false,
        data: {
          title: `Renamed Slug ${testId}`,
          slug: 'hijacked-slug',
        },
      })
      expect(updated.slug).toBe(`published-slug-${testId}`)
    })
  })
})
