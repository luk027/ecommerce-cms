import type { Payload } from 'payload'

export async function resolveUserBrandIds(
  payload: Payload,
  userId: string | number,
): Promise<string[]> {
  try {
    const brands = await payload.find({
      collection: 'brands',
      where: {
        owner: {
          equals: userId,
        },
      },
      limit: 1000,
      depth: 0,
      pagination: false,
    })

    return brands.docs.map((b) => String(b.id))
  } catch (error) {
    return []
  }
}
