import type { CollectionConfig } from 'payload'

export const usersHooks: NonNullable<CollectionConfig['hooks']> = {
  beforeChange: [
    async ({ req, operation, data }) => {
      if (operation === 'create') {
        const userCount = await req.payload.count({ collection: 'users', req })
        if (userCount.totalDocs === 0) {
          data.role = 'admin'
        }
      }
      return data
    },
  ],
}
