import { normalizeLabel } from './normalize'

export interface TagAttributeDef {
  label: string
  validation?: {
    type?: string
    min?: number | null
    max?: number | null
  }
}

export interface ProductAttribute {
  label: string
  value: string
}

export interface TagDocLike {
  id?: string
  name?: string
  attributes?: TagAttributeDef[] | null
  [key: string]: any
}

/**
 * Collects unique attribute label definitions from a list of populated tag documents.
 * Duplicate normalized labels are ignored (first tag in the product's order wins).
 * Unresolved / null tag references and empty attribute lists are handled safely.
 */
export function mergeTagAttributeDefs(
  tags?: (TagDocLike | string | null | undefined)[] | null,
): TagAttributeDef[] {
  if (!Array.isArray(tags) || tags.length === 0) {
    return []
  }

  const result: TagAttributeDef[] = []
  const seenLabels = new Set<string>()

  for (const tag of tags) {
    if (!tag || typeof tag !== 'object') {
      continue
    }

    const attributes = tag.attributes
    if (!Array.isArray(attributes)) {
      continue
    }

    for (const attr of attributes) {
      if (!attr || typeof attr.label !== 'string') {
        continue
      }

      const trimmedLabel = attr.label.trim()
      if (!trimmedLabel) {
        continue
      }

      const normalized = normalizeLabel(trimmedLabel)
      if (!seenLabels.has(normalized)) {
        seenLabels.add(normalized)
        result.push({
          label: trimmedLabel,
          validation: attr.validation || undefined,
        })
      }
    }
  }

  return result
}

/**
 * Merges product-level attribute values with unique tag-defined labels.
 * Product stored attributes are returned directly; this is a passthrough
 * that only filters out any entries whose label is no longer in the active tags.
 */
export function mergeProductAttributes(
  productAttributes?: ProductAttribute[] | null,
  tags?: (TagDocLike | string | null | undefined)[] | null,
): ProductAttribute[] {
  if (!Array.isArray(productAttributes) || productAttributes.length === 0) {
    return []
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    return []
  }

  const validLabels = new Set<string>(
    mergeTagAttributeDefs(tags).map((a) => normalizeLabel(a.label)),
  )

  return productAttributes.filter((attr) => {
    if (!attr?.label) return false
    return validLabels.has(normalizeLabel(attr.label))
  })
}
