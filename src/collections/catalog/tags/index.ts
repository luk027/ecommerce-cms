import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { tagsFields } from './fields'
import { tagsHooks } from './hooks'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'category', 'createdAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: tagsFields,
  hooks: tagsHooks,
}
