import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { shapeListingProduct, shapeDetailProduct } from '@/utilities/shapeProduct'
import { relationId } from '@/utilities/relationId'
import type { ProductAttribute } from '@/utilities/mergeAttributes'

let payload: Payload

describe('Catalog Integration Tests', () => {
  const testId = Date.now().toString()
  let categoryAId: string
  let categoryBId: string
  let tagAId: string
  let tagBId: string
  let tagA2Id: string
  // Products take their category from their brand, so each test category gets a brand.
  let sellerId: string
  let brandAId: string
  let brandBId: string

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Create Category A & B
    const catA = await payload.create({
      collection: 'categories',
      data: { name: `Test Electronics ${testId}` },
    })
    categoryAId = String(catA.id)

    const catB = await payload.create({
      collection: 'categories',
      data: { name: `Test Clothing ${testId}` },
    })
    categoryBId = String(catB.id)

    // Create Tag A (Category A only) with label-only attributes
    const tagA = await payload.create({
      collection: 'tags',
      data: {
        name: `Test Smart Feature ${testId}`,
        category: categoryAId,
        attributes: [
          { label: 'Feature', validation: { type: 'text', min: 1, max: 100 } },
          { label: 'Connectivity', validation: { type: 'text' } },
        ],
      },
    })
    tagAId = String(tagA.id)

    // Create Tag B (Category B only) with label-only attributes
    const tagB = await payload.create({
      collection: 'tags',
      data: {
        name: `Test Fabric Care ${testId}`,
        category: categoryBId,
        attributes: [
          { label: 'Care', validation: { type: 'text' } },
          { label: 'Feature', validation: { type: 'text' } }, // Duplicate label for testing dedup
        ],
      },
    })
    tagBId = String(tagB.id)

    // Create Tag A2 (Category A)
    const tagA2 = await payload.create({
      collection: 'tags',
      data: {
        name: `Test Eco Friendly ${testId}`,
        category: categoryAId,
        attributes: [{ label: 'Eco Rating', validation: { type: 'text' } }],
      },
    })
    tagA2Id = String(tagA2.id)

    const seller = await payload.create({
      collection: 'users',
      data: {
        email: `catalog_seller_${testId}@example.com`,
        password: 'password123',
        role: 'seller',
      },
    })
    sellerId = String(seller.id)

    const brandA = await payload.create({
      collection: 'brands',
      data: {
        name: `Test Brand A ${testId}`,
        category: categoryAId,
        currency: 'INR',
        owner: sellerId,
      },
    })
    brandAId = String(brandA.id)

    const brandB = await payload.create({
      collection: 'brands',
      data: {
        name: `Test Brand B ${testId}`,
        category: categoryBId,
        currency: 'INR',
        owner: sellerId,
      },
    })
    brandBId = String(brandB.id)
  })

  afterAll(async () => {
    // Clean up created test entities
    try {
      await payload.delete({
        collection: 'products',
        where: { sku: { contains: testId } },
      })
      await payload.delete({
        collection: 'brands',
        where: { name: { contains: testId } },
      })
      await payload.delete({ collection: 'users', id: sellerId })
      await payload.delete({
        collection: 'tags',
        where: { name: { contains: testId } },
      })
      await payload.delete({
        collection: 'categories',
        where: { name: { contains: testId } },
      })
    } catch {
      // ignore cleanup errors
    }
  })

  describe('Category collection', () => {
    it('creates category with just a name', async () => {
      const cat = await payload.create({
        collection: 'categories',
        data: { name: `Single Name Cat ${testId}` },
      })
      expect(cat.id).toBeDefined()
      expect(cat.name).toBe(`Single Name Cat ${testId}`)

      await payload.delete({ collection: 'categories', id: cat.id })
    })

    it('rejects duplicate category name (case-insensitive)', async () => {
      await expect(
        payload.create({
          collection: 'categories',
          data: { name: `test electronics ${testId}` },
        }),
      ).rejects.toThrow()
    })

    it('blocks category deletion when referenced by tags', async () => {
      await expect(
        payload.delete({
          collection: 'categories',
          id: categoryAId,
        }),
      ).rejects.toThrow(/referenced by/i)
    })
  })

  describe('Tag collection', () => {
    it('requires a category', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: `Tag No Cat ${testId}`,
            category: '',
          },
        }),
      ).rejects.toThrow(/associated with a category/i)
    })

    it('rejects duplicate attribute labels within the same tag', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: `Tag Dup Label ${testId}`,
            category: categoryAId,
            attributes: [
              { label: 'Color' },
              { label: 'color  ' }, // normalized duplicate
            ],
          },
        }),
      ).rejects.toThrow(/duplicate attribute label/i)
    })

    it('rejects attribute validation where min > max', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: `Tag Bad Validation ${testId}`,
            category: categoryAId,
            attributes: [{ label: 'Weight', validation: { type: 'number', min: 100, max: 10 } }],
          },
        }),
      ).rejects.toThrow(/min.*cannot be greater than max/i)
    })

    it('creates a tag with single category and label-only attributes (no values)', async () => {
      const tag = await payload.create({
        collection: 'tags',
        data: {
          name: `Tag Valid ${testId}`,
          category: categoryAId,
          attributes: [
            { label: 'Screen Size', validation: { type: 'number', min: 1, max: 100 } },
            { label: 'Color', validation: { type: 'text', max: 30 } },
          ],
        },
      })
      expect(tag.id).toBeDefined()
      expect(tag.category).toBeDefined()
      expect(tag.attributes).toHaveLength(2)
      expect(tag.attributes?.[0]?.label).toBe('Screen Size')
      expect((tag.attributes?.[0] as Record<string, unknown> | undefined)?.value).toBeUndefined()

      await payload.delete({ collection: 'tags', id: tag.id })
    })

    it('creates a tag with boolean attribute and group attributes containing multiple items', async () => {
      const tag = await payload.create({
        collection: 'tags',
        data: {
          name: `Tag Groups and Boolean ${testId}`,
          category: categoryAId,
          attributes: [
            {
              type: 'single',
              label: 'Water Resistant',
              validation: { type: 'boolean' },
            },
            {
              type: 'group',
              groupName: 'Display Specifications',
              items: [
                { label: 'Resolution', validation: { type: 'text' } },
                { label: 'Refresh Rate', validation: { type: 'number', min: 30, max: 240 } },
                { label: 'HDR Enabled', validation: { type: 'boolean' } },
              ],
            },
          ],
        },
      })

      expect(tag.id).toBeDefined()
      expect(tag.attributes).toHaveLength(2)
      const attrs = tag.attributes ?? []
      expect(attrs[0].label).toBe('Water Resistant')
      expect(attrs[0].validation?.type).toBe('boolean')
      expect(attrs[1].groupName).toBe('Display Specifications')
      expect(attrs[1].items).toHaveLength(3)

      await payload.delete({ collection: 'tags', id: tag.id })
    })

    it('rejects tag with group attribute that has no items', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: `Tag Empty Group ${testId}`,
            category: categoryAId,
            attributes: [
              {
                type: 'group',
                groupName: 'Empty Group',
                items: [],
              },
            ],
          },
        }),
      ).rejects.toThrow(/must contain at least one attribute/i)
    })

    it('rejects tag with duplicate attribute labels inside the same group', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: `Tag Dupe In Group ${testId}`,
            category: categoryAId,
            attributes: [
              {
                type: 'group',
                groupName: 'Dimensions',
                items: [
                  { label: 'Height', validation: { type: 'number' } },
                  { label: 'height', validation: { type: 'number' } },
                ],
              },
            ],
          },
        }),
      ).rejects.toThrow(/duplicate attribute label/i)
    })
  })

  describe('Product validation & hooks', () => {
    it('allows draft creation with minimal fields', async () => {
      const draft = await payload.create({
        collection: 'products',
        data: {
          title: `Draft Product ${testId}`,
          sku: `DRAFT-${testId}`,
          brand: brandAId,
          status: 'draft',
        },
      })

      expect(draft.id).toBeDefined()
      expect(draft.status).toBe('draft')
      expect(draft.slug).toBe(`draft-product-${testId}`)
    })

    it('rejects a product whose brand is in Category A with a tag from Category B', async () => {
      await expect(
        payload.create({
          collection: 'products',
          data: {
            title: `Mismatch Tag Product ${testId}`,
            sku: `MISMATCH-${testId}`,
            brand: brandAId,
            tags: [tagBId],
            status: 'draft',
          },
        }),
      ).rejects.toThrow(/do not belong to the selected category/i)
    })

    it('rejects moving a product to a brand in another category while it has incompatible tags', async () => {
      // Product under a Category A brand, with Tag A
      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Switch Cat Product ${testId}`,
          sku: `SWITCH-${testId}`,
          brand: brandAId,
          tags: [tagAId],
          status: 'draft',
        },
      })

      // Moving it to the Category B brand would change its category while holding Tag A
      await expect(
        payload.update({
          collection: 'products',
          id: prod.id,
          data: {
            brand: brandBId,
          },
        }),
      ).rejects.toThrow(/do not belong to the selected category/i)
    })

    it('rejects active status when publish-gate fields are missing', async () => {
      await expect(
        payload.create({
          collection: 'products',
          data: {
            title: `Active Without Fields ${testId}`,
            sku: `ACTIVE-FAIL-${testId}`,
            brand: brandAId,
            status: 'active',
          },
        }),
      ).rejects.toThrow(/Cannot publish product/i)
    })

    it('defaults product currency to INR when brand is not specified', async () => {
      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Currency Product ${testId}`,
          sku: `CURR-${testId}`,
          brand: brandAId,
          status: 'draft',
        },
      })

      expect(prod.currency).toBe('INR')
    })

    it('computes discount percentage automatically when mrp > sellingPrice', async () => {
      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Discount Product ${testId}`,
          sku: `DISC-${testId}`,
          brand: brandAId,
          status: 'draft',
          sellingPrice: 80,
          mrp: 100,
        },
      })

      expect(prod.discountPercent).toBe(20)
    })

    it('saves product attributes (label+value) and strips orphaned labels on save', async () => {
      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Attr Product ${testId}`,
          sku: `ATTR-${testId}`,
          brand: brandAId,
          tags: [tagAId],
          status: 'draft',
          attributes: [
            { label: 'Feature', value: 'Smart AI' },
            { label: 'Connectivity', value: 'WiFi 6' },
            { label: 'OrphanedLabel', value: 'Should be stripped' }, // not in tag
          ],
        },
      })

      const storedAttrs = prod.attributes as ProductAttribute[]
      expect(storedAttrs).toHaveLength(2)
      expect(storedAttrs.find((a) => a.label === 'Feature')?.value).toBe('Smart AI')
      expect(storedAttrs.find((a) => a.label === 'Connectivity')?.value).toBe('WiFi 6')
      expect(storedAttrs.find((a) => a.label === 'OrphanedLabel')).toBeUndefined()
    })

    it('validates attribute value type when tag defines number validation', async () => {
      const numTag = await payload.create({
        collection: 'tags',
        data: {
          name: `Num Tag ${testId}`,
          category: categoryAId,
          attributes: [{ label: 'Weight', validation: { type: 'number', min: 0, max: 999 } }],
        },
      })

      await expect(
        payload.create({
          collection: 'products',
          data: {
            title: `BadNum Product ${testId}`,
            sku: `BADNUM-${testId}`,
            brand: brandAId,
            tags: [String(numTag.id)],
            status: 'draft',
            attributes: [{ label: 'Weight', value: 'not-a-number' }],
          },
        }),
      ).rejects.toThrow(/must be a number/i)

      await payload.delete({ collection: 'tags', id: numTag.id })
    })

    it('deduplicates attribute labels when multiple tags have the same label (first wins)', async () => {
      // tagA2 has "Eco Rating"; create a second tag with the same label for testing
      const dupeTag = await payload.create({
        collection: 'tags',
        data: {
          name: `Dupe Label Tag ${testId}`,
          category: categoryAId,
          attributes: [{ label: 'Eco Rating' }],
        },
      })

      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Dupe Attr Product ${testId}`,
          sku: `DUPE-ATTR-${testId}`,
          brand: brandAId,
          tags: [tagA2Id, String(dupeTag.id)],
          status: 'draft',
          attributes: [
            { label: 'Eco Rating', value: 'A+' }, // first occurrence wins
            { label: 'Eco Rating', value: 'B' }, // should be stripped as duplicate
          ],
        },
      })

      const storedAttrs = prod.attributes as ProductAttribute[]
      const ecoAttrs = storedAttrs.filter((a) => a.label === 'Eco Rating')
      expect(ecoAttrs).toHaveLength(1)
      expect(ecoAttrs[0].value).toBe('A+')

      await payload.delete({ collection: 'tags', id: dupeTag.id })
    })

    it('rejects product save when an attribute value is empty', async () => {
      await expect(
        payload.create({
          collection: 'products',
          data: {
            title: `Empty Attr Product ${testId}`,
            sku: `EMPTY-ATTR-${testId}`,
            brand: brandAId,
            tags: [tagAId],
            status: 'draft',
            attributes: [
              { label: 'Feature', value: '' }, // empty value should be rejected
              { label: 'Connectivity', value: 'WiFi 6' },
            ],
          },
        }),
      ).rejects.toThrow(/cannot be empty/i)
    })

    it('validates and saves boolean attributes as true or false strings', async () => {
      const boolTag = await payload.create({
        collection: 'tags',
        data: {
          name: `Tag Bool Only ${testId}`,
          category: categoryAId,
          attributes: [
            {
              type: 'single',
              label: 'Waterproof',
              validation: { type: 'boolean' },
            },
          ],
        },
      })

      // Valid boolean 'true'
      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Bool Product ${testId}`,
          sku: `BOOL-PROD-${testId}`,
          brand: brandAId,
          tags: [String(boolTag.id)],
          status: 'draft',
          attributes: [{ label: 'Waterproof', value: 'true' }],
        },
      })

      const stored = prod.attributes as ProductAttribute[]
      expect(stored).toHaveLength(1)
      expect(stored[0].label).toBe('Waterproof')
      expect(stored[0].value).toBe('true')

      // Invalid boolean value
      await expect(
        payload.create({
          collection: 'products',
          data: {
            title: `Bad Bool Product ${testId}`,
            sku: `BAD-BOOL-${testId}`,
            brand: brandAId,
            tags: [String(boolTag.id)],
            status: 'draft',
            attributes: [{ label: 'Waterproof', value: 'invalid-bool' }],
          },
        }),
      ).rejects.toThrow(/must be either "true" or "false"/i)

      await payload.delete({ collection: 'tags', id: boolTag.id })
    })

    it('validates, saves, and shapes grouped product attributes', async () => {
      const groupTag = await payload.create({
        collection: 'tags',
        data: {
          name: `Tag Group Hardware ${testId}`,
          category: categoryAId,
          attributes: [
            {
              type: 'single',
              label: 'Color',
              validation: { type: 'text' },
            },
            {
              type: 'group',
              groupName: 'Dimensions',
              items: [
                { label: 'Height', validation: { type: 'number', min: 10 } },
                { label: 'Width', validation: { type: 'number', min: 10 } },
              ],
            },
          ],
        },
      })

      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Grouped Attr Product ${testId}`,
          sku: `GROUPED-PROD-${testId}`,
          brand: brandAId,
          tags: [String(groupTag.id)],
          status: 'draft',
          attributes: [
            { label: 'Color', value: 'Midnight Blue' },
            { label: 'Height', value: '150', group: 'Dimensions' },
            { label: 'Width', value: '75', group: 'Dimensions' },
          ],
        },
      })

      const stored = prod.attributes as ProductAttribute[]
      expect(stored).toHaveLength(3)
      expect(stored.find((a) => a.label === 'Height')?.group).toBe('Dimensions')
      expect(stored.find((a) => a.label === 'Width')?.group).toBe('Dimensions')
      expect(stored.find((a) => a.label === 'Color')?.group).toBeUndefined()

      // Missing child attribute in group
      await expect(
        payload.create({
          collection: 'products',
          data: {
            title: `Missing Group Child ${testId}`,
            sku: `MISS-CHILD-${testId}`,
            brand: brandAId,
            tags: [String(groupTag.id)],
            status: 'draft',
            attributes: [
              { label: 'Color', value: 'Red' },
              { label: 'Height', value: '150', group: 'Dimensions' },
              // Width missing
            ],
          },
        }),
      ).rejects.toThrow(/Attribute "Dimensions > Width" value cannot be empty/i)

      await payload.delete({ collection: 'tags', id: groupTag.id })
    })
  })

  describe('Tag lifecycle & unlinking', () => {
    it('unlinks tag from products when tag is deleted', async () => {
      // Create temporary tag in Category A
      const tempTag = await payload.create({
        collection: 'tags',
        data: {
          name: `Temp Tag ${testId}`,
          category: categoryAId,
          attributes: [{ label: 'TempAttr' }],
        },
      })

      // Create product with tagA and tempTag
      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Prod Unlink Test ${testId}`,
          sku: `UNLINK-${testId}`,
          brand: brandAId,
          tags: [tagAId, String(tempTag.id)],
          status: 'draft',
        },
      })

      expect(prod.tags).toHaveLength(2)

      // Delete tempTag
      await payload.delete({
        collection: 'tags',
        id: tempTag.id,
      })

      // Fetch product again - should now only contain tagA
      const updatedProd = await payload.findByID({
        collection: 'products',
        id: prod.id,
      })

      const remainingTagIds = (updatedProd.tags ?? []).map((t) => relationId(t))
      expect(remainingTagIds).toEqual([tagAId])
      expect(remainingTagIds).not.toContain(String(tempTag.id))
    })

    it('unlinks tag from products when tag category is changed', async () => {
      // Create a temporary tag in Category A
      const movableTag = await payload.create({
        collection: 'tags',
        data: {
          name: `Movable Tag ${testId}`,
          category: categoryAId,
          attributes: [],
        },
      })

      // Create product in Category A with movableTag
      const prodA = await payload.create({
        collection: 'products',
        data: {
          title: `Prod A Move ${testId}`,
          sku: `MOVE-A-${testId}`,
          brand: brandAId,
          tags: [String(movableTag.id)],
          status: 'draft',
        },
      })

      // Change movableTag category to Category B
      await payload.update({
        collection: 'tags',
        id: movableTag.id,
        data: {
          category: categoryBId,
        },
      })

      // Prod A (in Category A) should now have movableTag unlinked
      const updatedProdA = await payload.findByID({
        collection: 'products',
        id: prodA.id,
      })
      const prodATags = (updatedProdA.tags ?? []).map((t) => relationId(t))
      expect(prodATags).not.toContain(String(movableTag.id))

      await payload.delete({ collection: 'tags', id: movableTag.id })
    })
  })

  describe('Response shaping', () => {
    it('serves product-stored attributes and filters orphaned labels against active tags', () => {
      const populatedDoc = {
        id: 'mock-1',
        slug: 'mock-slug',
        title: 'Mock Product',
        brand: 'Mock Brand',
        category: { id: categoryAId, name: 'Electronics' },
        sellingPrice: 1000,
        mrp: 1200,
        discountPercent: 17,
        currency: 'INR',
        stockStatus: 'in_stock',
        tags: [
          {
            id: tagAId,
            name: 'Smart Feature',
            category: categoryAId,
            attributes: [
              { label: 'Feature', validation: { type: 'text' } },
              { label: 'Connectivity', validation: { type: 'text' } },
            ],
          },
        ],
        // Product stores its own attribute values
        attributes: [
          { label: 'Feature', value: 'Smart AI' },
          { label: 'Connectivity', value: 'WiFi 6' },
          { label: 'OldOrphan', value: 'Should be removed' }, // label not in tags
        ],
      }

      const listing = shapeListingProduct(populatedDoc)
      expect(listing?.attributes).toEqual([
        { label: 'Feature', value: 'Smart AI' },
        { label: 'Connectivity', value: 'WiFi 6' },
      ])

      const detail = shapeDetailProduct(populatedDoc)
      expect(detail?.attributes).toEqual([
        { label: 'Feature', value: 'Smart AI' },
        { label: 'Connectivity', value: 'WiFi 6' },
      ])
    })

    it('deduplicates same label across multiple tags, first wins', () => {
      const populatedDoc = {
        id: 'mock-2',
        slug: 'mock-slug-2',
        title: 'Mock Product 2',
        brand: 'Mock Brand',
        category: { id: categoryAId, name: 'Electronics' },
        sellingPrice: 500,
        mrp: 600,
        discountPercent: 17,
        currency: 'INR',
        stockStatus: 'in_stock',
        tags: [
          {
            id: 'tag-x',
            name: 'Tag X',
            category: categoryAId,
            attributes: [{ label: 'Feature', validation: { type: 'text' } }],
          },
          {
            id: 'tag-y',
            name: 'Tag Y',
            category: categoryAId,
            attributes: [
              { label: 'Feature', validation: { type: 'text' } }, // duplicate, ignored in valid set
              { label: 'Material', validation: { type: 'text' } },
            ],
          },
        ],
        attributes: [
          { label: 'Feature', value: 'Lightweight' },
          { label: 'Material', value: 'Cotton' },
        ],
      }

      const listing = shapeListingProduct(populatedDoc)
      expect(listing?.attributes).toEqual([
        { label: 'Feature', value: 'Lightweight' },
        { label: 'Material', value: 'Cotton' },
      ])
    })

    it('handles multi-tag product with single and group attributes (Headphones group, boolean values)', async () => {
      const tagMulti = await payload.create({
        collection: 'tags',
        data: {
          name: `Tag Headphones Complex ${testId}`,
          category: categoryAId,
          attributes: [
            {
              type: 'single',
              label: 'Operating System Support',
              validation: { type: 'text' },
            },
            {
              type: 'single',
              label: 'Voice Assistant Compatibility',
              validation: { type: 'boolean' },
            },
            {
              type: 'group',
              groupName: 'Headphones',
              items: [
                { label: 'RGB', validation: { type: 'boolean' } },
                { label: 'Wired', validation: { type: 'boolean' } },
                { label: 'Battery Life', validation: { type: 'text' } },
              ],
            },
          ],
        },
      })

      const prod = await payload.create({
        collection: 'products',
        data: {
          title: `Semi-conductor Complex ${testId}`,
          sku: `SMC-01-${testId}`,
          brand: brandAId,
          tags: [String(tagMulti.id)],
          status: 'draft',
          attributes: [
            { label: 'Operating System Support', value: 'NO' },
            { label: 'Voice Assistant Compatibility', value: 'NO' }, // 'NO' -> normalized to 'false'
            { label: 'RGB', value: 'true', group: 'Headphones' },
            { label: 'Wired', value: 'true', group: 'Headphones' },
            { label: 'Battery Life', value: '10 to 12 Hours', group: 'Headphones' },
          ],
        },
      })

      const storedAttrs = prod.attributes as ProductAttribute[]
      expect(storedAttrs).toHaveLength(5)
      expect(storedAttrs.find((a) => a.label === 'Voice Assistant Compatibility')?.value).toBe(
        'false',
      )
      expect(storedAttrs.find((a) => a.label === 'RGB')?.group).toBe('Headphones')
      expect(storedAttrs.find((a) => a.label === 'RGB')?.value).toBe('true')
      expect(storedAttrs.find((a) => a.label === 'Battery Life')?.value).toBe('10 to 12 Hours')

      // Test shaping
      const populatedDoc = {
        ...prod,
        tags: [tagMulti],
      }
      const listing = shapeListingProduct(populatedDoc)
      expect(listing?.attributes).toHaveLength(5)
      expect(listing?.attributes.find((a) => a.label === 'RGB')?.group).toBe('Headphones')

      await payload.delete({ collection: 'tags', id: tagMulti.id })
    })
  })
})
