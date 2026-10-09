import type { CollectionConfig } from 'payload'
import { isAdminField } from '@/access/isAdmin'

export const brandsFields: CollectionConfig['fields'] = [
  {
    name: 'name',
    type: 'text',
    required: true,
    minLength: 1,
    maxLength: 80,
  },
  {
    name: 'category',
    type: 'relationship',
    relationTo: 'categories',
    required: true,
    hasMany: false,
    index: true,
    admin: {
      description:
        "Every product in this brand belongs to this category and uses its tags. Can't be changed once the brand has products.",
    },
  },
  {
    name: 'details',
    type: 'textarea',
    admin: {
      description: 'Details and description for this brand.',
    },
  },
  {
    name: 'currency',
    type: 'select',
    required: true,
    defaultValue: 'INR',
    options: [{ label: 'INR (₹)', value: 'INR' }],
    admin: {
      description: 'Currency used for all products under this brand.',
    },
  },
  {
    name: 'owner',
    type: 'relationship',
    relationTo: 'users',
    required: true,
    index: true,
    admin: {
      description: 'Owner user of this brand. Automatically assigned.',
      condition: (data, siblingData, { user }) => user?.role === 'admin',
    },
    access: {
      update: isAdminField,
    },
  },
]
