import type { CollectionConfig } from 'payload'
import type { Product } from '@/payload-types'
import { isAdminField } from '@/access/isAdmin'
import { relationId } from '@/utilities/relationId'

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
    // Copied from the brand on save (see hooks), kept here so products can be filtered by category.
    name: 'category',
    type: 'relationship',
    relationTo: 'categories',
    hasMany: false,
    index: true,
    admin: {
      readOnly: true,
      description: "Set automatically from the brand's category.",
    },
  },
  {
    name: 'brand',
    type: 'relationship',
    relationTo: 'brands',
    required: true,
    hasMany: false,
    index: true,
    admin: {
      description: "Brand this product belongs to. The product takes the brand's category.",
    },
    filterOptions: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
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
      condition: (data, siblingData, { user }) => user?.role === 'admin',
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
      description: "Only tags in the brand's category can be chosen.",
    },
    filterOptions: async ({ siblingData, data, req }) => {
      const brandId =
        relationId(data?.brand) || relationId((siblingData as Partial<Product>)?.brand)
      if (!brandId) return false
      const brand = await req.payload.findByID({
        collection: 'brands',
        id: brandId,
        depth: 0,
        disableErrors: true,
        req,
      })
      const categoryId = relationId(brand?.category)
      return categoryId ? { category: { equals: categoryId } } : false
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
