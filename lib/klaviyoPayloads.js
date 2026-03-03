/**
 * Klaviyo Client API payload builders.
 * Use only these Client API payloads and docs/klaviyo-client-api.md — not the Klaviyo server-side REST API.
 * Builds request bodies to match https://a.klaviyo.com/client/* (Create/update profile, Create Event, Create Subscription).
 *
 * Payload rules (see docs/klaviyo-client-api.md § Payload rules):
 * - Only include a property when it has a value; omit null, undefined, empty string.
 * - Profiles: only identifiers/attributes that are set; location and properties only with present keys.
 * - Events: never send app profile id; only present profile identifiers; omit value when not set.
 */

const KLAVIYO_REVISION = '2026-01-15'

/** Common headers for Klaviyo Client API requests */
export function getKlaviyoClientHeaders() {
  return {
    accept: 'application/vnd.api+json',
    'content-type': 'application/vnd.api+json',
    revision: KLAVIYO_REVISION,
  }
}

/**
 * Build Klaviyo Create Profile request body.
 * Only includes attributes that have values (omit null/empty). See docs/klaviyo-client-api.md § Payload rules.
 * @param {object} attributes - Profile attributes (email?, phone_number?, external_id?, first_name?, last_name?, locale?, location?, properties?)
 * @returns {{ data: { type: string, attributes: object } }}
 */
export function buildKlaviyoProfilePayload(attributes) {
  const attrs = {}

  const setIfPresent = (key, value) => {
    if (value == null) return
    const s = typeof value === 'string' ? value.trim() : String(value)
    if (s !== '') attrs[key] = value
  }
  setIfPresent('email', attributes.email)
  setIfPresent('phone_number', attributes.phone_number)
  if (attributes.external_id != null && String(attributes.external_id).trim() !== '') attrs.external_id = String(attributes.external_id).trim()
  setIfPresent('first_name', attributes.first_name)
  setIfPresent('last_name', attributes.last_name)
  setIfPresent('locale', attributes.locale)

  const location = attributes.location && typeof attributes.location === 'object' ? attributes.location : null
  if (location) {
    const loc = {}
    const locKeys = ['address1', 'address2', 'city', 'country', 'region', 'zip']
    const region = location.region ?? location.state
    for (const k of locKeys) {
      const v = k === 'region' ? region : location[k]
      if (v != null && String(v).trim() !== '') loc[k] = v
    }
    if (Object.keys(loc).length > 0) attrs.location = loc
  }

  const rawProps = attributes.properties && typeof attributes.properties === 'object' ? attributes.properties : {}
  const properties = {}
  for (const [key, value] of Object.entries(rawProps)) {
    if (value == null) continue
    if (typeof value === 'string' && value.trim() === '') continue
    properties[key] = value
  }
  if (Object.keys(properties).length > 0) attrs.properties = properties

  return {
    data: {
      type: 'profile',
      attributes: attrs,
    },
  }
}

/**
 * Build Klaviyo Create Event request body from internal event object (from generateEvents).
 * Event-level fields (order_id, items, value, product_id, location_id, etc.) → attributes.properties.
 * Profile at event time → attributes.profile.data (id, email, and optional profile properties).
 * @param {object} ev - Internal event: metric_name, time, profileId, profileEmail, eventName, and any event-specific keys (orderId, items, value, valueCurrency, lineItem, location_id, etc.)
 * @returns {{ data: { type: string, attributes: object } }}
 */
export function buildKlaviyoEventPayload(ev) {
  const systemKeys = new Set(['id', 'time', 'metric_name', 'eventName', 'profileId', 'profileEmail', 'profileFirstName', 'profileLastName'])
  const properties = {}

  if (ev.lineItem && typeof ev.lineItem === 'object') {
    const li = ev.lineItem
    properties.product_id = li.productId ?? li.id
    properties.product_name = li.name
    properties.price = li.price
    properties.quantity = li.quantity ?? 1
    properties.currency = li.currency ?? 'USD'
    if (li.url != null) properties.product_url = li.url
    if (li.sku != null) properties.sku = li.sku
    if (li.categories != null) properties.categories = li.categories
    if (li.brand != null) properties.brand = li.brand
    if (li.imageUrl != null) properties.image_url = li.imageUrl
  }

  for (const [key, value] of Object.entries(ev)) {
    if (systemKeys.has(key) || value === undefined) continue
    if (key === 'lineItem') continue
    if (key === 'orderId') {
      properties.order_id = value
      continue
    }
    if (key === 'valueCurrency' || key === 'value') continue
    properties[key] = value
  }

  // Profile: only include identifiers that are present (priority: external_id, email, phone_number). Never send app profile id.
  const profileAttrs = {}
  const extId = ev.profileExternalId ?? ev.external_id
  if (extId != null && String(extId).trim() !== '') profileAttrs.external_id = String(extId).trim()
  if (ev.profileEmail != null && String(ev.profileEmail).trim() !== '') profileAttrs.email = String(ev.profileEmail).trim()
  const phone = ev.profilePhoneNumber ?? ev.phone_number
  if (phone != null && String(phone).trim() !== '') profileAttrs.phone_number = String(phone).trim()
  if (ev.profileFirstName != null && String(ev.profileFirstName).trim() !== '') profileAttrs.first_name = String(ev.profileFirstName).trim()
  if (ev.profileLastName != null && String(ev.profileLastName).trim() !== '') profileAttrs.last_name = String(ev.profileLastName).trim()
  if (Object.keys(ev.profileProperties || {}).length > 0) profileAttrs.properties = ev.profileProperties
  const profileData = { type: 'profile', attributes: profileAttrs }

  let metricName = ev.metric_name || (ev.eventName ? `${ev.eventName} (KD)` : 'Event (KD)')
  if (metricName && !metricName.endsWith(' (KD)')) metricName += ' (KD)'

  // Build attributes: only include value when it's a real number; omit null/absent fields
  const attributes = {
    properties,
    metric: {
      data: {
        type: 'metric',
        attributes: { name: metricName },
      },
    },
    profile: { data: profileData },
    time: ev.time || new Date().toISOString(),
  }
  const numValue = ev.value != null ? Number(ev.value) : null
  if (numValue != null && !Number.isNaN(numValue)) attributes.value = numValue

  return {
    data: {
      type: 'event',
      attributes,
    },
  }
}

