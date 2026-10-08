import type { CollectionConfig } from 'payload'
import { normalizeLabel } from '../lib/catalog/normalize'
import { unlinkTagFromProducts } from '../lib/catalog/unlinkTag'
import { isAdmin } from '../lib/access/isAdmin'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'createdAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      minLength: 1,
      maxLength: 60,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      required: true,
      index: true,
      admin: {
        description: 'Select the category this tag belongs to.',
      },
    },
    {
      name: 'attributes',
      type: 'array',
      maxRows: 50,
      admin: {
        description:
          'Define attribute labels for this tag. Product editors fill in the actual values per product.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          minLength: 1,
          maxLength: 60,
          admin: {
            description: 'Attribute name (e.g. "Screen Size", "Material", "Weight").',
          },
        },
        {
          name: 'validation',
          type: 'group',
          admin: {
            description: 'Optional validation rules for the value entered on the product.',
          },
          fields: [
            {
              name: 'type',
              type: 'select',
              defaultValue: 'text',
              options: [
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
              ],
              admin: {
                description: 'Value type expected when filling this attribute on a product.',
              },
            },
            {
              name: 'min',
              type: 'number',
              admin: {
                description: 'Minimum value (for Number type) or minimum character length (for Text type).',
                condition: (_, siblingData) => siblingData?.type === 'number' || siblingData?.type === 'text',
              },
            },
            {
              name: 'max',
              type: 'number',
              admin: {
                description: 'Maximum value (for Number type) or maximum character length (for Text type).',
                condition: (_, siblingData) => siblingData?.type === 'number' || siblingData?.type === 'text',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        if (!data) return data

        if (data.name && typeof data.name === 'string') {
          data.name = data.name.trim()
          if (data.name.length === 0) {
            throw new Error('Tag name cannot be empty.')
          }
          if (data.name.length > 60) {
            throw new Error('Tag name cannot exceed 60 characters.')
          }

          // Case-insensitive uniqueness check
          const existing = await req.payload.find({
            collection: 'tags',
            where: {
              name: {
                like: data.name,
              },
            },
            limit: 10,
          })

          const docId = originalDoc?.id || (data as any)?.id
          const conflict = existing.docs.find(
            (doc) =>
              String(doc.id) !== String(docId) &&
              doc.name.toLowerCase().trim() === data.name.toLowerCase().trim()
          )

          if (conflict) {
            throw new Error(`Tag with name "${data.name}" already exists.`)
          }
        }

        // Backward compatibility: if data has legacy categories array but no category, migrate it
        if (!data.category && Array.isArray((data as any).categories) && (data as any).categories.length > 0) {
          data.category = (data as any).categories[0]
        }

        // Validate category relationship
        const catVal = data.category !== undefined ? data.category : originalDoc?.category
        const catId = typeof catVal === 'object' && catVal ? catVal.id || catVal._id : catVal
        if (!catId) {
          throw new Error('A tag must be associated with a category.')
        }

        // Validate attribute labels are unique within this tag after normalization
        if (data.attributes && Array.isArray(data.attributes)) {
          const seenLabels = new Set<string>()

          for (let i = 0; i < data.attributes.length; i++) {
            const attr = data.attributes[i]
            if (!attr) continue

            const label = (attr.label || '').trim()

            if (!label) {
              throw new Error(`Attribute row ${i + 1} is missing a label.`)
            }
            if (label.length > 60) {
              throw new Error(`Attribute label "${label}" exceeds 60 characters.`)
            }

            // Validate validation rules if present
            const validation = attr.validation || {}
            if (validation.min !== undefined && validation.max !== undefined) {
              if (typeof validation.min === 'number' && typeof validation.max === 'number') {
                if (validation.min > validation.max) {
                  throw new Error(
                    `Attribute "${label}": min (${validation.min}) cannot be greater than max (${validation.max}).`
                  )
                }
              }
            }

            const normalized = normalizeLabel(label)
            if (seenLabels.has(normalized)) {
              throw new Error(
                `Duplicate attribute label "${label}" in tag. Labels must be unique within a tag.`
              )
            }
            seenLabels.add(normalized)
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation === 'update' && previousDoc) {
          const prevCat = previousDoc.category
            ? typeof previousDoc.category === 'object'
              ? String(previousDoc.category.id || previousDoc.category._id)
              : String(previousDoc.category)
            : Array.isArray((previousDoc as any).categories) && (previousDoc as any).categories[0]
              ? typeof (previousDoc as any).categories[0] === 'object'
                ? String((previousDoc as any).categories[0].id || (previousDoc as any).categories[0]._id)
                : String((previousDoc as any).categories[0])
              : null

          const currentCat = doc.category
            ? typeof doc.category === 'object'
              ? String(doc.category.id || doc.category._id)
              : String(doc.category)
            : null

          if (prevCat && currentCat && prevCat !== currentCat) {
            await unlinkTagFromProducts(String(doc.id), req.payload, [prevCat])
          }
        }
      },
    ],
    afterDelete: [
      async ({ id, req }) => {
        await unlinkTagFromProducts(String(id), req.payload)
      },
    ],
  },
}
