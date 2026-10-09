import { APIError, type CollectionConfig } from 'payload'

export const categoriesHooks: NonNullable<CollectionConfig['hooks']> = {
  beforeValidate: [
    async ({ data, req, originalDoc }) => {
      if (data?.name && typeof data.name === 'string') {
        data.name = data.name.trim()
        if (data.name.length === 0) {
          throw new APIError('Category name cannot be empty.', 400)
        }
        if (data.name.length > 60) {
          throw new APIError('Category name cannot exceed 60 characters.', 400)
        }

        // Case-insensitive uniqueness check
        const existing = await req.payload.find({
          collection: 'categories',
          where: {
            name: {
              like: data.name,
            },
          },
          pagination: false,
          depth: 0,
          req,
        })

        const docId = originalDoc?.id || (data as any)?.id
        const conflict = existing.docs.find(
          (doc) =>
            String(doc.id) !== String(docId) &&
            doc.name.toLowerCase().trim() === data.name.toLowerCase().trim(),
        )

        if (conflict) {
          throw new APIError(`Category with name "${data.name}" already exists.`, 400)
        }
      }
      return data
    },
  ],
  beforeDelete: [
    async ({ req, id }) => {
      const categoryId = String(id)

      // 1. Check if any product references this category
      const productsCount = await req.payload.count({
        collection: 'products',
        req,
        where: {
          category: {
            equals: categoryId,
          },
        },
      })

      if (productsCount.totalDocs > 0) {
        throw new APIError(
          `Cannot delete category: it is referenced by ${productsCount.totalDocs} product(s).`,
          400,
        )
      }

      // 2. Check if any tag references this category
      const tagsCount = await req.payload.count({
        collection: 'tags',
        req,
        where: {
          category: {
            equals: categoryId,
          },
        },
      })

      if (tagsCount.totalDocs > 0) {
        throw new APIError(
          `Cannot delete category: it is referenced by ${tagsCount.totalDocs} tag(s).`,
          400,
        )
      }
    },
  ],
}
