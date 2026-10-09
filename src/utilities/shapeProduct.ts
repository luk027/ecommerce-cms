import { mergeProductAttributes } from './mergeAttributes'

export function shapeListingProduct(doc: any) {
  if (!doc) return null

  // Category
  const category =
    doc.category && typeof doc.category === 'object'
      ? { id: String(doc.category.id || doc.category._id), name: doc.category.name || '' }
      : { id: String(doc.category || ''), name: '' }

  // Filter resolved tags only
  const validTags = Array.isArray(doc.tags)
    ? doc.tags.filter((t: any) => t && typeof t === 'object' && (t.id || t._id))
    : []

  const formattedTags = validTags.map((t: any) => ({
    id: String(t.id || t._id),
    name: t.name || '',
  }))

  // Attributes: stored on the product, filtered against active tags
  const attributes = mergeProductAttributes(doc.attributes, validTags)

  return {
    id: String(doc.id || doc._id),
    slug: doc.slug || '',
    title: doc.title || '',
    brand: doc.brand && typeof doc.brand === 'object' ? doc.brand.name || '' : doc.brand || '',
    category,
    price: {
      selling: typeof doc.sellingPrice === 'number' ? doc.sellingPrice : 0,
      mrp: typeof doc.mrp === 'number' ? doc.mrp : null,
      discountPercent: typeof doc.discountPercent === 'number' ? doc.discountPercent : null,
      currency: doc.currency || 'INR',
    },
    stockStatus: doc.stockStatus || 'out_of_stock',
    tags: formattedTags,
    attributes,
  }
}

export function shapeDetailProduct(doc: any) {
  const listing = shapeListingProduct(doc)
  if (!listing) return null

  return {
    ...listing,
    status: doc.status || 'draft',
    sku: doc.sku || '',
  }
}
