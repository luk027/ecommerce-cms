import type { CollectionConfig } from 'payload'
import { isAdminOrOwner } from '@/access/ownerFilter'
import { brandsFields } from './fields'
import { brandsHooks } from './hooks'

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'category', 'currency', 'owner', 'createdAt'],
  },
  access: {
    read: isAdminOrOwner(),
    create: ({ req }) => Boolean(req.user),
    update: isAdminOrOwner(),
    delete: isAdminOrOwner(),
  },
  fields: brandsFields,
  hooks: brandsHooks,
}
