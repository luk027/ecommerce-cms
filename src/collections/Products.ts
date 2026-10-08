import type { CollectionConfig, Where } from 'payload'
import { slugify, normalizeLabel } from '../lib/catalog/normalize'
import { validateProductTags } from '../lib/catalog/validateTags'
import { computeDiscount } from '../lib/catalog/computeDiscount'
import { resolveUserBrandIds } from '../lib/access/resolveUserBrandIds'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'category', 'status', 'sellingPrice', 'stockStatus'],
  },
  access: {
    read: async ({ req }): Promise<Where | boolean> => {
      // Admins have access to all products
      if ((req.user as any)?.role === 'admin') return true

      // If logged in as regular user, only see products for their brands or created by them
      if (req.user) {
        const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
        const orConditions: Where[] = []
        if (brandIds.length > 0) {
          orConditions.push({ brand: { in: brandIds } })
        }
        orConditions.push({ createdBy: { equals: req.user.id } })
        return { or: orConditions }
      }

      // Public visitors (frontend) see active products
      return {
        status: {
          equals: 'active',
        },
      }
    },
    create: ({ req }) => Boolean(req.user),
    update: async ({ req }): Promise<Where | boolean> => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
      const orConditions: Where[] = []
      if (brandIds.length > 0) {
        orConditions.push({ brand: { in: brandIds } })
      }
      orConditions.push({ createdBy: { equals: req.user.id } })
      return { or: orConditions }
    },
    delete: async ({ req }): Promise<Where | boolean> => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
      const orConditions: Where[] = []
      if (brandIds.length > 0) {
        orConditions.push({ brand: { in: brandIds } })
      }
      orConditions.push({ createdBy: { equals: req.user.id } })
      return { or: orConditions }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from title. Immutable once published.',
      },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      hasMany: false,
      index: true,
      admin: {
        description: 'Category this product belongs to.',
      },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: false,
      index: true,
      admin: {
        description: 'Brand this product belongs to.',
      },
      filterOptions: ({ req }) => {
        if (!req.user) return false
        if ((req.user as any).role === 'admin') return true
        return {
          owner: {
            equals: req.user.id,
          },
        }
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data, siblingData, { user }) => (user as any)?.role === 'admin',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sellingPrice',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'mrp',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'discountPercent',
          type: 'number',
          admin: {
            width: '33%',
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'INR',
          options: [
            { label: 'INR (₹)', value: 'INR' },
            { label: 'USD ($)', value: 'USD' },
            { label: 'EUR (€)', value: 'EUR' },
            { label: 'GBP (£)', value: 'GBP' },
          ],
          admin: {
            width: '33%',
            readOnly: true,
            description: 'Inherited from Brand currency.',
          },
        },
        {
          name: 'stockStatus',
          type: 'select',
          options: [
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Out of Stock', value: 'out_of_stock' },
            { label: 'Pre-Order', value: 'preorder' },
            { label: 'Discontinued', value: 'discontinued' },
          ],
          admin: {
            width: '33%',
          },
        },
        {
          name: 'stockQuantity',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
          },
        },
      ],
    },

    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      index: true,
      admin: {
        description: 'Only tags matching the selected category can be chosen.',
      },
      filterOptions: ({ siblingData, data }) => {
        const cat = (data as any)?.category || (siblingData as any)?.category
        if (!cat) return false
        const catId = typeof cat === 'object' && cat ? cat.id || cat._id : cat
        return {
          category: {
            equals: catId,
          },
        }
      },
    },
    {
      name: 'attributes',
      type: 'json',
      admin: {
        description:
          'Attribute values for this product. Automatically populated when selected tags define attributes.',
        components: {
          Field: '@/components/ProductAttributesField#ProductAttributesField',
        },
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc, operation }) => {
        if (!data) return data

        // Set createdBy if user is logged in on create
        if (req.user && operation === 'create' && !data.createdBy) {
          data.createdBy = req.user.id
        }

        // Validate brand ownership for non-admin users
        if (req.user && (req.user as any).role !== 'admin' && data.brand) {
          try {
            const brandId =
              typeof data.brand === 'object' ? data.brand.id || data.brand._id : data.brand
            const brandDoc = await req.payload.findByID({
              collection: 'brands',
              id: brandId,
              depth: 0,
            })
            const brandOwnerId =
              brandDoc?.owner && typeof brandDoc.owner === 'object'
                ? (brandDoc.owner as any).id
                : brandDoc?.owner

            if (brandOwnerId && String(brandOwnerId) !== String(req.user.id)) {
              throw new Error('You can only assign products to your own brands.')
            }
          } catch (err: any) {
            if (err.message === 'You can only assign products to your own brands.') {
              throw err
            }
          }
        }

        // 1. Slug auto-generation
        if (data.title && typeof data.title === 'string') {
          if (!data.slug || (!originalDoc?.slug && originalDoc?.status !== 'active')) {
            data.slug = slugify(data.title)
          }
        }

        // 2. Import currency from linked Brand
        const currentBrand = data.brand !== undefined ? data.brand : originalDoc?.brand
        if (currentBrand) {
          try {
            const brandId =
              typeof currentBrand === 'object' ? currentBrand.id || currentBrand._id : currentBrand
            const brandDoc = await req.payload.findByID({
              collection: 'brands',
              id: brandId,
              depth: 0,
            })
            if (brandDoc?.currency) {
              data.currency = brandDoc.currency
            }
          } catch {
            // fallback
          }
        }

        if (!data.currency) {
          data.currency = originalDoc?.currency || 'INR'
        }

        // 3. Deduplicate tag IDs
        if (Array.isArray(data.tags)) {
          const uniqueTagIds: string[] = []
          for (const t of data.tags) {
            const id = typeof t === 'object' && t ? String(t.id || t._id) : String(t)
            if (id && !uniqueTagIds.includes(id)) {
              uniqueTagIds.push(id)
            }
          }
          data.tags = uniqueTagIds
        }

        // 4. Validate Tags match selected Category
        const categoryId = data.category
          ? typeof data.category === 'object'
            ? String(data.category.id || data.category._id)
            : String(data.category)
          : originalDoc?.category
            ? typeof originalDoc.category === 'object'
              ? String(originalDoc.category.id || originalDoc.category._id)
              : String(originalDoc.category)
            : null

        const tagIds = Array.isArray(data.tags) ? data.tags : []

        // 5. Load tag documents (needed for both validation and attribute management)
        let tagDocs: any[] = []
        if (tagIds.length > 0) {
          if (!categoryId) {
            throw new Error('A category must be selected before attaching tags.')
          }

          const tagDocsRes = await req.payload.find({
            collection: 'tags',
            where: {
              id: {
                in: tagIds,
              },
            },
            limit: tagIds.length + 10,
            depth: 0,
          })
          tagDocs = tagDocsRes.docs

          const offendingTags = validateProductTags(tagDocs, categoryId)
          if (offendingTags.length > 0) {
            throw new Error(
              `The following tags do not belong to the selected category: ${offendingTags.join(', ')}`,
            )
          }
        }

        // 6. Collect unique labels from the selected tags (first-wins deduplication)
        const validLabelMap = new Map<string, { label: string; validation: any }>()
        for (const tagDoc of tagDocs) {
          if (!Array.isArray(tagDoc.attributes)) continue
          for (const attr of tagDoc.attributes) {
            if (!attr?.label) continue
            const trimmedLabel = attr.label.trim()
            const normalized = normalizeLabel(trimmedLabel)
            if (!validLabelMap.has(normalized)) {
              validLabelMap.set(normalized, {
                label: trimmedLabel,
                validation: attr.validation || {},
              })
            }
          }
        }

        // 7. Filter product attributes to only include labels that exist in the current tags.
        //    Strip any orphaned labels (from tags that were removed).
        const incomingAttrs: { label: string; value: string; id?: string }[] = Array.isArray(
          data.attributes,
        )
          ? data.attributes
          : []

        const filteredAttrs = incomingAttrs.filter((attr) => {
          if (!attr?.label) return false
          const normalized = normalizeLabel(attr.label.trim())
          return validLabelMap.has(normalized)
        })

        // 8. If attributes are provided for tags with attribute definitions, all defined attributes must have non-empty values
        if (validLabelMap.size > 0 && filteredAttrs.length > 0) {
          for (const [normalized, tagAttr] of validLabelMap.entries()) {
            const userAttr = filteredAttrs.find(
              (a) => normalizeLabel((a.label || '').trim()) === normalized,
            )
            const val =
              userAttr?.value !== undefined && userAttr?.value !== null
                ? String(userAttr.value).trim()
                : ''
            if (!val) {
              throw new Error(`Attribute "${tagAttr.label}" value cannot be empty.`)
            }
          }
        }

        // 9. Validate each attribute value against its tag-defined validation rules
        for (const attr of filteredAttrs) {
          const normalized = normalizeLabel(attr.label.trim())
          const tagAttr = validLabelMap.get(normalized)
          if (!tagAttr) continue

          const val = String(attr.value || '').trim()
          if (!val) {
            throw new Error(`Attribute "${attr.label}" value cannot be empty.`)
          }

          const { validation } = tagAttr
          const valType = validation?.type || 'text'

          if (valType === 'number') {
            const numVal = Number(val)
            if (isNaN(numVal)) {
              throw new Error(`Attribute "${attr.label}" must be a number.`)
            }
            if (typeof validation?.min === 'number' && numVal < validation.min) {
              throw new Error(
                `Attribute "${attr.label}" value (${numVal}) is below the minimum allowed (${validation.min}).`,
              )
            }
            if (typeof validation?.max === 'number' && numVal > validation.max) {
              throw new Error(
                `Attribute "${attr.label}" value (${numVal}) exceeds the maximum allowed (${validation.max}).`,
              )
            }
          } else {
            // text validation
            if (typeof validation?.min === 'number' && val.length < validation.min) {
              throw new Error(
                `Attribute "${attr.label}" value must be at least ${validation.min} characters.`,
              )
            }
            if (typeof validation?.max === 'number' && val.length > validation.max) {
              throw new Error(
                `Attribute "${attr.label}" value must not exceed ${validation.max} characters.`,
              )
            }
          }
        }

        // 9. Deduplicate attribute labels on the product (keep first occurrence per label)
        const seenAttrLabels = new Set<string>()
        const deduplicatedAttrs = filteredAttrs.filter((attr) => {
          const normalized = normalizeLabel(attr.label.trim())
          if (seenAttrLabels.has(normalized)) return false
          seenAttrLabels.add(normalized)
          return true
        })

        data.attributes = deduplicatedAttrs

        // 10. Publish Gate (when status is active)
        const targetStatus = data.status || originalDoc?.status || 'draft'
        if (targetStatus === 'active') {
          const missingFields: string[] = []

          const brand = data.brand !== undefined ? data.brand : originalDoc?.brand
          const hasBrand =
            brand !== null &&
            brand !== undefined &&
            (typeof brand === 'string' ? brand.trim().length > 0 : true)
          if (!hasBrand) missingFields.push('brand')

          const sellingPrice =
            data.sellingPrice !== undefined ? data.sellingPrice : originalDoc?.sellingPrice
          if (typeof sellingPrice !== 'number' || sellingPrice < 0) {
            missingFields.push('sellingPrice')
          }

          const stockStatus =
            data.stockStatus !== undefined ? data.stockStatus : originalDoc?.stockStatus
          if (!stockStatus) missingFields.push('stockStatus')

          if (missingFields.length > 0) {
            throw new Error(
              `Cannot publish product. The following required fields are missing: ${missingFields.join(', ')}`,
            )
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc }) => {
        if (!data) return data

        const sellingPrice =
          data.sellingPrice !== undefined ? data.sellingPrice : originalDoc?.sellingPrice
        const mrp = data.mrp !== undefined ? data.mrp : originalDoc?.mrp

        data.discountPercent = computeDiscount(sellingPrice, mrp)

        return data
      },
    ],
  },
}
