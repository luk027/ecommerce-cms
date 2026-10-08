import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access/isAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
    hidden: ({ user }) => (user as any)?.role !== 'admin',
  },
  auth: true,
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true
      return {
        id: {
          equals: req.user.id,
        },
      }
    },
    create: isAdmin,
    update: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true
      return {
        id: {
          equals: req.user.id,
        },
      }
    },
    delete: isAdmin,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      access: {
        update: isAdminField,
      },
      admin: {
        description: 'Admin has full access; User has access only to their own brands & products.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const userCount = await req.payload.count({ collection: 'users' })
          if (userCount.totalDocs === 0) {
            data.role = 'admin'
          }
        }
        return data
      },
    ],
  },
}
