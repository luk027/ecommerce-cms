import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { shapeDetailProduct } from '@/utilities/shapeProduct'

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const slug = params?.slug

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.find({
      collection: 'products',
      where: {
        slug: {
          equals: slug,
        },
        status: {
          equals: 'active',
        },
      },
      limit: 1,
      depth: 1,
    })

    if (!result.docs || result.docs.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const doc = result.docs[0]
    const shaped = shapeDetailProduct(doc)

    return NextResponse.json(shaped)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch product' }, { status: 500 })
  }
}
