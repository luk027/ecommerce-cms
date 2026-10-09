import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { shapeListingProduct } from '@/utilities/shapeProduct'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const q = searchParams.get('q')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const sortParam = searchParams.get('sort')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const andClauses: Where[] = [
      {
        status: {
          equals: 'active',
        },
      },
    ]

    if (category) {
      andClauses.push({
        category: {
          equals: category,
        },
      })
    }

    if (tag) {
      andClauses.push({
        tags: {
          contains: tag,
        },
      })
    }

    if (priceMin && !isNaN(Number(priceMin))) {
      andClauses.push({
        sellingPrice: {
          greater_than_equal: Number(priceMin),
        },
      })
    }

    if (priceMax && !isNaN(Number(priceMax))) {
      andClauses.push({
        sellingPrice: {
          less_than_equal: Number(priceMax),
        },
      })
    }

    if (q && q.trim()) {
      const queryText = q.trim()

      // Find tags matching q
      const matchingTags = await payload.find({
        collection: 'tags',
        where: {
          name: {
            like: queryText,
          },
        },
        limit: 50,
      })

      const matchedTagIds = matchingTags.docs.map((t) => String(t.id))

      const matchingBrands = await payload.find({
        collection: 'brands',
        where: {
          name: {
            like: queryText,
          },
        },
        limit: 50,
      })

      const matchedBrandIds = matchingBrands.docs.map((b) => String(b.id))

      const orSearchClauses: Where[] = [
        {
          title: {
            like: queryText,
          },
        },
      ]

      if (matchedBrandIds.length > 0) {
        orSearchClauses.push({
          brand: {
            in: matchedBrandIds,
          },
        })
      }

      if (matchedTagIds.length > 0) {
        orSearchClauses.push({
          tags: {
            in: matchedTagIds,
          },
        })
      }

      andClauses.push({
        or: orSearchClauses,
      })
    }

    let sort = '-createdAt'
    if (sortParam === 'price_asc') {
      sort = 'sellingPrice'
    } else if (sortParam === 'price_desc') {
      sort = '-sellingPrice'
    } else if (sortParam === 'newest') {
      sort = '-createdAt'
    } else if (sortParam === 'title_asc') {
      sort = 'title'
    }

    const result = await payload.find({
      collection: 'products',
      where: {
        and: andClauses,
      },
      page,
      limit,
      sort,
      depth: 1,
    })

    const docs = result.docs.map((doc) => shapeListingProduct(doc))

    return NextResponse.json({
      page: result.page || 1,
      limit: result.limit || limit,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages || 1,
      docs,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 },
    )
  }
}
