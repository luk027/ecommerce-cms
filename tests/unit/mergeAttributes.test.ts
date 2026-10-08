import { describe, it, expect } from 'vitest'
import { mergeTagAttributeDefs, mergeProductAttributes } from '@/lib/catalog/mergeAttributes'

describe('mergeTagAttributeDefs', () => {
  it('returns empty array when input is null, undefined, or empty', () => {
    expect(mergeTagAttributeDefs(null)).toEqual([])
    expect(mergeTagAttributeDefs(undefined)).toEqual([])
    expect(mergeTagAttributeDefs([])).toEqual([])
  })

  it('collects labels from tags in order, deduplicates normalized labels (first wins)', () => {
    const tag1 = {
      id: 'tag-1',
      name: 'Skincare',
      attributes: [
        { label: 'Skin Type', validation: { type: 'text' } },
        { label: 'Dermatologically Tested', validation: { type: 'text' } },
      ],
    }

    const tag2 = {
      id: 'tag-2',
      name: 'Body Lotion',
      attributes: [
        { label: 'skin  type', validation: { type: 'text' } }, // duplicate normalized label, should be ignored
        { label: 'Paraben Free', validation: { type: 'text' } },
      ],
    }

    const result = mergeTagAttributeDefs([tag1, tag2])

    expect(result).toHaveLength(3)
    expect(result.map((r) => r.label)).toEqual([
      'Skin Type',
      'Dermatologically Tested',
      'Paraben Free',
    ])
  })

  it('safely skips unresolved tag IDs or tags without attributes', () => {
    const tag1 = '665f2a000000000000000001' // unresolved string ID
    const tag2 = { id: 'tag-2', name: 'No Attributes' }
    const tag3 = {
      id: 'tag-3',
      name: 'Valid Tag',
      attributes: [{ label: 'Feature', validation: { type: 'text' } }],
    }

    const result = mergeTagAttributeDefs([tag1 as any, null, tag2, tag3])
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Feature')
  })
})

describe('mergeProductAttributes', () => {
  const tag1 = {
    id: 'tag-1',
    name: 'Tag A',
    attributes: [
      { label: 'Feature', validation: { type: 'text' } },
      { label: 'Connectivity', validation: { type: 'text' } },
    ],
  }

  it('returns empty when product has no attributes', () => {
    expect(mergeProductAttributes(null, [tag1])).toEqual([])
    expect(mergeProductAttributes([], [tag1])).toEqual([])
  })

  it('returns empty when no tags are present', () => {
    const attrs = [{ label: 'Feature', value: 'Fast' }]
    expect(mergeProductAttributes(attrs, null)).toEqual([])
    expect(mergeProductAttributes(attrs, [])).toEqual([])
  })

  it('returns product attributes whose labels match active tag labels', () => {
    const productAttrs = [
      { label: 'Feature', value: 'Smart AI' },
      { label: 'Connectivity', value: 'WiFi 6' },
      { label: 'Orphan', value: 'Should be removed' },
    ]

    const result = mergeProductAttributes(productAttrs, [tag1])
    expect(result).toEqual([
      { label: 'Feature', value: 'Smart AI' },
      { label: 'Connectivity', value: 'WiFi 6' },
    ])
  })

  it('deduplicates same label across multiple tags for filter set', () => {
    const tag2 = {
      id: 'tag-2',
      name: 'Tag B',
      attributes: [
        { label: 'Feature', validation: { type: 'text' } }, // duplicate label
        { label: 'Material', validation: { type: 'text' } },
      ],
    }

    const productAttrs = [
      { label: 'Feature', value: 'Lightweight' },
      { label: 'Material', value: 'Cotton' },
    ]

    const result = mergeProductAttributes(productAttrs, [tag1, tag2])
    expect(result).toEqual([
      { label: 'Feature', value: 'Lightweight' },
      { label: 'Material', value: 'Cotton' },
    ])
  })
})
