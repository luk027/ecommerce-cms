import { describe, it, expect } from 'vitest'
import { normalizeLabel, slugify } from '@/utilities/normalize'

describe('normalizeLabel', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeLabel('  Skin Type  ')).toBe('skin type')
  })

  it('converts to lowercase', () => {
    expect(normalizeLabel('Dermatologically TESTED')).toBe('dermatologically tested')
  })

  it('collapses multiple inner spaces into one', () => {
    expect(normalizeLabel('Screen    Size   (Inches)')).toBe('screen size (inches)')
  })

  it('handles empty or non-string inputs safely', () => {
    expect(normalizeLabel('')).toBe('')
    expect(normalizeLabel(null as any)).toBe('')
    expect(normalizeLabel(undefined as any)).toBe('')
  })
})

describe('slugify', () => {
  it('converts title to clean slug', () => {
    expect(slugify('Samsung 55" OLED Smart TV!')).toBe('samsung-55-oled-smart-tv')
    expect(slugify('Aloe Vera Body Lotion 400ml')).toBe('aloe-vera-body-lotion-400ml')
  })
})
