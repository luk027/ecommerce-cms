import { describe, it, expect } from 'vitest'
import { relationId } from '@/utilities/relationId'

describe('relationId', () => {
  it('returns raw IDs as strings', () => {
    expect(relationId('abc123')).toBe('abc123')
    expect(relationId(42)).toBe('42')
  })

  it('resolves populated documents by id or _id', () => {
    expect(relationId({ id: 'doc-1', name: 'Doc' })).toBe('doc-1')
    expect(relationId({ _id: 'mongo-1' })).toBe('mongo-1')
  })

  it('returns null for empty values', () => {
    expect(relationId(null)).toBeNull()
    expect(relationId(undefined)).toBeNull()
    expect(relationId('')).toBeNull()
    expect(relationId({})).toBeNull()
  })
})
