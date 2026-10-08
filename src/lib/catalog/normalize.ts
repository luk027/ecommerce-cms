/**
 * Normalizes a label or text string:
 * - Trims whitespace
 * - Converts to lowercase
 * - Collapses consecutive whitespace characters into a single space
 */
export function normalizeLabel(label: string): string {
  if (!label || typeof label !== 'string') return ''
  return label.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Generates a clean URL slug from a title string.
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, '') // trim - from end of text
}
