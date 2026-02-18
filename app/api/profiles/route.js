import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, appendApiKeyData, getApiKeyDataType, setApiKeyDataType } from '@/lib/serverStorage'

// Generate a mock Klaviyo profile ID
function generateProfileId() {
  return `01J${Math.random().toString(36).substring(2, 15).toUpperCase()}`
}

export async function POST(request) {
  try {
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data || !data.attributes) {
      return NextResponse.json(
        { errors: [{ detail: 'Invalid request body. Missing data.attributes' }] },
        { status: 400 }
      )
    }

    const { attributes } = data

    // Validate that at least one identifier is present
    if (!attributes.email && !attributes.phone_number && !attributes.external_id) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one identifier (email, phone_number, or external_id) is required' }] },
        { status: 400 }
      )
    }

    // Generate profile ID
    const profileId = generateProfileId()

    // Create profile object
    const profile = {
      type: 'profile',
      id: profileId,
      attributes: {
        email: attributes.email || null,
        phone_number: attributes.phone_number || null,
        external_id: attributes.external_id || null,
        first_name: attributes.first_name || null,
        last_name: attributes.last_name || null,
        locale: attributes.locale || null,
        location: attributes.location || null,
        properties: {
          ...attributes.properties,
          kdummy_generated_at: new Date().toISOString(),
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      relationships: {},
    }

    // Store in storage
    appendApiKeyData(apiKey, 'profiles', profile)

    return NextResponse.json(
      { data: profile },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  const apiKey = getApiKeyFromRequest(request)
  if (!apiKey) {
    return NextResponse.json(
      { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('page_size') || '10')
  const start = (page - 1) * pageSize
  const end = start + pageSize

  const { getApiKeyDataType } = await import('@/lib/serverStorage')
  const profiles = getApiKeyDataType(apiKey, 'profiles', [])
  const paginatedProfiles = profiles.slice(start, end)

  return NextResponse.json(
    {
      data: paginatedProfiles,
      links: {
        self: request.url,
        first: `${request.url.split('?')[0]}?page=1&page_size=${pageSize}`,
        last: `${request.url.split('?')[0]}?page=${Math.ceil(profiles.length / pageSize)}&page_size=${pageSize}`,
        prev: page > 1 ? `${request.url.split('?')[0]}?page=${page - 1}&page_size=${pageSize}` : null,
        next: end < profiles.length ? `${request.url.split('?')[0]}?page=${page + 1}&page_size=${pageSize}` : null,
      },
      meta: {
        count: profiles.length,
        page,
        page_size: pageSize,
      },
    },
    {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    }
  )
}

export async function DELETE(request) {
  const apiKey = getApiKeyFromRequest(request)
  if (!apiKey) {
    return NextResponse.json(
      { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids : body.id != null ? [body.id] : []
    if (ids.length === 0) {
      return NextResponse.json(
        { errors: [{ detail: 'Request body must include ids (array) or id (string).' }] },
        { status: 400 }
      )
    }

    const idSet = new Set(ids.map((id) => String(id)))
    const profiles = getApiKeyDataType(apiKey, 'profiles', [])
    const filtered = profiles.filter((p) => !idSet.has(p.id))
    setApiKeyDataType(apiKey, 'profiles', filtered)

    return NextResponse.json(
      { data: { deleted: ids.length, remaining: filtered.length } },
      { headers: { 'Content-Type': 'application/vnd.api+json' } }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

