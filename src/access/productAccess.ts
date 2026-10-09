import type { Access, Where } from 'payload'
import { resolveUserBrandIds } from './resolveUserBrandIds'

/**
 * Admins get full access. Other logged-in users are scoped to products under
 * brands they own or products they created. Anonymous users are denied.
 */
export const isAdminOrProductOwner: Access = async ({ req }) => {
  if (!req.user) return false
  if ((req.user as any).role === 'admin') return true

  const brandIds = await resolveUserBrandIds(req.payload, req.user.id)
  const orConditions: Where[] = []
  if (brandIds.length > 0) {
    orConditions.push({ brand: { in: brandIds } })
  }
  orConditions.push({ createdBy: { equals: req.user.id } })
  return { or: orConditions }
}
