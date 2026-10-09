import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

// The non-admin role was renamed from 'user' to 'seller'. Updated on the raw collection,
// because the old value no longer passes the role field's validation.

export async function up({ payload, session }: MigrateUpArgs): Promise<void> {
  const { modifiedCount } = await payload.db.collections.users.collection.updateMany(
    { role: 'user' },
    { $set: { role: 'seller' } },
    { session },
  )
  payload.logger.info(`Renamed role 'user' to 'seller' on ${modifiedCount} user(s).`)
}

export async function down({ payload, session }: MigrateDownArgs): Promise<void> {
  const { modifiedCount } = await payload.db.collections.users.collection.updateMany(
    { role: 'seller' },
    { $set: { role: 'user' } },
    { session },
  )
  payload.logger.info(`Renamed role 'seller' back to 'user' on ${modifiedCount} user(s).`)
}
