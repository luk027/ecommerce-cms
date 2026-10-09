/**
 * Validators for optional contact fields. Each returns `true` when the value is empty or valid,
 * otherwise an error message (the shape Payload's field `validate` expects).
 */

export function validateWebsite(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  try {
    const url = new URL(String(value))
    if (url.protocol === 'http:' || url.protocol === 'https:') return true
  } catch {}
  return 'Enter a full website address, e.g. https://example.com'
}

// Digits with optional leading +, and spaces, dashes or brackets as separators.
const PHONE_PATTERN = /^\+?[\d\s\-()]+$/

export function validatePhone(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  const phone = String(value)
  const digits = phone.replace(/\D/g, '')
  if (PHONE_PATTERN.test(phone) && digits.length >= 7 && digits.length <= 15) return true
  return 'Enter a valid phone number, e.g. +91 98765 43210'
}
