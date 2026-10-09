import type { CollectionConfig } from 'payload'
import { isAdminField } from '@/access/isAdmin'

export const productsFields: CollectionConfig['fields'] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'Auto-generated from title. Immutable once published.',
    },
  },
  {
    name: 'sku',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
    },
  },
  {
    name: 'status',
    type: 'select',
    required: true,
    defaultValue: 'draft',
    index: true,
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
    ],
    admin: {
      position: 'sidebar',
    },
  },
  {
    name: 'category',
    type: 'relationship',
    relationTo: 'categories',
    required: true,
    hasMany: false,
    index: true,
    admin: {
      description: 'Category this product belongs to.',
    },
  },
  {
    name: 'brand',
    type: 'relationship',
    relationTo: 'brands',
    hasMany: false,
    index: true,
    admin: {
      description: 'Brand this product belongs to.',
    },
    filterOptions: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true
      return {
        owner: {
          equals: req.user.id,
        },
      }
    },
  },
  {
    name: 'createdBy',
    type: 'relationship',
    relationTo: 'users',
    access: {
      update: isAdminField,
    },
    admin: {
      readOnly: true,
      position: 'sidebar',
      condition: (data, siblingData, { user }) => (user as any)?.role === 'admin',
    },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'sellingPrice',
        type: 'number',
        min: 0,
        admin: {
          width: '33%',
        },
      },
      {
        name: 'mrp',
        type: 'number',
        min: 0,
        admin: {
          width: '33%',
        },
      },
      {
        name: 'discountPercent',
        type: 'number',
        admin: {
          width: '33%',
          readOnly: true,
        },
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'currency',
        type: 'select',
        defaultValue: 'INR',
        options: [{ label: 'INR (₹)', value: 'INR' }],
        admin: {
          width: '33%',
          readOnly: true,
          description: 'Inherited from Brand currency.',
        },
      },
      {
        name: 'stockStatus',
        type: 'select',
        options: [
          { label: 'In Stock', value: 'in_stock' },
          { label: 'Out of Stock', value: 'out_of_stock' },
          { label: 'Pre-Order', value: 'preorder' },
          { label: 'Discontinued', value: 'discontinued' },
        ],
        admin: {
          width: '33%',
        },
      },
      {
        name: 'stockQuantity',
        type: 'number',
        min: 0,
        admin: {
          width: '33%',
        },
      },
    ],
  },

  {
    name: 'tags',
    type: 'relationship',
    relationTo: 'tags',
    hasMany: true,
    index: true,
    admin: {
      description: 'Only tags matching the selected category can be chosen.',
    },
    filterOptions: ({ siblingData, data }) => {
      const cat = (data as any)?.category || (siblingData as any)?.category
      if (!cat) return false
      const catId = typeof cat === 'object' && cat ? cat.id || cat._id : cat
      return {
        category: {
          equals: catId,
        },
      }
    },
  },
  {
    name: 'attributes',
    type: 'json',
    admin: {
      description:
        'Attribute values for this product. Automatically populated when selected tags define attributes.',
      components: {
        Field: '@/components/ProductAttributesField#ProductAttributesField',
      },
    },
  },
]
