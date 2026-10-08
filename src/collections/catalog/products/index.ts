import type { CollectionConfig, Where } from 'payload'
import { resolveUserBrandIds } from '@/access/resolveUserBrandIds'
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
    read: async ({ req }): Promise<Where | boolean> => {
      // Admins have access to all products
      if ((req.user as any)?.role === 'admin') return true

      // If logged in as regular user, only see products for their brands or created by them
      if (req.user) {
        const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
        const orConditions: Where[] = []
        if (brandIds.length > 0) {
          orConditions.push({ brand: { in: brandIds } })
        }
        orConditions.push({ createdBy: { equals: req.user.id } })
        return { or: orConditions }
      }

      // Public visitors (frontend) see active products
      return {
        status: {
          equals: 'active',
        },
      }
    },
    create: ({ req }) => Boolean(req.user),
    update: async ({ req }): Promise<Where | boolean> => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
      const orConditions: Where[] = []
      if (brandIds.length > 0) {
        orConditions.push({ brand: { in: brandIds } })
      }
      orConditions.push({ createdBy: { equals: req.user.id } })
      return { or: orConditions }
    },
    delete: async ({ req }): Promise<Where | boolean> => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
      const orConditions: Where[] = []
      if (brandIds.length > 0) {
        orConditions.push({ brand: { in: brandIds } })
      }
      orConditions.push({ createdBy: { equals: req.user.id } })
      return { or: orConditions }
    },
  },
  fields: productsFields,
  hooks: productsHooks,
}
