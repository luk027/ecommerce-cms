import type { CollectionConfig } from 'payload'

export const tagsFields: CollectionConfig['fields'] = [
  {
    name: 'name',
    type: 'text',
    required: true,
    unique: true,
    minLength: 1,
    maxLength: 60,
  },
  {
    name: 'category',
    type: 'relationship',
    relationTo: 'categories',
    hasMany: false,
    required: true,
    index: true,
    admin: {
      description: 'Select the category this tag belongs to.',
    },
  },
  {
    name: 'attributes',
    type: 'array',
    maxRows: 50,
    admin: {
      description:
        'Define attribute labels or attribute groups for this tag. Product editors fill in the actual values per product.',
    },
    fields: [
      {
        name: 'type',
        type: 'select',
        defaultValue: 'single',
        options: [
          { label: 'Single / Individual', value: 'single' },
          { label: 'Group', value: 'group' },
        ],
        admin: {
          description: 'Choose whether this is a single attribute or a group of attributes.',
        },
      },
      {
        name: 'label',
        type: 'text',
        minLength: 1,
        maxLength: 60,
        admin: {
          description: 'Attribute name (e.g. "Screen Size", "Material", "Weight").',
          condition: (_, siblingData) => !siblingData?.type || siblingData?.type === 'single',
        },
      },
      {
        name: 'validation',
        type: 'group',
        admin: {
          description: 'Optional validation rules for the value entered on the product.',
          condition: (_, siblingData) => !siblingData?.type || siblingData?.type === 'single',
        },
        fields: [
          {
            name: 'type',
            type: 'select',
            defaultValue: 'text',
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
            ],
            admin: {
              description: 'Value type expected when filling this attribute on a product.',
            },
          },
          {
            name: 'min',
            type: 'number',
            admin: {
              description:
                'Minimum value (for Number type) or minimum character length (for Text type).',
              condition: (_, siblingData) =>
                siblingData?.type === 'number' || siblingData?.type === 'text',
            },
          },
          {
            name: 'max',
            type: 'number',
            admin: {
              description:
                'Maximum value (for Number type) or maximum character length (for Text type).',
              condition: (_, siblingData) =>
                siblingData?.type === 'number' || siblingData?.type === 'text',
            },
          },
        ],
      },
      {
        name: 'groupName',
        type: 'text',
        minLength: 1,
        maxLength: 60,
        admin: {
          description:
            'Name of the attribute group (e.g. "Dimensions", "Technical Specifications").',
          condition: (_, siblingData) => siblingData?.type === 'group',
        },
      },
      {
        name: 'items',
        type: 'array',
        maxRows: 50,
        admin: {
          description: 'Attributes belonging to this group.',
          condition: (_, siblingData) => siblingData?.type === 'group',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            required: true,
            minLength: 1,
            maxLength: 60,
            admin: {
              description:
                'Attribute name within this group (e.g. "Width", "Height", "Water Resistant").',
            },
          },
          {
            name: 'validation',
            type: 'group',
            admin: {
              description: 'Validation rules for this attribute.',
            },
            fields: [
              {
                name: 'type',
                type: 'select',
                defaultValue: 'text',
                options: [
                  { label: 'Text', value: 'text' },
                  { label: 'Number', value: 'number' },
                  { label: 'Boolean', value: 'boolean' },
                ],
                admin: {
                  description: 'Value type expected when filling this attribute on a product.',
                },
              },
              {
                name: 'min',
                type: 'number',
                admin: {
                  description:
                    'Minimum value (for Number type) or minimum character length (for Text type).',
                  condition: (_, siblingData) =>
                    siblingData?.type === 'number' || siblingData?.type === 'text',
                },
              },
              {
                name: 'max',
                type: 'number',
                admin: {
                  description:
                    'Maximum value (for Number type) or maximum character length (for Text type).',
                  condition: (_, siblingData) =>
                    siblingData?.type === 'number' || siblingData?.type === 'text',
                },
              },
            ],
          },
        ],
      },
    ],
  },
]
