import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

// Brands now own the category (products take it from their brand). Give each existing brand
// the category its products already use. Brands without products are left for the admin.

export async function up({ payload, session }: MigrateUpArgs): Promise<void> {
  const brands = payload.db.collections.brands.collection
  const products = payload.db.collections.products.collection

  const withoutCategory = await brands.find({ category: { $exists: false } }, { session }).toArray()
  let updated = 0
  for (const brand of withoutCategory) {
    const product = await products.findOne(
      { brand: brand._id, category: { $exists: true } },
      { session, projection: { category: 1 } },
    )
    if (!product) {
      payload.logger.warn(`Brand "${brand.name}" has no products; set its category in the admin.`)
      continue
    }
    await brands.updateOne(
      { _id: brand._id },
      { $set: { category: product.category } },
      { session },
    )
    updated++
  }
  payload.logger.info(`Set the category on ${updated} of ${withoutCategory.length} brand(s).`)
}

export async function down({ payload, session }: MigrateDownArgs): Promise<void> {
  await payload.db.collections.brands.collection.updateMany(
    {},
    { $unset: { category: '' } },
    { session },
  )
}
