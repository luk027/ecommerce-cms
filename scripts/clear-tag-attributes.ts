/**
 * clear-tag-attributes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot migration script: removes all attribute data from every Tag document.
 *
 * Run with:
 *   npx tsx scripts/clear-tag-attributes.ts
 *
 * The script will:
 *  1. Find every tag in the collection.
 *  2. Patch each tag to set attributes = [].
 *  3. Print a summary.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const allTags = await payload.find({
    collection: 'tags',
    limit: 1000,
    depth: 0,
  })

  console.log(`Found ${allTags.totalDocs} tags. Clearing attributes...`)

  let cleared = 0
  let skipped = 0

  for (const tag of allTags.docs) {
    const attrs = tag.attributes as any[]
    if (!Array.isArray(attrs) || attrs.length === 0) {
      skipped++
      continue
    }

    await payload.update({
      collection: 'tags',
      id: tag.id,
      data: { attributes: [] },
    })

    console.log(`  ✔ Cleared ${attrs.length} attribute(s) from tag "${tag.name}" (${tag.id})`)
    cleared++
  }

  console.log(`\nDone. Cleared: ${cleared}, Skipped (already empty): ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
