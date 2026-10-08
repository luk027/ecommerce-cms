import { normalizeLabel } from './normalize'

export interface TagAttributeValidation {
  type?: 'text' | 'number' | 'boolean' | string
  min?: number | null
  max?: number | null
}

export interface TagAttributeDef {
  label: string
  group?: string | null
  validation?: TagAttributeValidation
}

export interface ProductAttribute {
  label: string
  value: string
  group?: string | null
  id?: string
}

export interface TagDocLike {
  id?: string
  name?: string
  attributes?: any[] | null
  [key: string]: any
}

/**
 * Collects unique attribute label definitions from a list of populated tag documents.
 * Supports both single/individual attributes and grouped attributes.
 * Duplicate normalized keys (group+label or label) are ignored (first tag in the product's order wins).
 * Unresolved / null tag references and empty attribute lists are handled safely.
 */
export function mergeTagAttributeDefs(
  tags?: (TagDocLike | string | null | undefined)[] | null,
): TagAttributeDef[] {
  if (!Array.isArray(tags) || tags.length === 0) {
    return []
  }

  const result: TagAttributeDef[] = []
  const seenKeys = new Set<string>()

  for (const tag of tags) {
    if (!tag || typeof tag !== 'object') {
      continue
    }

    const attributes = tag.attributes
    if (!Array.isArray(attributes)) {
      continue
    }

    for (const attr of attributes) {
      if (!attr || typeof attr !== 'object') {
        continue
      }

      // Group attribute handling
      if (attr.type === 'group' || (attr.groupName && Array.isArray(attr.items))) {
        const groupName = typeof attr.groupName === 'string' ? attr.groupName.trim() : ''
        if (Array.isArray(attr.items)) {
          for (const item of attr.items) {
            if (!item || typeof item.label !== 'string') continue
            const trimmedLabel = item.label.trim()
            if (!trimmedLabel) continue

            const key = groupName
              ? `${normalizeLabel(groupName)}::${normalizeLabel(trimmedLabel)}`
              : normalizeLabel(trimmedLabel)

            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              result.push({
                label: trimmedLabel,
                group: groupName || undefined,
                validation: item.validation || undefined,
              })
            }
          }
        }
      } else {
        // Single / Individual attribute handling
        if (typeof attr.label !== 'string') {
          continue
        }

        const trimmedLabel = attr.label.trim()
        if (!trimmedLabel) {
          continue
        }

        const key = normalizeLabel(trimmedLabel)
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          result.push({
            label: trimmedLabel,
            group: undefined,
            validation: attr.validation || undefined,
          })
        }
      }
    }
  }

  return result
}

/**
 * Merges product-level attribute values with unique tag-defined labels.
 * Product stored attributes are returned directly; this filters out
 * any entries whose label/group is no longer in the active tags.
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

  const validDefs = mergeTagAttributeDefs(tags)
  const validMap = new Map<string, TagAttributeDef>()
  const labelMap = new Map<string, TagAttributeDef>()

  for (const def of validDefs) {
    const key = def.group
      ? `${normalizeLabel(def.group)}::${normalizeLabel(def.label)}`
      : normalizeLabel(def.label)
    validMap.set(key, def)
    if (!labelMap.has(normalizeLabel(def.label))) {
      labelMap.set(normalizeLabel(def.label), def)
    }
  }

  return productAttributes
    .filter((attr) => {
      if (!attr?.label) return false
      const labelNorm = normalizeLabel(attr.label)
      const groupNorm = attr.group ? normalizeLabel(attr.group) : ''
      const key = groupNorm ? `${groupNorm}::${labelNorm}` : labelNorm
      return validMap.has(key) || labelMap.has(labelNorm)
    })
    .map((attr) => {
      const labelNorm = normalizeLabel(attr.label)
      const groupNorm = attr.group ? normalizeLabel(attr.group) : ''
      const key = groupNorm ? `${groupNorm}::${labelNorm}` : labelNorm
      const matchedDef = validMap.get(key) || labelMap.get(labelNorm)

      return {
        label: attr.label,
        value: String(attr.value ?? ''),
        ...(matchedDef?.group
          ? { group: matchedDef.group }
          : attr.group
            ? { group: attr.group }
            : {}),
      }
    })
}
