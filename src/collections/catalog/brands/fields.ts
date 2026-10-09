import type { CollectionConfig } from 'payload'
import { isAdminField } from '@/access/isAdmin'
import { validatePhone, validateWebsite } from '@/utilities/validateContact'

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
    type: 'row',
    fields: [
      {
        name: 'website',
        label: 'Website URL',
        type: 'text',
        validate: validateWebsite,
        admin: { width: '34%', placeholder: 'https://example.com' },
      },
      {
        name: 'email',
        type: 'email',
        admin: { width: '33%' },
      },
      {
        name: 'phone',
        label: 'Phone number',
        type: 'text',
        validate: validatePhone,
        admin: { width: '33%', placeholder: '+91 98765 43210' },
      },
    ],
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
    // Which contact details have been verified. Only admins can change these for now;
    // email-based verification for sellers will come later.
    name: 'verified',
    type: 'group',
    access: {
      create: isAdminField,
      update: isAdminField,
    },
    admin: {
      position: 'sidebar',
      description: 'New brands start with nothing verified.',
    },
    fields: [
      { name: 'email', type: 'checkbox', defaultValue: false },
      { name: 'phone', type: 'checkbox', defaultValue: false },
    ],
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
