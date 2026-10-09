import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

// Brand verification is tracked per contact detail instead of one status:
//   status: 'unverified'  ->  verified: { email: false, phone: false }

export async function up({ payload, session }: MigrateUpArgs): Promise<void> {
  const brands = payload.db.collections.brands.collection
  const { modifiedCount } = await brands.updateMany(
    { verified: { $exists: false } },
    { $set: { verified: { email: false, phone: false } } },
    { session },
  )
  await brands.updateMany({}, { $unset: { status: '' } }, { session })
  payload.logger.info(`Added verification flags to ${modifiedCount} brand(s).`)
}

export async function down({ payload, session }: MigrateDownArgs): Promise<void> {
  const brands = payload.db.collections.brands.collection
  await brands.updateMany(
    { 'verified.email': true, 'verified.phone': true },
    { $set: { status: 'verified' } },
    { session },
  )
  await brands.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'unverified' } },
    { session },
  )
  await brands.updateMany({}, { $unset: { verified: '' } }, { session })
}
