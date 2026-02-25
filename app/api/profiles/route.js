import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, appendApiKeyData, getApiKeyDataType, setApiKeyDataType } from '@/lib/serverStorage'
import { getKlaviyoClientHeaders } from '@/lib/klaviyoPayloads'
import { isDefaultProfilePropertyName } from '@/lib/profilePropertyGroups'

const KLAVIYO_CLIENT_BASE = 'https://a.klaviyo.com/client'

/**
 * Create or update a profile in Klaviyo via the Client API.
 * Uses the account's API key as company_id (Klaviyo public/company key).
 * See docs/klaviyo-client-api.md.
 */
async function createKlaviyoProfile(companyId, payload) {
  const url = `${KLAVIYO_CLIENT_BASE}/profiles?company_id=${encodeURIComponent(companyId)}`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: getKlaviyoClientHeaders(),
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[Klaviyo Client API] fetch error:', err.message)
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
    console.error('[Klaviyo Client API] profiles error:', res.status, text?.slice(0, 500))
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

    // Validate that at least one identifier is present
    if (!attributes.email && !attributes.phone_number && !attributes.external_id) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one identifier (email, phone_number, or external_id) is required' }] },
        { status: 400 }
      )
    }

    // Build payload for Klaviyo Client API: only include attributes with values (see docs/klaviyo-client-api.md § Payload rules)
    const setIfPresent = (obj, key, value) => {
      if (value == null) return
      const s = typeof value === 'string' ? value.trim() : String(value)
      if (s !== '') obj[key] = value
    }
    const payloadAttrs = {}
    setIfPresent(payloadAttrs, 'email', attributes.email)
    setIfPresent(payloadAttrs, 'phone_number', attributes.phone_number)
    if (attributes.external_id != null && String(attributes.external_id).trim() !== '') payloadAttrs.external_id = String(attributes.external_id).trim()
    setIfPresent(payloadAttrs, 'first_name', attributes.first_name)
    setIfPresent(payloadAttrs, 'last_name', attributes.last_name)
    setIfPresent(payloadAttrs, 'locale', attributes.locale)

    const locInput = attributes.location && typeof attributes.location === 'object' ? attributes.location : null
    if (locInput) {
      const loc = {}
      const region = locInput.region ?? locInput.state
      setIfPresent(loc, 'address1', locInput.address1)
      setIfPresent(loc, 'address2', locInput.address2)
      setIfPresent(loc, 'city', locInput.city)
      setIfPresent(loc, 'country', locInput.country)
      setIfPresent(loc, 'region', region)
      setIfPresent(loc, 'zip', locInput.zip)
      if (Object.keys(loc).length > 0) payloadAttrs.location = loc
    }

    const rawProperties = attributes.properties && typeof attributes.properties === 'object' ? attributes.properties : {}
    const properties = {}
    for (const [key, value] of Object.entries(rawProperties)) {
      if (value == null || (typeof value === 'string' && value.trim() === '')) continue
      const klaviyoKey = key === 'kd_generated_at' ? key : (isDefaultProfilePropertyName(key) ? key : `kd_${key}`)
      properties[klaviyoKey] = value
    }
    properties.kd_generated_at = new Date().toISOString()
    if (Object.keys(properties).length > 0) payloadAttrs.properties = properties

    const payload = {
      data: {
        type: 'profile',
        attributes: payloadAttrs,
      },
    }

    const { ok, status, data: klaviyoResponse } = await createKlaviyoProfile(apiKey, payload)

    if (!ok) {
      const errors = klaviyoResponse?.errors || [{ detail: klaviyoResponse?.detail || klaviyoResponse?.message || 'Klaviyo API error' }]
      const detail = Array.isArray(errors) ? errors[0]?.detail || errors[0]?.title : errors?.detail
      if (!detail && klaviyoResponse && typeof klaviyoResponse === 'object') {
        console.error('[Klaviyo Client API] response body:', JSON.stringify(klaviyoResponse).slice(0, 800))
      }
      return NextResponse.json(
        { errors: Array.isArray(errors) ? errors : [errors] },
        { status: status >= 400 && status < 600 ? status : 502, headers: { 'Content-Type': 'application/vnd.api+json' } }
      )
    }

    // Client API may return profile in .data or at top level; some responses are empty {} despite success
    let profile = klaviyoResponse?.data ?? (klaviyoResponse?.type === 'profile' ? klaviyoResponse : null)
    if (!profile || profile.type !== 'profile') {
      // Klaviyo created the profile but returned empty/different body – build profile from request for app storage
      const syntheticId = `01J${Math.random().toString(36).substring(2, 15).toUpperCase()}`
      profile = {
        type: 'profile',
        id: syntheticId,
        attributes: {
          email: attributes.email ?? null,
          phone_number: attributes.phone_number ?? null,
          external_id: attributes.external_id != null ? String(attributes.external_id) : null,
          first_name: attributes.first_name ?? null,
          last_name: attributes.last_name ?? null,
          locale: attributes.locale ?? null,
          ...(location && { location }),
          properties,
        },
        relationships: {},
      }
    }

    // Store a copy locally so the Profiles list in the app can show created profiles
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

