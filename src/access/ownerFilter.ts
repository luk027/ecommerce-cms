import type { Access } from 'payload'

export const isAdminOrOwner = (ownerField = 'owner'): Access => {
  return ({ req }) => {
    if (!req.user) return false
    if ((req.user as any).role === 'admin') return true

    return {
      [ownerField]: {
        equals: req.user.id,
      },
    }
  }
}
