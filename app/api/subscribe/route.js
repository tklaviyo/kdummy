import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, appendApiKeyData } from '@/lib/serverStorage'

// Valid channels
const VALID_CHANNELS = ['email', 'sms', 'whatsapp']

// Generate a mock subscription ID
function generateSubscriptionId() {
  return `01S${Math.random().toString(36).substring(2, 15).toUpperCase()}`
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

    // Validate channels
    if (!attributes.channels || !Array.isArray(attributes.channels) || attributes.channels.length === 0) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one channel is required' }] },
        { status: 400 }
      )
    }

    // Validate channel values
    const invalidChannels = attributes.channels.filter(ch => !VALID_CHANNELS.includes(ch.toLowerCase()))
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        { errors: [{ detail: `Invalid channels: ${invalidChannels.join(', ')}. Valid channels are: ${VALID_CHANNELS.join(', ')}` }] },
        { status: 400 }
      )
    }

    // Validate profile identifier
    const profileId = attributes.profile_id || attributes.profile?.data?.id
    const email = attributes.email || attributes.profile?.data?.attributes?.email
    const phoneNumber = attributes.phone_number || attributes.profile?.data?.attributes?.phone_number
    const externalId = attributes.external_id || attributes.profile?.data?.attributes?.external_id

    if (!profileId && !email && !phoneNumber && !externalId) {
      return NextResponse.json(
        { errors: [{ detail: 'At least one profile identifier (profile_id, email, phone_number, or external_id) is required' }] },
        { status: 400 }
      )
    }

    // Validate email is provided for email channel
    if (attributes.channels.includes('email') && !email) {
      return NextResponse.json(
        { errors: [{ detail: 'Email is required when subscribing to email channel' }] },
        { status: 400 }
      )
    }

    // Validate phone number is provided for SMS or WhatsApp channels
    if ((attributes.channels.includes('sms') || attributes.channels.includes('whatsapp')) && !phoneNumber) {
      return NextResponse.json(
        { errors: [{ detail: 'Phone number is required when subscribing to SMS or WhatsApp channels' }] },
        { status: 400 }
      )
    }

    // Create subscription objects for each channel
    const createdSubscriptions = attributes.channels.map(channel => {
      const subscriptionId = generateSubscriptionId()
      const subscription = {
        type: 'subscription',
        id: subscriptionId,
        attributes: {
          channel: channel.toLowerCase(),
          profile_id: profileId || null,
          email: email || null,
          phone_number: phoneNumber || null,
          external_id: externalId || null,
          list_id: attributes.list_id || null,
          status: 'subscribed',
          subscribed_at: new Date().toISOString(),
          created: new Date().toISOString(),
        },
        relationships: {},
      }

      // Store in storage
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

