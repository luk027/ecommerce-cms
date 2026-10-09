import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const categories = await payload.find({
      collection: 'categories',
      limit: 100,
      sort: 'name',
    })

    const docs = categories.docs.map((cat) => ({
      id: String(cat.id),
      name: cat.name,
    }))

    return NextResponse.json(docs)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 },
    )
  }
}
