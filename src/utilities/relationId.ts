/**
 * Resolves the ID of a relationship value, which may be a raw ID or a populated document.
 * Returns null when no ID is present.
 */
export function relationId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'object') {
    const { id, _id } = value as { id?: unknown; _id?: unknown }
    const resolved = id || _id
    return resolved ? String(resolved) : null
  }

  return String(value)
}
