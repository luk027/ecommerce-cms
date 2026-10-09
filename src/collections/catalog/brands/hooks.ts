import { APIError, type CollectionConfig } from 'payload'

export const brandsHooks: NonNullable<CollectionConfig['hooks']> = {
  beforeValidate: [
    async ({ data, req, operation }) => {
      if (!data) return data

      if (typeof data.name === 'string') {
        data.name = data.name.trim()
      }

      if (operation === 'create' && req.user) {
        if (!data.owner || req.user.role !== 'admin') {
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
        req,
        where: {
          brand: {
            equals: brandId,
          },
        },
      })

      if (productsCount.totalDocs > 0) {
        throw new APIError(
          'Cannot delete brand: it is referenced by ' + productsCount.totalDocs + ' product(s).',
          400,
        )
      }
    },
  ],
}
