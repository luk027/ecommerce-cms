/**
 * Seeds demo sellers, brands, tags and products for local development.
 *
 *   npm run seed:demo
 *
 * - Sets every user's password (admin included) to DEMO_PASSWORD and creates missing demo sellers.
 * - Creates the demo tags with grouped attributes; reuses existing tags by name.
 * - Creates or updates each seller's brands and products, acting as that seller so the
 *   collection hooks (ownership, brand category, tag checks, attribute validation) all run.
 *
 * Safe to run again: records are matched by email, tag name, brand name + owner, and SKU.
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import type { Brand, Category, Tag, User } from '@/payload-types'
import { normalizeLabel } from '@/utilities/normalize'
import { relationId } from '@/utilities/relationId'
import { DEMO_PASSWORD, demoSellers, demoTags, type DemoProduct } from './seed-demo-data'

const lines: string[] = []
const log = (line: string) => lines.push(line)

type AttributeDef = { key: string; label: string; group?: string }

/** The attributes a set of tags requires, deduplicated the way the products hook does it. */
function attributeDefs(tags: Pick<Tag, 'attributes'>[]): AttributeDef[] {
  const defs = new Map<string, AttributeDef>()
  const add = (label?: string | null, group?: string) => {
    const trimmed = label?.trim()
    if (!trimmed) return
    const key = group
      ? `${normalizeLabel(group)}::${normalizeLabel(trimmed)}`
      : normalizeLabel(trimmed)
    if (!defs.has(key)) defs.set(key, { key, label: trimmed, group })
  }
  for (const tag of tags) {
    for (const attr of tag.attributes ?? []) {
      if (attr.type === 'group') {
        for (const item of attr.items ?? []) add(item.label, attr.groupName?.trim() || undefined)
      } else {
        add(attr.label)
      }
    }
  }
  return [...defs.values()]
}

/** "Group > Label" or "Label", the key format used in seed-demo-data.ts. */
const valueKey = (def: AttributeDef) => (def.group ? `${def.group} > ${def.label}` : def.label)

/** Builds a product's `attributes`, or lists what's missing / unexpected. */
function buildAttributes(product: DemoProduct, tags: Pick<Tag, 'attributes'>[]) {
  const defs = attributeDefs(tags)
  const expected = new Set(defs.map(valueKey))
  const missing = [...expected].filter((key) => !(key in product.attributes))
  const unexpected = Object.keys(product.attributes).filter((key) => !expected.has(key))
  const attributes = defs.map((def) => ({
    label: def.label,
    value: product.attributes[valueKey(def)] ?? '',
    ...(def.group ? { group: def.group } : {}),
  }))
  return { attributes, missing, unexpected }
}

