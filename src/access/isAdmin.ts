import type { AccessArgs, FieldAccess } from 'payload'

export const isAdmin = ({ req }: AccessArgs | { req: any }): boolean => {
  return Boolean(req.user && (req.user as any).role === 'admin')
}

export const isAdminField: FieldAccess = ({ req }) => {
  return Boolean(req.user && (req.user as any).role === 'admin')
}
