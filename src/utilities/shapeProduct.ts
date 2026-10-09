import { mergeProductAttributes, type ProductAttribute, type TagDocLike } from './mergeAttributes'
import { relationId } from './relationId'

/** A product document from the Local API; relationships may be raw IDs or populated documents. */
export interface ProductDocLike {
  id?: unknown
  _id?: unknown
  slug?: string | null
  title?: string | null
  status?: string | null
  sku?: string | null
  brand?: unknown
  category?: unknown
  sellingPrice?: number | null
  mrp?: number | null
  discountPercent?: number | null
  currency?: string | null
  stockStatus?: string | null
  tags?: unknown[] | null
  attributes?: unknown
}

function populatedName(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const { name } = value as { name?: unknown }
  return typeof name === 'string' ? name : ''
}

export function shapeListingProduct(doc: ProductDocLike | null | undefined) {
  if (!doc) return null

  // Category
  const category = { id: relationId(doc.category) ?? '', name: populatedName(doc.category) }

  // Filter resolved tags only
  const validTags = (Array.isArray(doc.tags) ? doc.tags : []).filter(
    (t): t is TagDocLike => typeof t === 'object' && t !== null && relationId(t) !== null,
  )

  const formattedTags = validTags.map((t) => ({
    id: String(relationId(t)),
    name: populatedName(t),
  }))

  // Attributes: stored on the product, filtered against active tags
  const storedAttributes = Array.isArray(doc.attributes)
    ? (doc.attributes as ProductAttribute[])
    : null
  const attributes = mergeProductAttributes(storedAttributes, validTags)

  return {
    id: relationId(doc) ?? '',
    slug: doc.slug || '',
    title: doc.title || '',
    brand: typeof doc.brand === 'string' ? doc.brand : populatedName(doc.brand),
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

export function shapeDetailProduct(doc: ProductDocLike | null | undefined) {
  const listing = shapeListingProduct(doc)
  if (!doc || !listing) return null

  return {
    ...listing,
    status: doc.status || 'draft',
    sku: doc.sku || '',
  }
}
