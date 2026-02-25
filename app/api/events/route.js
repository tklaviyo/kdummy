import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, appendApiKeyData } from '@/lib/serverStorage'
import { getKlaviyoClientHeaders } from '@/lib/klaviyoPayloads'

const KLAVIYO_CLIENT_BASE = 'https://a.klaviyo.com/client'

// Generate a mock event ID for local storage when Klaviyo returns empty body
function generateEventId() {
  return `01E${Math.random().toString(36).substring(2, 15).toUpperCase()}`
}

/**
 * Create an event in Klaviyo via the Client API.
 * See docs/klaviyo-client-api.md.
 */
async function createKlaviyoEvent(companyId, payload) {
  const url = `${KLAVIYO_CLIENT_BASE}/events?company_id=${encodeURIComponent(companyId)}`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: getKlaviyoClientHeaders(),
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[Klaviyo Client API] events fetch error:', err.message)
    return { ok: false, status: 502, data: { errors: [{ detail: `Network error: ${err.message}` }] } }
  }
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = {}
  }
  if (!res.ok) {
    console.error('[Klaviyo Client API] events error:', res.status, text?.slice(0, 500))
  }
  return { ok: res.ok, status: res.status, data: json }
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

    // Forward to Klaviyo Client API (payload is already in Client API shape from buildKlaviyoEventPayload)
    const { ok, status, data: klaviyoResponse } = await createKlaviyoEvent(apiKey, body)

    if (!ok) {
      const errors = klaviyoResponse?.errors || [{ detail: klaviyoResponse?.detail || klaviyoResponse?.message || 'Klaviyo API error' }]
      return NextResponse.json(
        { errors: Array.isArray(errors) ? errors : [errors] },
        { status: status >= 400 ? status : 502, headers: { 'Content-Type': 'application/vnd.api+json' } }
      )
    }

    // Build event record for local storage (so GET /api/events still shows sent events)
    const eventId = klaviyoResponse?.data?.id || generateEventId()
    const event = {
      type: 'event',
      id: eventId,
      attributes: {
        properties: attributes.properties || {},
        metric: attributes.metric,
        profile: attributes.profile,
        time: attributes.time || new Date().toISOString(),
        value: attributes.value ?? null,
        value_currency: attributes.value_currency ?? null,
        unique_id: attributes.unique_id ?? null,
        datetime: attributes.time || new Date().toISOString(),
      },
      relationships: {},
    }
    appendApiKeyData(apiKey, 'events', event)

    // Return Klaviyo response if it has data; otherwise synthetic success
    const responseData = klaviyoResponse?.data ?? event
    return NextResponse.json(
      { data: responseData },
      {
        status: 201,
        headers: { 'Content-Type': 'application/vnd.api+json' },
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

