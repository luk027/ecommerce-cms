import { getPayload } from 'payload'
import config from '../src/payload.config'
import mongoose from 'mongoose'
import 'dotenv/config'

export async function migrateBrandField(): Promise<void> {
  const payload = await getPayload({ config })
  console.log('=== Starting Brand Field Migration ===')

  // Find an admin user to own legacy brands
  let adminUser = (
    await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } },
      limit: 1,
    })
  ).docs[0]

  if (!adminUser) {
    const anyUser = (await payload.find({ collection: 'users', limit: 1 })).docs[0]
    if (anyUser) {
      adminUser = anyUser
    } else {
      adminUser = await payload.create({
        collection: 'users',
        data: {
          email: 'admin@catalog.com',
          password: 'adminpassword123',
          role: 'admin',
        },
      })
    }
  }

  const rawProducts = await payload.db.connection
    .collection('products')
    .find({ brand: { $type: 'string' } })
    .toArray()

  console.log(`Found ${rawProducts.length} product(s) with string brand fields.`)

  const brandCache = new Map<string, string>()

  for (const doc of rawProducts) {
    const brandStr = String(doc.brand).trim()
    if (!brandStr) continue

    // Check if brandStr is already a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(brandStr) && String(new mongoose.Types.ObjectId(brandStr)) === brandStr) {
      // Already an ObjectId string, convert to ObjectId type if needed
      await payload.db.connection
        .collection('products')
        .updateOne({ _id: doc._id }, { $set: { brand: new mongoose.Types.ObjectId(brandStr) } })
      continue
    }

    let brandId = brandCache.get(brandStr.toLowerCase())
    if (!brandId) {
      const existingBrand = await payload.find({
        collection: 'brands',
        where: { name: { equals: brandStr } },
        limit: 1,
      })

      if (existingBrand.docs.length > 0) {
        brandId = String(existingBrand.docs[0].id)
      } else {
        const newBrand = await payload.create({
          collection: 'brands',
          data: {
            name: brandStr,
            details: `${brandStr} brand migrated from legacy data`,
            currency: 'INR',
            owner: adminUser.id,
          },
        })
        brandId = String(newBrand.id)
        console.log(`? Created Brand "${brandStr}" with ID: ${brandId}`)
      }
      brandCache.set(brandStr.toLowerCase(), brandId)
    }

    await payload.db.connection
      .collection('products')
      .updateOne({ _id: doc._id }, { $set: { brand: new mongoose.Types.ObjectId(brandId) } })

    console.log(`Updated product ${doc.title || doc._id} brand to ${brandId}`)
  }

  console.log('=== Migration Complete ===')
}

migrateBrandField()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
