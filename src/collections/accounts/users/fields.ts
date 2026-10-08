import type { CollectionConfig } from 'payload'
import { isAdminField } from '@/access/isAdmin'

export const usersFields: CollectionConfig['fields'] = [
  {
    name: 'role',
    type: 'select',
    required: true,
    defaultValue: 'user',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
    ],
    access: {
      update: isAdminField,
    },
    admin: {
      description: 'Admin has full access; User has access only to their own brands & products.',
    },
  },
]
