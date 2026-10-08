import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('category')
    const idsParam = searchParams.get('ids')

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const whereClause: any = {}

    if (categoryId) {
      whereClause.category = {
        equals: categoryId,
      }
    }

    if (idsParam) {
      const ids = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

      if (ids.length > 0) {
        whereClause.id = {
          in: ids,
        }
      }
    }

    const tags = await payload.find({
      collection: 'tags',
      where: whereClause,
      limit: 100,
      depth: 0,
      sort: 'name',
    })

    const docs = tags.docs.map((tag) => ({
      id: String(tag.id),
      name: tag.name,
      category: tag.category,
      attributes: Array.isArray(tag.attributes) ? tag.attributes : [],
    }))

    return NextResponse.json(docs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tags' }, { status: 500 })
  }
}
