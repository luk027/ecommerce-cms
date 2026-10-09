import type { CollectionConfig } from 'payload'
import { isAdminOrProductOwner } from '@/access/productAccess'
import { productsFields } from './fields'
import { productsHooks } from './hooks'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    group: 'Catalog',
    defaultColumns: ['title', 'sku', 'category', 'status', 'sellingPrice', 'stockStatus'],
  },
  access: {
    // Logged-in users are scoped to their own products; public visitors see active products
    read: (args) =>
      args.req.user ? isAdminOrProductOwner(args) : { status: { equals: 'active' } },
    create: ({ req }) => Boolean(req.user),
    update: isAdminOrProductOwner,
    delete: isAdminOrProductOwner,
  },
  fields: productsFields,
  hooks: productsHooks,
}
