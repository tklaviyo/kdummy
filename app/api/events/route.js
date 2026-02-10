import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, appendApiKeyData } from '@/lib/serverStorage'

// Generate a mock Klaviyo event ID
function generateEventId() {
  return `01E${Math.random().toString(36).substring(2, 15).toUpperCase()}`
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

    // Validate required fields
    if (!attributes.metric || !attributes.metric.data || !attributes.metric.data.attributes) {
      return NextResponse.json(
        { errors: [{ detail: 'Metric is required' }] },
        { status: 400 }
      )
    }

    if (!attributes.profile || !attributes.profile.data) {
      return NextResponse.json(
        { errors: [{ detail: 'Profile is required' }] },
        { status: 400 }
      )
    }

    const profileData = attributes.profile.data
    const profileAttrs = profileData.attributes || {}

    // Validate that at least one profile identifier is present
    if (!profileAttrs.email && !profileAttrs.phone_number && !profileAttrs.external_id && !profileData.id) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one profile identifier (id, email, phone_number, or external_id) is required' }] },
        { status: 400 }
      )
    }

    // Generate event ID
    const eventId = generateEventId()
    const metricName = attributes.metric.data.attributes.name

    // Ensure metric name has TEST prefix if not already present
    const finalMetricName = metricName.startsWith('TEST ') || metricName.startsWith('TEST_')
      ? metricName
      : `TEST ${metricName}`

    // Create event object
    const event = {
      type: 'event',
      id: eventId,
      attributes: {
        properties: attributes.properties || {},
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: finalMetricName,
            },
          },
        },
        profile: {
          data: {
            type: 'profile',
            id: profileData.id || null,
            attributes: {
              email: profileAttrs.email || null,
              phone_number: profileAttrs.phone_number || null,
              external_id: profileAttrs.external_id || null,
              properties: profileAttrs.properties || {},
            },
          },
        },
        time: attributes.time || new Date().toISOString(),
        value: attributes.value || null,
        value_currency: attributes.value_currency || null,
        unique_id: attributes.unique_id || null,
        datetime: attributes.time || new Date().toISOString(),
      },
      relationships: {},
    }

    // Store in storage
    appendApiKeyData(apiKey, 'events', event)

    return NextResponse.json(
      { data: event },
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
  const events = getApiKeyDataType(apiKey, 'events', [])
  const paginatedEvents = events.slice(start, end)

  return NextResponse.json(
    {
      data: paginatedEvents,
      links: {
        self: request.url,
        first: `${request.url.split('?')[0]}?page=1&page_size=${pageSize}`,
        last: `${request.url.split('?')[0]}?page=${Math.ceil(events.length / pageSize)}&page_size=${pageSize}`,
        prev: page > 1 ? `${request.url.split('?')[0]}?page=${page - 1}&page_size=${pageSize}` : null,
        next: end < events.length ? `${request.url.split('?')[0]}?page=${page + 1}&page_size=${pageSize}` : null,
      },
      meta: {
        count: events.length,
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

