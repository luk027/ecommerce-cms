import type { CollectionConfig } from 'payload'
import { normalizeLabel } from '../utilities/normalize'
import { unlinkTagFromProducts } from '../utilities/unlinkTag'
import { isAdmin } from '../access/isAdmin'

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
          'Define attribute labels or attribute groups for this tag. Product editors fill in the actual values per product.',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'single',
          options: [
            { label: 'Single / Individual', value: 'single' },
            { label: 'Group', value: 'group' },
          ],
          admin: {
            description: 'Choose whether this is a single attribute or a group of attributes.',
          },
        },
        {
          name: 'label',
          type: 'text',
          minLength: 1,
          maxLength: 60,
          admin: {
            description: 'Attribute name (e.g. "Screen Size", "Material", "Weight").',
            condition: (_, siblingData) => !siblingData?.type || siblingData?.type === 'single',
          },
        },
        {
          name: 'validation',
          type: 'group',
          admin: {
            description: 'Optional validation rules for the value entered on the product.',
            condition: (_, siblingData) => !siblingData?.type || siblingData?.type === 'single',
          },
          fields: [
            {
              name: 'type',
              type: 'select',
              defaultValue: 'text',
              options: [
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Boolean', value: 'boolean' },
              ],
              admin: {
                description: 'Value type expected when filling this attribute on a product.',
              },
            },
            {
              name: 'min',
              type: 'number',
              admin: {
                description:
                  'Minimum value (for Number type) or minimum character length (for Text type).',
                condition: (_, siblingData) =>
                  siblingData?.type === 'number' || siblingData?.type === 'text',
              },
            },
            {
              name: 'max',
              type: 'number',
              admin: {
                description:
                  'Maximum value (for Number type) or maximum character length (for Text type).',
                condition: (_, siblingData) =>
                  siblingData?.type === 'number' || siblingData?.type === 'text',
              },
            },
          ],
        },
        {
          name: 'groupName',
          type: 'text',
          minLength: 1,
          maxLength: 60,
          admin: {
            description:
              'Name of the attribute group (e.g. "Dimensions", "Technical Specifications").',
            condition: (_, siblingData) => siblingData?.type === 'group',
          },
        },
        {
          name: 'items',
          type: 'array',
          maxRows: 50,
          admin: {
            description: 'Attributes belonging to this group.',
            condition: (_, siblingData) => siblingData?.type === 'group',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              minLength: 1,
              maxLength: 60,
              admin: {
                description:
                  'Attribute name within this group (e.g. "Width", "Height", "Water Resistant").',
              },
            },
            {
              name: 'validation',
              type: 'group',
              admin: {
                description: 'Validation rules for this attribute.',
              },
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  defaultValue: 'text',
                  options: [
                    { label: 'Text', value: 'text' },
                    { label: 'Number', value: 'number' },
                    { label: 'Boolean', value: 'boolean' },
                  ],
                  admin: {
                    description: 'Value type expected when filling this attribute on a product.',
                  },
                },
                {
                  name: 'min',
                  type: 'number',
                  admin: {
                    description:
                      'Minimum value (for Number type) or minimum character length (for Text type).',
                    condition: (_, siblingData) =>
                      siblingData?.type === 'number' || siblingData?.type === 'text',
                  },
                },
                {
                  name: 'max',
                  type: 'number',
                  admin: {
                    description:
                      'Maximum value (for Number type) or maximum character length (for Text type).',
                    condition: (_, siblingData) =>
                      siblingData?.type === 'number' || siblingData?.type === 'text',
                  },
                },
              ],
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
              doc.name.toLowerCase().trim() === data.name.toLowerCase().trim(),
          )

          if (conflict) {
            throw new Error(`Tag with name "${data.name}" already exists.`)
          }
        }

        // Backward compatibility: if data has legacy categories array but no category, migrate it
        if (
          !data.category &&
          Array.isArray((data as any).categories) &&
          (data as any).categories.length > 0
        ) {
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
          const seenKeys = new Set<string>()

          for (let i = 0; i < data.attributes.length; i++) {
            const attr = data.attributes[i]
            if (!attr) continue

            if (attr.type === 'group' || (attr.groupName && Array.isArray(attr.items))) {
              const groupName = (attr.groupName || '').trim()
              if (!groupName) {
                throw new Error(`Attribute group at row ${i + 1} is missing a group name.`)
              }
              if (groupName.length > 60) {
                throw new Error(`Attribute group name "${groupName}" exceeds 60 characters.`)
              }

              if (!Array.isArray(attr.items) || attr.items.length === 0) {
                throw new Error(
                  `Attribute group "${groupName}" must contain at least one attribute.`,
                )
              }

              for (let j = 0; j < attr.items.length; j++) {
                const item = attr.items[j]
                if (!item) continue

                const label = (item.label || '').trim()
                if (!label) {
                  throw new Error(
                    `Attribute in group "${groupName}" (row ${j + 1}) is missing a label.`,
                  )
                }
                if (label.length > 60) {
                  throw new Error(
                    `Attribute label "${label}" in group "${groupName}" exceeds 60 characters.`,
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
                      throw new Error(
                        `Attribute "${label}" in group "${groupName}": min (${validation.min}) cannot be greater than max (${validation.max}).`,
                      )
                    }
                  }
                }

                const key = `${normalizeLabel(groupName)}::${normalizeLabel(label)}`
                if (seenKeys.has(key)) {
                  throw new Error(`Duplicate attribute label "${label}" in group "${groupName}".`)
                }
                seenKeys.add(key)
              }
            } else {
              const label = (attr.label || '').trim()

              if (!label) {
                throw new Error(`Attribute row ${i + 1} is missing a label.`)
              }
              if (label.length > 60) {
                throw new Error(`Attribute label "${label}" exceeds 60 characters.`)
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
                    throw new Error(
                      `Attribute "${label}": min (${validation.min}) cannot be greater than max (${validation.max}).`,
                    )
                  }
                }
              }

              const key = normalizeLabel(label)
              if (seenKeys.has(key)) {
                throw new Error(
                  `Duplicate attribute label "${label}" in tag. Labels must be unique within a tag.`,
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
          const prevCat = previousDoc.category
            ? typeof previousDoc.category === 'object'
              ? String(previousDoc.category.id || previousDoc.category._id)
              : String(previousDoc.category)
            : Array.isArray((previousDoc as any).categories) && (previousDoc as any).categories[0]
              ? typeof (previousDoc as any).categories[0] === 'object'
                ? String(
                    (previousDoc as any).categories[0].id || (previousDoc as any).categories[0]._id,
                  )
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
