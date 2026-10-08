import { describe, it, expect } from 'vitest'
import { validateProductTags } from '@/lib/catalog/validateTags'

describe('validateProductTags', () => {
  it('returns empty array when all tags belong to product category (single category)', () => {
    const tags = [
      { id: 'tag-1', name: 'Smart TV', category: 'cat-electronics' },
      { id: 'tag-2', name: '4K Display', category: { id: 'cat-electronics' } },
    ]

    const offending = validateProductTags(tags, 'cat-electronics')
    expect(offending).toEqual([])
  })

  it('supports legacy categories array for backward compatibility', () => {
    const tags = [
      { id: 'tag-1', name: 'Smart TV', categories: ['cat-electronics'] },
      { id: 'tag-2', name: '4K Display', categories: [{ id: 'cat-electronics' }, { id: 'cat-gadgets' }] },
    ]

    const offending = validateProductTags(tags, 'cat-electronics')
    expect(offending).toEqual([])
  })

  it('returns names of offending tags that do not belong to the category', () => {
    const tags = [
      { id: 'tag-1', name: 'Smart TV', category: 'cat-electronics' },
      { id: 'tag-2', name: 'Cotton Wear', category: 'cat-clothing' },
    ]

    const offending = validateProductTags(tags, 'cat-electronics')
    expect(offending).toEqual(['Cotton Wear'])
  })

  it('handles empty inputs gracefully', () => {
    expect(validateProductTags([], 'cat-1')).toEqual([])
    expect(validateProductTags(null, 'cat-1')).toEqual([])
  })
})
