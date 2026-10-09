import { describe, it, expect } from 'vitest'
import { validatePhone, validateWebsite } from '@/utilities/validateContact'

describe('validateWebsite', () => {
  it('allows an empty value (the field is optional)', () => {
    expect(validateWebsite(undefined)).toBe(true)
    expect(validateWebsite(null)).toBe(true)
    expect(validateWebsite('')).toBe(true)
  })

  it('accepts http and https addresses', () => {
    expect(validateWebsite('https://voltaudio.in')).toBe(true)
    expect(validateWebsite('http://example.com/shop?ref=1')).toBe(true)
  })

  it('rejects addresses without a scheme or with another scheme', () => {
    expect(validateWebsite('voltaudio.in')).toEqual(expect.any(String))
    expect(validateWebsite('ftp://example.com')).toEqual(expect.any(String))
    expect(validateWebsite('javascript:alert(1)')).toEqual(expect.any(String))
  })
})

describe('validatePhone', () => {
  it('allows an empty value (the field is optional)', () => {
    expect(validatePhone(undefined)).toBe(true)
    expect(validatePhone('')).toBe(true)
  })

  it('accepts common formats', () => {
    expect(validatePhone('+91 98765 43210')).toBe(true)
    expect(validatePhone('(022) 2345-6789')).toBe(true)
    expect(validatePhone('9876543210')).toBe(true)
  })

  it('rejects letters and numbers that are too short or too long', () => {
    expect(validatePhone('call me')).toEqual(expect.any(String))
    expect(validatePhone('12345')).toEqual(expect.any(String))
    expect(validatePhone('+1234567890123456')).toEqual(expect.any(String))
  })
})
