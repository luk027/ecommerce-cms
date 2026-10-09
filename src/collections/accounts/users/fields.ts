import type { CollectionConfig } from 'payload'
import { isAdminField } from '@/access/isAdmin'

export const usersFields: CollectionConfig['fields'] = [
  {
    name: 'role',
    type: 'select',
    required: true,
    defaultValue: 'seller',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'Seller', value: 'seller' },
    ],
    access: {
      update: isAdminField,
    },
    admin: {
      description: 'Admin has full access; Seller has access only to their own brands & products.',
    },
  },
]
