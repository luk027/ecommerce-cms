import type { CollectionConfig } from 'payload'

export const categoriesFields: CollectionConfig['fields'] = [
  {
    name: 'name',
    type: 'text',
    required: true,
    unique: true,
    minLength: 1,
    maxLength: 60,
  },
]
