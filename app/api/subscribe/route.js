import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, appendApiKeyData } from '@/lib/serverStorage'
import { getKlaviyoClientHeaders } from '@/lib/klaviyoPayloads'

const KLAVIYO_CLIENT_BASE = 'https://a.klaviyo.com/client'

// Valid channels
const VALID_CHANNELS = ['email', 'sms', 'whatsapp']

/**
 * Forward subscription to Klaviyo Client API.
 * See docs/klaviyo-client-api.md.
 */
async function createKlaviyoSubscription(companyId, payload) {
  const url = `${KLAVIYO_CLIENT_BASE}/subscriptions?company_id=${encodeURIComponent(companyId)}`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: getKlaviyoClientHeaders(),
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[Klaviyo Client API] subscribe fetch error:', err.message)
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
    console.error('[Klaviyo Client API] subscriptions error:', res.status, text?.slice(0, 500))
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

    // Klaviyo Client API shape: data.attributes.profile.data.attributes (email, phone_number, external_id, subscriptions)
    const profileAttrs = attributes.profile?.data?.attributes
    const isKlaviyoShape = profileAttrs && typeof profileAttrs === 'object'

    let channels = []
    let profileId = null
    let email = null
    let phoneNumber = null
    let externalId = null
    let listId = null

    if (isKlaviyoShape) {
      profileId = attributes.profile?.data?.id || null
      email = profileAttrs.email ?? null
      phoneNumber = profileAttrs.phone_number ?? null
      externalId = profileAttrs.external_id != null ? String(profileAttrs.external_id) : null
      listId = data.relationships?.list?.data?.id ?? null
      const subs = profileAttrs.subscriptions || {}
      if (subs.email) channels.push('email')
      if (subs.sms) channels.push('sms')
      if (subs.whatsapp) channels.push('whatsapp')
    } else {
      channels = Array.isArray(attributes.channels) ? attributes.channels : []
      profileId = attributes.profile_id || attributes.profile?.data?.id
      email = attributes.email || attributes.profile?.data?.attributes?.email
      phoneNumber = attributes.phone_number || attributes.profile?.data?.attributes?.phone_number
      externalId = attributes.external_id || attributes.profile?.data?.attributes?.external_id
      listId = attributes.list_id || data.relationships?.list?.data?.id
    }

    if (channels.length === 0) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one channel is required' }] },
        { status: 400 }
      )
    }

    const invalidChannels = channels.filter(ch => !VALID_CHANNELS.includes(ch.toLowerCase()))
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        { errors: [{ detail: `Invalid channels: ${invalidChannels.join(', ')}. Valid channels are: ${VALID_CHANNELS.join(', ')}` }] },
        { status: 400 }
      )
    }

    if (!profileId && !email && !phoneNumber && !externalId) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one profile identifier (profile_id, email, phone_number, or external_id) is required' }] },
        { status: 400 }
      )
    }

    if (channels.includes('email') && !email) {
      return NextResponse.json(
        { errors: [{ detail: 'Email is required when subscribing to email channel' }] },
        { status: 400 }
      )
    }

    if ((channels.includes('sms') || channels.includes('whatsapp')) && !phoneNumber) {
      return NextResponse.json(
        { errors: [{ detail: 'Phone number is required when subscribing to SMS or WhatsApp channels' }] },
        { status: 400 }
      )
    }

    const listIdFromPayload = data.relationships?.list?.data?.id ?? listId
    if (!listIdFromPayload) {
      return NextResponse.json(
        { errors: [{ detail: 'List ID is required to subscribe in Klaviyo. Set it in Settings → Klaviyo Accounts for your account.' }] },
        { status: 400, headers: { 'Content-Type': 'application/vnd.api+json' } }
      )
    }

    // Forward to Klaviyo Client API (payload is already in Client API shape from the client)
    const { ok, status, data: klaviyoResponse } = await createKlaviyoSubscription(apiKey, body)

    if (!ok) {
      const errors = klaviyoResponse?.errors || [{ detail: klaviyoResponse?.detail || klaviyoResponse?.message || 'Klaviyo API error' }]
      const detail = Array.isArray(errors) ? errors[0]?.detail || errors[0]?.title : errors?.detail
      const message = (status === 401 || status === 403)
        ? 'Invalid or unauthorized API key. Check your public API key in Settings.'
        : (detail || 'Klaviyo API error')
      return NextResponse.json(
        { errors: [{ detail: message }] },
        { status: status >= 400 && status < 600 ? status : 502, headers: { 'Content-Type': 'application/vnd.api+json' } }
      )
    }

    // Also store locally for app display
    const createdSubscriptions = channels.map(channel => {
      const subscriptionId = `01S${Math.random().toString(36).substring(2, 15).toUpperCase()}`
      const subscription = {
        type: 'subscription',
        id: subscriptionId,
        attributes: {
          channel: channel.toLowerCase(),
          profile_id: profileId || null,
          email: email || null,
          phone_number: phoneNumber || null,
          external_id: externalId || null,
          list_id: listId || null,
          status: 'subscribed',
          subscribed_at: new Date().toISOString(),
          created: new Date().toISOString(),
        },
        relationships: {},
      }
      appendApiKeyData(apiKey, 'subscriptions', subscription)
      return subscription
    })

    return NextResponse.json(
      { data: createdSubscriptions },
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

  const { getApiKeyDataType } = await import('@/lib/serverStorage')
  const subscriptions = getApiKeyDataType(apiKey, 'subscriptions', [])

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('page_size') || '10')
  const profileId = searchParams.get('profile_id')
  const email = searchParams.get('email')
  const channel = searchParams.get('channel')

  let filteredSubscriptions = subscriptions

  // Filter by profile_id if provided
  if (profileId) {
    filteredSubscriptions = filteredSubscriptions.filter(sub => sub.attributes.profile_id === profileId)
  }

  // Filter by email if provided
  if (email) {
    filteredSubscriptions = filteredSubscriptions.filter(sub => sub.attributes.email === email)
  }

  // Filter by channel if provided
  if (channel) {
    filteredSubscriptions = filteredSubscriptions.filter(sub => sub.attributes.channel === channel.toLowerCase())
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedSubscriptions = filteredSubscriptions.slice(start, end)

  return NextResponse.json(
    {
      data: paginatedSubscriptions,
      links: {
        self: request.url,
        first: `${request.url.split('?')[0]}?page=1&page_size=${pageSize}`,
        last: `${request.url.split('?')[0]}?page=${Math.ceil(filteredSubscriptions.length / pageSize)}&page_size=${pageSize}`,
        prev: page > 1 ? `${request.url.split('?')[0]}?page=${page - 1}&page_size=${pageSize}` : null,
        next: end < filteredSubscriptions.length ? `${request.url.split('?')[0]}?page=${page + 1}&page_size=${pageSize}` : null,
      },
      meta: {
        count: filteredSubscriptions.length,
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

