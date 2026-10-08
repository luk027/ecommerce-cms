export function computeDiscount(sellingPrice?: number | null, mrp?: number | null): number | null {
  if (
    typeof sellingPrice !== 'number' ||
    typeof mrp !== 'number' ||
    isNaN(sellingPrice) ||
    isNaN(mrp) ||
    sellingPrice < 0 ||
    mrp <= 0 ||
    mrp <= sellingPrice
  ) {
    return null
  }

  const discount = Math.round(((mrp - sellingPrice) / mrp) * 100)
  return discount > 0 ? discount : null
}
