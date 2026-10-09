import { relationId } from './relationId'

export interface TagWithCategory {
  id?: string
  name?: string
  category?: string | { id: string } | null
  categories?: (string | { id: string } | null | undefined)[] | null
}

// Keep TagWithCategories as type alias for backwards compatibility
export type TagWithCategories = TagWithCategory

/**
 * Validates that all tags belong to the given category.
 * Returns an array of tag names (or IDs) that DO NOT belong to the category.
 * If all tags are valid, returns an empty array.
 */
export function validateProductTags(
  tags: (TagWithCategory | string | null | undefined)[] | null | undefined,
  categoryId: string,
): string[] {
  if (!Array.isArray(tags) || tags.length === 0 || !categoryId) {
    return []
  }

  const targetCategoryId = String(categoryId)
  const offendingTags: string[] = []

  for (const tag of tags) {
    if (!tag) continue

    // If tag is only a string ID and not populated, we cannot inspect categories directly here
    if (typeof tag === 'string') {
      continue
    }

    // 1. Check single category relationship
    let matches = relationId(tag.category) === targetCategoryId

    // 2. Check legacy categories array if not matched yet
    if (!matches && Array.isArray(tag.categories)) {
      matches = tag.categories.some((cat) => relationId(cat) === targetCategoryId)
    }

    if (!matches) {
      offendingTags.push(tag.name || tag.id || 'Unknown Tag')
    }
  }

  return offendingTags
}