async function main() {
  const payload = await getPayload({ config })

  // 1. Look up categories and tags by name, then check every product's data before writing.
  const categories = new Map<string, Category>()
  for (const category of (
    await payload.find({ collection: 'categories', pagination: false, depth: 0 })
  ).docs) {
    categories.set(category.name, category)
  }
  const existingTags = new Map<string, Tag>()
  for (const tag of (await payload.find({ collection: 'tags', pagination: false, depth: 0 }))
    .docs) {
    existingTags.set(tag.name, tag)
  }
  // Demo tag definitions win, so checks use the attributes they'll have after seeding.
  const tagDefinitions = new Map<string, Pick<Tag, 'attributes'> & { category: string }>()
  for (const [name, tag] of existingTags) {
    const categoryName =
      [...categories.values()].find((c) => c.id === relationId(tag.category))?.name ?? ''
    tagDefinitions.set(name, { attributes: tag.attributes, category: categoryName })
  }
  for (const tag of demoTags) tagDefinitions.set(tag.name, tag)

  const problems: string[] = []
  for (const tag of demoTags) {
    if (!categories.has(tag.category))
      problems.push(`Tag "${tag.name}": unknown category "${tag.category}"`)
  }
  for (const seller of demoSellers) {
    for (const brand of seller.brands) {
      if (!categories.has(brand.category))
        problems.push(`Brand "${brand.name}": unknown category "${brand.category}"`)
      for (const product of brand.products) {
        const where = product.sku
        const tags = product.tags.map((name) => {
          const tag = tagDefinitions.get(name)
          if (!tag) problems.push(`${where}: unknown tag "${name}"`)
          else if (tag.category !== brand.category)
            problems.push(
              `${where}: tag "${name}" is in "${tag.category}", not the brand's "${brand.category}"`,
            )
          return tag ?? { attributes: [] }
        })
        const { missing, unexpected } = buildAttributes(product, tags)
        if (missing.length)
          problems.push(`${where}: missing attribute values: ${missing.join(', ')}`)
        if (unexpected.length)
          problems.push(`${where}: values for unknown attributes: ${unexpected.join(', ')}`)
      }
    }
  }
  if (problems.length) {
    throw new Error(`Demo data has problems, nothing was written:\n  - ${problems.join('\n  - ')}`)
  }

  // 2. Users: one shared password for everyone; create demo sellers that don't exist yet.
  const { docs: existingUsers } = await payload.find({
    collection: 'users',
    pagination: false,
    depth: 0,
  })
  for (const user of existingUsers) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { password: DEMO_PASSWORD },
      overrideAccess: true,
    })
  }
  log(`Password reset for ${existingUsers.length} existing user(s).`)

  const sellers = new Map<string, User>()
  for (const { email } of demoSellers) {
    let user = existingUsers.find((u) => u.email === email) ?? null
    if (!user) {
      user = await payload.create({
        collection: 'users',
        data: { email, password: DEMO_PASSWORD, role: 'seller' },
        overrideAccess: true,
      })
      log(`Created seller ${email}.`)
    } else if (user.role !== 'seller') {
      throw new Error(`${email} exists but is "${user.role}", not a seller.`)
    }
    sellers.set(email, user)
  }

  // 3. Tags with grouped attributes (tags are admin-managed, so this bypasses access control).
  const tagIds = new Map<string, string>([...existingTags].map(([name, tag]) => [name, tag.id]))
  for (const tag of demoTags) {
    const data = {
      name: tag.name,
      category: categories.get(tag.category)!.id,
      attributes: tag.attributes,
    }
    const existing = existingTags.get(tag.name)
    const saved = existing
      ? await payload.update({ collection: 'tags', id: existing.id, data, overrideAccess: true })
      : await payload.create({ collection: 'tags', data, overrideAccess: true })
    tagIds.set(tag.name, saved.id)
    log(`${existing ? 'Updated' : 'Created'} tag "${tag.name}".`)
  }

  // 4. Brands and products, created as their seller.
  for (const seller of demoSellers) {
    const user = sellers.get(seller.email)!
    for (const brandData of seller.brands) {
      const { docs: owned } = await payload.find({
        collection: 'brands',
        where: { and: [{ name: { equals: brandData.name } }, { owner: { equals: user.id } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const brandInput = {
        name: brandData.name,
        category: categories.get(brandData.category)!.id,
        details: brandData.details,
        currency: 'INR' as const,
      }
      const brand: Brand = owned[0]
        ? await payload.update({
            collection: 'brands',
            id: owned[0].id,
            data: brandInput,
            user,
            overrideAccess: false,
          })
        : await payload.create({
            collection: 'brands',
            data: { ...brandInput, owner: user.id },
            user,
            overrideAccess: false,
          })
      log(`${seller.email}: ${owned[0] ? 'updated' : 'created'} brand "${brand.name}".`)

      for (const product of brandData.products) {
        const tags = product.tags.map((name) => tagDefinitions.get(name)!)
        const data = {
          title: product.title,
          sku: product.sku,
          status: product.status,
          brand: brand.id, // the product takes the brand's category
          tags: product.tags.map((name) => tagIds.get(name)!),
          sellingPrice: product.sellingPrice,
          mrp: product.mrp,
          stockStatus: product.stockStatus,
          stockQuantity: product.stockQuantity,
          attributes: buildAttributes(product, tags).attributes,
        }
        const { docs: existingProducts } = await payload.find({
          collection: 'products',
          where: { sku: { equals: product.sku } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (existingProducts[0]) {
          await payload.update({
            collection: 'products',
            id: existingProducts[0].id,
            data,
            user,
            overrideAccess: false,
          })
        } else {
          await payload.create({ collection: 'products', data, user, overrideAccess: false })
        }
        log(
          `  ${existingProducts[0] ? 'updated' : 'created'} ${product.status} product ${product.sku}.`,
        )
      }
    }
  }

  log(`Done. Every account's password is now "${DEMO_PASSWORD}".`)
}

// `payload run` waits for this module to finish loading, so await at the top level.
let exitCode = 0
try {
  await main()
} catch (error) {
  log(`Seed failed: ${error instanceof Error ? error.message : String(error)}`)
  exitCode = 1
}
// Flush the summary before exiting; output still buffered at exit is lost.
const summary = lines.join('\n') + '\n'
await new Promise<void>((resolve) => process.stdout.write(summary, () => resolve()))
process.exit(exitCode)
