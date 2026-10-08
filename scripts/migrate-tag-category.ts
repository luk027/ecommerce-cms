import { MongoClient } from 'mongodb'

async function main() {
  const url = process.env.DATABASE_URL || 'mongodb://127.0.0.1/product-catalog'
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db()

  const tags = await db.collection('tags').find().toArray()
  console.log(`Found ${tags.length} tags in MongoDB.`)

  let updated = 0
  for (const tag of tags) {
    if (!tag.category && tag.categories && tag.categories.length > 0) {
      await db
        .collection('tags')
        .updateOne({ _id: tag._id }, { $set: { category: tag.categories[0] } })
      updated++
    }
  }

  console.log(`Successfully migrated ${updated} tags to have 'category' field.`)
  const sample = await db.collection('tags').findOne()
  console.log('Sample tag after migration:', sample)

  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration error:', err)
  process.exit(1)
})
