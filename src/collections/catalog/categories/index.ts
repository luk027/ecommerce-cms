import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { categoriesFields } from './fields'
import { categoriesHooks } from './hooks'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'createdAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: categoriesFields,
  hooks: categoriesHooks,
}
