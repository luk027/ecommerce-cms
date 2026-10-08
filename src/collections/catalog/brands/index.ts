import type { CollectionConfig } from 'payload'
import { brandsFields } from './fields'
import { brandsHooks } from './hooks'

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
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
  fields: brandsFields,
  hooks: brandsHooks,
}
