import { describe, it, expect } from 'vitest'
import { computeDiscount } from '@/lib/catalog/computeDiscount'

describe('computeDiscount', () => {
  it('correctly calculates rounded discount percent when mrp > sellingPrice', () => {
    // 349 / 420 = 0.83095 -> 17%
    expect(computeDiscount(349, 420)).toBe(17)
    // 89990 / 129900 = 0.69276 -> 31%
    expect(computeDiscount(89990, 129900)).toBe(31)
  })

  it('returns null when mrp is <= sellingPrice or not provided', () => {
    expect(computeDiscount(100, 100)).toBeNull()
    expect(computeDiscount(150, 100)).toBeNull()
    expect(computeDiscount(100, null)).toBeNull()
    expect(computeDiscount(100, undefined)).toBeNull()
    expect(computeDiscount(null, 100)).toBeNull()
  })
})
