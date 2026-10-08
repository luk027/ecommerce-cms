import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access/isAdmin'

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'currency', 'owner', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true
      return {
        owner: {
          equals: req.user.id,
        },
      }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true
      return {
        owner: {
          equals: req.user.id,
        },
      }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true
      return {
        owner: {
          equals: req.user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      minLength: 1,
      maxLength: 80,
    },
    {
      name: 'details',
      type: 'textarea',
      admin: {
        description: 'Details and description for this brand.',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'INR',
      options: [
        { label: 'INR (₹)', value: 'INR' },
        { label: 'USD ($)', value: 'USD' },
        { label: 'EUR ()', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' },
      ],
      admin: {
        description: 'Currency used for all products under this brand.',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'Owner user of this brand. Automatically assigned.',
        condition: (data, siblingData, { user }) => (user as any)?.role === 'admin',
      },
      access: {
        update: isAdminField,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data

        if (typeof data.name === 'string') {
          data.name = data.name.trim()
        }

        if (operation === 'create' && req.user) {
          if (!data.owner || (req.user as any).role !== 'admin') {
            data.owner = req.user.id
          }
        }

        return data
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        const brandId = String(id)
        const productsCount = await req.payload.count({
          collection: 'products',
          where: {
            brand: {
              equals: brandId,
            },
          },
        })

        if (productsCount.totalDocs > 0) {
          throw new Error(
            'Cannot delete brand: it is referenced by ' + productsCount.totalDocs + ' product(s).'
          )
        }
      },
    ],
  },
}
