import type { FieldAccess, PayloadRequest } from 'payload'

export const isAdmin = ({ req }: { req: PayloadRequest }): boolean => {
  return req.user?.role === 'admin'
}

export const isAdminField: FieldAccess = ({ req }) => {
  return req.user?.role === 'admin'
}
