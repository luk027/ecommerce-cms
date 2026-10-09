import { APIError, type CollectionConfig } from 'payload'
import { normalizeLabel } from '@/utilities/normalize'
import { relationId } from '@/utilities/relationId'
import { unlinkTagFromProducts } from '@/utilities/unlinkTag'

// Tags used to store a `categories` array before moving to a single `category` relationship
type LegacyTagData = { categories?: unknown[] }

export const tagsHooks: NonNullable<CollectionConfig['hooks']> = {
  beforeValidate: [
    async ({ data, req, originalDoc }) => {
      if (!data) return data

      if (data.name && typeof data.name === 'string') {
        data.name = data.name.trim()
        if (data.name.length === 0) {
          throw new APIError('Tag name cannot be empty.', 400)
        }
        if (data.name.length > 60) {
          throw new APIError('Tag name cannot exceed 60 characters.', 400)
        }

        // Case-insensitive uniqueness check
        const existing = await req.payload.find({
          collection: 'tags',
          where: {
            name: {
              like: data.name,
            },
          },
          pagination: false,
          depth: 0,
          req,
        })

        const docId = originalDoc?.id || (data as { id?: string }).id
        const conflict = existing.docs.find(
          (doc) =>
            String(doc.id) !== String(docId) &&
            doc.name.toLowerCase().trim() === data.name.toLowerCase().trim(),
        )

        if (conflict) {
          throw new APIError(`Tag with name "${data.name}" already exists.`, 400)
        }
      }

      // Backward compatibility: if data has legacy categories array but no category, migrate it
      const legacyCategories = (data as LegacyTagData).categories
      if (!data.category && Array.isArray(legacyCategories) && legacyCategories.length > 0) {
        data.category = relationId(legacyCategories[0]) ?? undefined
      }

      // Validate category relationship
      const catId = relationId(data.category !== undefined ? data.category : originalDoc?.category)
      if (!catId) {
        throw new APIError('A tag must be associated with a category.', 400)
      }

      // Validate attribute labels are unique within this tag after normalization
      if (data.attributes && Array.isArray(data.attributes)) {
        const seenKeys = new Set<string>()

        for (let i = 0; i < data.attributes.length; i++) {
          const attr = data.attributes[i]
          if (!attr) continue

          if (attr.type === 'group' || (attr.groupName && Array.isArray(attr.items))) {
            const groupName = (attr.groupName || '').trim()
            if (!groupName) {
              throw new APIError(`Attribute group at row ${i + 1} is missing a group name.`, 400)
            }
            if (groupName.length > 60) {
              throw new APIError(`Attribute group name "${groupName}" exceeds 60 characters.`, 400)
            }

            if (!Array.isArray(attr.items) || attr.items.length === 0) {
              throw new APIError(
                `Attribute group "${groupName}" must contain at least one attribute.`,
                400,
              )
            }

            for (let j = 0; j < attr.items.length; j++) {
              const item = attr.items[j]
              if (!item) continue

              const label = (item.label || '').trim()
              if (!label) {
                throw new APIError(
                  `Attribute in group "${groupName}" (row ${j + 1}) is missing a label.`,
                  400,
                )
              }
              if (label.length > 60) {
                throw new APIError(
                  `Attribute label "${label}" in group "${groupName}" exceeds 60 characters.`,
                  400,
                )
              }

              const validation = item.validation || {}
              if (
                validation.type !== 'boolean' &&
                validation.min !== undefined &&
                validation.max !== undefined
              ) {
                if (typeof validation.min === 'number' && typeof validation.max === 'number') {
                  if (validation.min > validation.max) {
                    throw new APIError(
                      `Attribute "${label}" in group "${groupName}": min (${validation.min}) cannot be greater than max (${validation.max}).`,
                      400,
                    )
                  }
                }
              }

              const key = `${normalizeLabel(groupName)}::${normalizeLabel(label)}`
              if (seenKeys.has(key)) {
                throw new APIError(
                  `Duplicate attribute label "${label}" in group "${groupName}".`,
                  400,
                )
              }
              seenKeys.add(key)
            }
          } else {
            const label = (attr.label || '').trim()

            if (!label) {
              throw new APIError(`Attribute row ${i + 1} is missing a label.`, 400)
            }
            if (label.length > 60) {
              throw new APIError(`Attribute label "${label}" exceeds 60 characters.`, 400)
            }

            // Validate validation rules if present
            const validation = attr.validation || {}
            if (
              validation.type !== 'boolean' &&
              validation.min !== undefined &&
              validation.max !== undefined
            ) {
              if (typeof validation.min === 'number' && typeof validation.max === 'number') {
                if (validation.min > validation.max) {
                  throw new APIError(
                    `Attribute "${label}": min (${validation.min}) cannot be greater than max (${validation.max}).`,
                    400,
                  )
                }
              }
            }

            const key = normalizeLabel(label)
            if (seenKeys.has(key)) {
              throw new APIError(
                `Duplicate attribute label "${label}" in tag. Labels must be unique within a tag.`,
                400,
              )
            }
            seenKeys.add(key)
          }
        }
      }

      return data
    },
  ],
  afterChange: [
    async ({ doc, previousDoc, req, operation }) => {
      if (operation === 'update' && previousDoc) {
        const prevCat =
          relationId(previousDoc.category) ??
          relationId((previousDoc as LegacyTagData).categories?.[0])
        const currentCat = relationId(doc.category)

        if (prevCat && currentCat && prevCat !== currentCat) {
          await unlinkTagFromProducts(String(doc.id), req, [prevCat])
        }
      }
    },
  ],
  afterDelete: [
    async ({ id, req }) => {
      await unlinkTagFromProducts(String(id), req)
    },
  ],
}
