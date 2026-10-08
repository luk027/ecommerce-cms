import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { usersFields } from './fields'
import { usersHooks } from './hooks'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Accounts',
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
  fields: usersFields,
  hooks: usersHooks,
}