/**
 * Convert sample event properties (from buildSampleEventProperties) to Klaviyo Create Event request body.
 * Use this for previews so the UI shows the exact payload sent to the API.
 * @param {object} sampleProperties - Flat object with profile_id, profile_email, metric_name, time, order_id, value, value_currency, items, etc.
 * @param {string} eventName - Event name (e.g. "Placed Order")
 * @returns {{ data: object }} Full request body for POST /api/events (Klaviyo Client API shape)
 */
export function samplePropertiesToKlaviyoEventPayload(sampleProperties, eventName) {
  const ev = { ...sampleProperties }
  ev.profileId = sampleProperties.profile_id ?? ev.profileId
  ev.profileEmail = sampleProperties.profile_email ?? ev.profileEmail
  // Do not send app profile_id/profile_email as event properties in previews; only use them
  // to build the embedded profile block.
  delete ev.profile_id
  delete ev.profile_email
  ev.orderId = sampleProperties.order_id ?? ev.orderId
  ev.valueCurrency = sampleProperties.value_currency ?? ev.valueCurrency
  ev.eventName = eventName
  return buildKlaviyoEventPayload(ev)
}

/**
 * Build Klaviyo Create Subscription request body (subscribe profile to list with channel consent).
 * @param {object} opts
 * @param {object} opts.profile - At least one of email, phone_number, external_id
 * @param {string} opts.listId - Klaviyo list ID (e.g. "LIST_ID")
 * @param {object} opts.consent - Per-channel consent. e.g. { email: { marketing: 'SUBSCRIBED' }, sms: { marketing: 'SUBSCRIBED', transactional: 'SUBSCRIBED' }, whatsapp: { marketing: 'SUBSCRIBED', transactional: 'SUBSCRIBED' } }
 * @returns {{ data: { type: string, attributes: object, relationships: object } }}
 */
export function buildKlaviyoSubscriptionPayload({ profile, listId, consent }) {
  const subscriptions = {}
  const consentMap = consent || {}

  if (consentMap.email) {
    subscriptions.email = { marketing: { consent: consentMap.email.marketing || 'SUBSCRIBED' } }
  }
  if (consentMap.sms) {
    subscriptions.sms = {
      marketing: { consent: consentMap.sms.marketing || 'SUBSCRIBED' },
      transactional: { consent: consentMap.sms.transactional || 'SUBSCRIBED' },
    }
  }
  if (consentMap.whatsapp) {
    subscriptions.whatsapp = {
      marketing: { consent: consentMap.whatsapp.marketing || 'SUBSCRIBED' },
      transactional: { consent: consentMap.whatsapp.transactional || 'SUBSCRIBED' },
    }
  }

  return {
    data: {
      type: 'subscription',
      attributes: {
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: profile.email ?? null,
              phone_number: profile.phone_number ?? null,
              external_id: profile.external_id != null ? String(profile.external_id) : null,
              subscriptions: Object.keys(subscriptions).length ? subscriptions : undefined,
            },
          },
        },
      },
      relationships: listId
        ? {
            list: {
              data: { type: 'list', id: listId },
            },
          }
        : undefined,
    },
  }
}

/**
 * Map app subscribe channels (e.g. email_marketing, sms_marketing) to Klaviyo subscription consent object.
 * @param {string[]} channels - e.g. ['email_marketing', 'sms_marketing', 'sms_transactional', 'whatsapp_marketing', 'whatsapp_transactional']
 * @returns {object} consent map for buildKlaviyoSubscriptionPayload
 */
export function channelsToConsent(channels) {
  const consent = {}
  if (channels.includes('email_marketing')) consent.email = { marketing: 'SUBSCRIBED' }
  if (channels.includes('sms_marketing') || channels.includes('sms_transactional')) {
    consent.sms = {
      marketing: channels.includes('sms_marketing') ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
      transactional: channels.includes('sms_transactional') ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
    }
  }
  if (channels.includes('whatsapp_marketing') || channels.includes('whatsapp_transactional')) {
    consent.whatsapp = {
      marketing: channels.includes('whatsapp_marketing') ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
      transactional: channels.includes('whatsapp_transactional') ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
    }
  }
  return consent
}
