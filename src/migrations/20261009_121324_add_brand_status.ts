import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

// Brands now have a verification status. Existing brands start unverified, like new ones.
// The new website, email and phone fields are optional, so they need no data changes.

export async function up({ payload, session }: MigrateUpArgs): Promise<void> {
  const { modifiedCount } = await payload.db.collections.brands.collection.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'unverified' } },
    { session },
  )
  payload.logger.info(`Marked ${modifiedCount} existing brand(s) as unverified.`)
}

export async function down({ payload, session }: MigrateDownArgs): Promise<void> {
  await payload.db.collections.brands.collection.updateMany(
    {},
    { $unset: { status: '' } },
    { session },
  )
}
