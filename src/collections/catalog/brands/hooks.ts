import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { relationId } from '@/utilities/relationId'

async function countProducts(req: PayloadRequest, brandId: string) {
  const { totalDocs } = await req.payload.count({
    collection: 'products',
    req,
    where: {
      brand: {
        equals: brandId,
      },
    },
  })
  return totalDocs
}

export const brandsHooks: NonNullable<CollectionConfig['hooks']> = {
  beforeValidate: [
    async ({ data, req, operation, originalDoc }) => {
      if (!data) return data

      if (typeof data.name === 'string') {
        data.name = data.name.trim()
      }

      if (operation === 'create' && req.user) {
        if (!data.owner || req.user.role !== 'admin') {
          data.owner = req.user.id
        }
      }

      // Products take their category from the brand, so it's fixed once the brand has products.
      if (operation === 'update' && originalDoc && data.category !== undefined) {
        const from = relationId(originalDoc.category)
        const to = relationId(data.category)
        if (from && from !== to) {
          const productCount = await countProducts(req, String(originalDoc.id))
          if (productCount > 0) {
            throw new APIError(
              `Cannot change the category: this brand has ${productCount} product(s).`,
              400,
            )
          }
        }
      }

      return data
    },
  ],
  beforeDelete: [
    async ({ req, id }) => {
      const productCount = await countProducts(req, String(id))

      if (productCount > 0) {
        throw new APIError(
          'Cannot delete brand: it is referenced by ' + productCount + ' product(s).',
          400,
        )
      }
    },
  ],
}
