import { APIError, type CollectionConfig } from 'payload'
import { slugify, normalizeLabel } from '@/utilities/normalize'
import { validateProductTags } from '@/utilities/validateTags'
import { computeDiscount } from '@/utilities/computeDiscount'

export const productsHooks: NonNullable<CollectionConfig['hooks']> = {
  beforeValidate: [
    async ({ data, req, originalDoc, operation }) => {
      if (!data) return data

      const isAdminUser = (req.user as any)?.role === 'admin'

      // Set createdBy on create. Only admins may assign a product to another user.
      if (req.user && operation === 'create' && (!isAdminUser || !data.createdBy)) {
        data.createdBy = req.user.id
      }

      // Load the linked brand once: used for the ownership check and currency inheritance
      const currentBrand = data.brand !== undefined ? data.brand : originalDoc?.brand
      const brandDoc = currentBrand
        ? await req.payload.findByID({
            collection: 'brands',
            id:
              typeof currentBrand === 'object' ? currentBrand.id || currentBrand._id : currentBrand,
            depth: 0,
            disableErrors: true,
            req,
          })
        : null

      // Validate brand ownership for non-admin users
      if (req.user && !isAdminUser && brandDoc) {
        const brandOwnerId =
          brandDoc.owner && typeof brandDoc.owner === 'object'
            ? (brandDoc.owner as any).id
            : brandDoc.owner

        if (brandOwnerId && String(brandOwnerId) !== String(req.user.id)) {
          throw new APIError('You can only assign products to your own brands.', 400)
        }
      }

      // 1. Slug auto-generation (immutable once the product has been published)
      if (originalDoc?.status === 'active' && originalDoc.slug) {
        data.slug = originalDoc.slug
      } else if (data.title && typeof data.title === 'string' && !data.slug) {
        data.slug = slugify(data.title)
      }

      // 2. Import currency from linked Brand
      if (brandDoc?.currency) {
        data.currency = brandDoc.currency
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
          throw new APIError('A category must be selected before attaching tags.', 400)
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
          req,
        })
        tagDocs = tagDocsRes.docs

        const offendingTags = validateProductTags(tagDocs, categoryId)
        if (offendingTags.length > 0) {
          throw new APIError(
            `The following tags do not belong to the selected category: ${offendingTags.join(', ')}`,
            400,
          )
        }
      }

      // 6. Collect unique labels from the selected tags (first-wins deduplication)
      const validLabelMap = new Map<string, { label: string; group?: string; validation: any }>()
      const tagAttrByLabel = new Map<string, { label: string; group?: string; validation: any }>()

      for (const tagDoc of tagDocs) {
        if (!Array.isArray(tagDoc.attributes)) continue
        for (const attr of tagDoc.attributes) {
          if (!attr) continue
          if (attr.type === 'group' || (attr.groupName && Array.isArray(attr.items))) {
            const groupName = (attr.groupName || '').trim()
            if (Array.isArray(attr.items)) {
              for (const item of attr.items) {
                if (!item?.label) continue
                const trimmedLabel = item.label.trim()
                const key = groupName
                  ? `${normalizeLabel(groupName)}::${normalizeLabel(trimmedLabel)}`
                  : normalizeLabel(trimmedLabel)
                const def = {
                  label: trimmedLabel,
                  group: groupName || undefined,
                  validation: item.validation || {},
                }
                if (!validLabelMap.has(key)) {
                  validLabelMap.set(key, def)
                }
                if (!tagAttrByLabel.has(normalizeLabel(trimmedLabel))) {
                  tagAttrByLabel.set(normalizeLabel(trimmedLabel), def)
                }
              }
            }
          } else {
            if (!attr.label) continue
            const trimmedLabel = attr.label.trim()
            const key = normalizeLabel(trimmedLabel)
            const def = {
              label: trimmedLabel,
              group: undefined,
              validation: attr.validation || {},
            }
            if (!validLabelMap.has(key)) {
              validLabelMap.set(key, def)
            }
            if (!tagAttrByLabel.has(key)) {
              tagAttrByLabel.set(key, def)
            }
          }
        }
      }

      // 7. Filter product attributes to only include labels that exist in the current tags.
      //    Strip any orphaned labels (from tags that were removed).
      const incomingAttrs: { label: string; value: any; group?: string; id?: string }[] =
        Array.isArray(data.attributes) ? data.attributes : []

      const filteredAttrs = incomingAttrs
        .filter((attr) => {
          if (!attr?.label) return false
          const trimmedLabel = attr.label.trim()
          const groupName = attr.group?.trim()
          const key = groupName
            ? `${normalizeLabel(groupName)}::${normalizeLabel(trimmedLabel)}`
            : normalizeLabel(trimmedLabel)
          return validLabelMap.has(key) || tagAttrByLabel.has(normalizeLabel(trimmedLabel))
        })
        .map((attr) => {
          const trimmedLabel = attr.label.trim()
          const groupName = attr.group?.trim()
          const key = groupName
            ? `${normalizeLabel(groupName)}::${normalizeLabel(trimmedLabel)}`
            : normalizeLabel(trimmedLabel)
          const matchedTagAttr =
            validLabelMap.get(key) || tagAttrByLabel.get(normalizeLabel(trimmedLabel))
          return {
            ...attr,
            label: matchedTagAttr?.label || trimmedLabel,
            group: matchedTagAttr?.group || groupName || undefined,
          }
        })

      // 8. All tag-defined attributes must have values when any are provided, and always on publish
      const targetStatus = data.status || originalDoc?.status || 'draft'
      if (validLabelMap.size > 0 && (filteredAttrs.length > 0 || targetStatus === 'active')) {
        for (const [key, tagAttr] of validLabelMap.entries()) {
          const userAttr = filteredAttrs.find((a) => {
            const aLabel = normalizeLabel((a.label || '').trim())
            const aGroup = a.group ? normalizeLabel(a.group.trim()) : ''
            const aKey = aGroup ? `${aGroup}::${aLabel}` : aLabel
            return aKey === key || aLabel === normalizeLabel(tagAttr.label)
          })
          const val =
            userAttr?.value !== undefined && userAttr?.value !== null
              ? String(userAttr.value).trim()
              : ''
          if (!val) {
            const displayLabel = tagAttr.group
              ? `${tagAttr.group} > ${tagAttr.label}`
              : tagAttr.label
            throw new APIError(`Attribute "${displayLabel}" value cannot be empty.`, 400)
          }
        }
      }

      // 9. Validate each attribute value against its tag-defined validation rules
      for (const attr of filteredAttrs) {
        const trimmedLabel = attr.label.trim()
        const groupName = attr.group?.trim()
        const key = groupName
          ? `${normalizeLabel(groupName)}::${normalizeLabel(trimmedLabel)}`
          : normalizeLabel(trimmedLabel)
        const tagAttr = validLabelMap.get(key) || tagAttrByLabel.get(normalizeLabel(trimmedLabel))
        if (!tagAttr) continue

        const rawVal = String(attr.value ?? '').trim()
        const displayLabel = tagAttr.group ? `${tagAttr.group} > ${tagAttr.label}` : tagAttr.label
        if (!rawVal) {
          throw new APIError(`Attribute "${displayLabel}" value cannot be empty.`, 400)
        }

        const { validation } = tagAttr
        const valType = validation?.type || 'text'

        if (valType === 'boolean') {
          const lower = rawVal.toLowerCase()
          const boolNorm =
            lower === 'true' || lower === 'yes' || lower === '1'
              ? 'true'
              : lower === 'false' || lower === 'no' || lower === '0'
                ? 'false'
                : null

          if (!boolNorm) {
            throw new APIError(`Attribute "${displayLabel}" must be either "true" or "false".`, 400)
          }
          attr.value = boolNorm
        } else if (valType === 'number') {
          const numVal = Number(rawVal)
          if (isNaN(numVal)) {
            throw new APIError(`Attribute "${displayLabel}" must be a number.`, 400)
          }
          if (typeof validation?.min === 'number' && numVal < validation.min) {
            throw new APIError(
              `Attribute "${displayLabel}" value (${numVal}) is below the minimum allowed (${validation.min}).`,
              400,
            )
          }
          if (typeof validation?.max === 'number' && numVal > validation.max) {
            throw new APIError(
              `Attribute "${displayLabel}" value (${numVal}) exceeds the maximum allowed (${validation.max}).`,
              400,
            )
          }
        } else {
          // text validation
          if (typeof validation?.min === 'number' && rawVal.length < validation.min) {
            throw new APIError(
              `Attribute "${displayLabel}" value must be at least ${validation.min} characters.`,
              400,
            )
          }
          if (typeof validation?.max === 'number' && rawVal.length > validation.max) {
            throw new APIError(
              `Attribute "${displayLabel}" value must not exceed ${validation.max} characters.`,
              400,
            )
          }
        }
      }

      // Deduplicate attribute entries on the product (keep first occurrence per group+label)
      const seenAttrKeys = new Set<string>()
      const deduplicatedAttrs = filteredAttrs
        .map((attr) => {
          const trimmedLabel = attr.label.trim()
          const groupName = attr.group?.trim()
          const key = groupName
            ? `${normalizeLabel(groupName)}::${normalizeLabel(trimmedLabel)}`
            : normalizeLabel(trimmedLabel)
          const tagAttr = validLabelMap.get(key) || tagAttrByLabel.get(normalizeLabel(trimmedLabel))
          return {
            label: tagAttr?.label || trimmedLabel,
            value: String(attr.value ?? '').trim(),
            ...(tagAttr?.group ? { group: tagAttr.group } : groupName ? { group: groupName } : {}),
          }
        })
        .filter((attr) => {
          const key = attr.group
            ? `${normalizeLabel(attr.group)}::${normalizeLabel(attr.label)}`
            : normalizeLabel(attr.label)
          if (seenAttrKeys.has(key)) return false
          seenAttrKeys.add(key)
          return true
        })

      data.attributes = deduplicatedAttrs

      // 10. Publish Gate (when status is active)
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
          throw new APIError(
            `Cannot publish product. The following required fields are missing: ${missingFields.join(', ')}`,
            400,
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
}
