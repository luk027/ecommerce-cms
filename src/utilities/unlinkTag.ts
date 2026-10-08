/**
 * Unlinks a tag from products.
 * If categoryFilter is provided, only unlinks from products whose category is in categoryFilter.
 * Otherwise unlinks from all products that reference the tagId.
 * Processes in pages of 100.
 */
export async function unlinkTagFromProducts(
  tagId: string,
  payload: any,
  categoryFilter?: string[]
): Promise<void> {
  if (!tagId || !payload) return

  const targetTagId = String(tagId)

  while (true) {
    const whereClause: any = {
      tags: {
        contains: targetTagId,
      },
    }

    if (categoryFilter && categoryFilter.length > 0) {
      whereClause.category = {
        in: categoryFilter,
      }
    }

    const res = await payload.find({
      collection: 'products',
      where: whereClause,
      limit: 100,
      depth: 0,
    })

    if (!res.docs || res.docs.length === 0) {
      break
    }

    for (const product of res.docs) {
      const currentTags = Array.isArray(product.tags) ? product.tags : []
      const newTags = currentTags
        .map((t: any) => (typeof t === 'object' && t ? String(t.id || t._id) : String(t)))
        .filter((t: string) => t !== targetTagId)

      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          tags: newTags,
        },
      })
    }

    if (res.docs.length < 100) {
      break
    }
  }
}
