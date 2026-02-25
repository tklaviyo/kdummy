/**
 * Event generation: produces ordered events for a chosen journey.
 * Placed Order = whole order; Ordered Product = one per line item.
 * Viewed Product and Added to Cart = one event per product in the (upcoming) order, so they match products per order.
 * Started Checkout and Placed Order use the same precomputed line items for the run.
 * Bookings/subscriptions emit Placed Order at payment points (booking creation, subscription start, each renewal).
 * Timings: ecommerce_linear (minutes), booking_spaced (days), subscription_interval (catalog interval).
 * No Zustand; pure functions.
 */

import { getJourneyById, isProductJourneyType } from './journeyDefinitions'
import { deriveOrderListsFromItems } from './eventPropertiesSchema'

/** Metric name suffix for Klaviyo (e.g. "Placed Order (KD)") */
const KD = (name) => `${name} (KD)`
import {
  getTimingProfile,
  linearStepMs,
  bookingStepMs,
  TIMING_PROFILES,
} from './journeyTimings'
import { getLocationsList, toEventLocation } from './defaultLocations'

function makeId(prefix, i) {
  return `${prefix}${String(i).padStart(3, '0')}`
}

function pickRandom(arr, fallback) {
  if (!arr || arr.length === 0) return fallback
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomN(arr, n) {
  if (!arr || arr.length === 0) return []
  const copy = [...arr]
  const result = []
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy[idx])
    copy.splice(idx, 1)
  }
  return result
}

/** Deterministic first/last names for auto-generated profiles (firstname.lastname@domain). */
const DEMO_PROFILE_NAMES = [
  { first: 'Sarah', last: 'Smith' }, { first: 'John', last: 'Johnson' }, { first: 'Emily', last: 'Williams' },
  { first: 'Michael', last: 'Brown' }, { first: 'Jessica', last: 'Jones' }, { first: 'David', last: 'Garcia' },
  { first: 'Ashley', last: 'Miller' }, { first: 'James', last: 'Davis' }, { first: 'Amanda', last: 'Rodriguez' },
  { first: 'Robert', last: 'Martinez' }, { first: 'Melissa', last: 'Hernandez' }, { first: 'William', last: 'Lopez' },
  { first: 'Nicole', last: 'Wilson' }, { first: 'Richard', last: 'Anderson' }, { first: 'Michelle', last: 'Thomas' },
  { first: 'Joseph', last: 'Taylor' }, { first: 'Kimberly', last: 'Moore' }, { first: 'Thomas', last: 'Jackson' },
  { first: 'Amy', last: 'Martin' }, { first: 'Christopher', last: 'Lee' }, { first: 'Angela', last: 'Thompson' },
  { first: 'Daniel', last: 'White' }, { first: 'Lisa', last: 'Harris' }, { first: 'Matthew', last: 'Sanchez' },
  { first: 'Nancy', last: 'Clark' }, { first: 'Anthony', last: 'Ramirez' }, { first: 'Karen', last: 'Lewis' },
  { first: 'Mark', last: 'Robinson' }, { first: 'Betty', last: 'Walker' }, { first: 'Donald', last: 'Young' },
  { first: 'Sandra', last: 'Hall' }, { first: 'Steven', last: 'Allen' }, { first: 'Dorothy', last: 'King' },
  { first: 'Paul', last: 'Wright' }, { first: 'Carol', last: 'Scott' }, { first: 'Andrew', last: 'Green' },
  { first: 'Ruth', last: 'Baker' }, { first: 'Joshua', last: 'Adams' }, { first: 'Sharon', last: 'Nelson' },
  { first: 'Kenneth', last: 'Hill' }, { first: 'Laura', last: 'Campbell' }, { first: 'Kevin', last: 'Mitchell' },
  { first: 'Donna', last: 'Roberts' }, { first: 'Brian', last: 'Carter' }, { first: 'Michelle', last: 'Phillips' },
  { first: 'George', last: 'Evans' }, { first: 'Patricia', last: 'Turner' }, { first: 'Edward', last: 'Torres' },
  { first: 'Linda', last: 'Parker' }, { first: 'Ronald', last: 'Collins' }, { first: 'Barbara', last: 'Edwards' },
  { first: 'Timothy', last: 'Stewart' }, { first: 'Susan', last: 'Flores' }, { first: 'Jason', last: 'Morris' },
]

/** Exported for preview table in events page. */
export function getProfileEmailAndName(index, domain = 'klaviyo-dummy.com') {
  const name = DEMO_PROFILE_NAMES[index % DEMO_PROFILE_NAMES.length]
  const first = name.first.toLowerCase().replace(/\s+/g, '')
  const last = name.last.toLowerCase().replace(/\s+/g, '')
  const base = `${first}.${last}`
  const email = index < DEMO_PROFILE_NAMES.length
    ? `${base}@${domain}`
    : `${base}.${String(index + 1).padStart(3, '0')}@${domain}`
  return { email, firstName: name.first, lastName: name.last }
}

/**
 * Generate events for one journey run: ordered list of event names to emit (respecting selection).
 * Placed Order = one event per order; Ordered Product = one event per line item (after each Placed Order).
 */
function buildEmitSequence(journey, selectedSet) {
  const sequence = []
  for (const name of journey.eventNames) {
    if (name === 'Placed Order') {
      if (selectedSet.has('Placed Order')) sequence.push({ eventName: 'Placed Order', isOrder: true, isLineItem: false })
      if (selectedSet.has('Ordered Product')) sequence.push({ eventName: 'Ordered Product', isOrder: false, isLineItem: true })
      continue
    }
    if (name === 'Ordered Product') continue
    if (selectedSet.has(name)) sequence.push({ eventName: name, isOrder: false, isLineItem: false })
  }
  return sequence
}

function toSnakeCase(str) {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/([A-Z])/g, (_, c) => '_' + c.toLowerCase())
    .replace(/^_/, '')
}

/**
 * Map line items to Klaviyo items array (full product/variant data for email loops).
 * Option-derived fields (size, color, etc.) are omitted from the payload—they are for catalog/UI only.
 */
function lineItemsToKlaviyoItems(lineItems, journeyType) {
  return lineItems.map((l) => ({
    product_id: l.productId ?? l.subscriptionId ?? l.serviceId ?? l.id,
    product_name: l.name,
    product_url: l.url ?? '',
    sku: l.sku ?? l.productId ?? l.id ?? '',
    image_url: l.imageUrl ?? '',
    price: l.price,
    quantity: l.quantity ?? 1,
    currency: l.currency ?? 'USD',
    categories: Array.isArray(l.categories) ? l.categories : [],
    brand: l.brand ?? '',
  }))
}

/**
 * Build line items for an order based on journey type and catalog.
 * Ecommerce: full product data (url, imageUrl, categories, brand, options) for Klaviyo items array.
 * @param {object} [opts] - optional { productsPerOrderMin, productsPerOrderMax } for ecommerce
 */
function buildLineItems(journeyType, catalog, orderIndex, opts = {}) {
  const items = []
  if (journeyType === 'ecommerce') {
    const products = catalog.products || []
    const minP = Math.max(1, opts.productsPerOrderMin ?? 1)
    const maxP = Math.max(minP, opts.productsPerOrderMax ?? 3)
    const rawCount = Math.floor(Math.random() * (maxP - minP + 1)) + minP
    const count = Math.min(Math.max(1, rawCount), products.length || 1)
    const chosen = products.length ? pickRandomN(products, count) : []
    chosen.forEach((p) => {
      items.push({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
        currency: p.currency || 'USD',
        url: p.url,
        imageUrl: p.imageUrl,
        categories: p.categories,
        brand: p.brand,
        options: p.options,
        sku: p.sku ?? p.id,
      })
    })
    if (items.length === 0) {
      items.push({
        productId: 'fallback',
        name: 'Product',
        price: 29.99,
        quantity: 1,
        currency: 'USD',
        url: '',
        imageUrl: '',
        categories: [],
        brand: '',
        options: [],
        sku: 'fallback',
      })
    }
  }
  if (journeyType === 'subscription') {
    const subs = catalog.subscriptions || []
    const sub = subs.length ? pickRandom(subs, { id: 'sub-1', name: 'Subscription', price: 9.99, currency: 'USD' }) : { id: 'sub-1', name: 'Subscription', price: 9.99, currency: 'USD' }
    items.push({
      subscriptionId: sub.id,
      name: sub.name,
      price: sub.price,
      quantity: 1,
      currency: sub.currency || 'USD',
    })
  }
  if (journeyType === 'booking') {
    const services = catalog.services || []
    const svc = services.length ? pickRandom(services, { id: 'svc-1', name: 'Service', price: 49.99, currency: 'USD' }) : { id: 'svc-1', name: 'Service', price: 49.99, currency: 'USD' }
    items.push({
      serviceId: svc.id,
      name: svc.name,
      price: svc.price,
      quantity: 1,
      currency: svc.currency || 'USD',
    })
  }
  return items
}


/**
 * Generate events for the selected journey and options.
 * @param {object} params
 * @param {string} params.journeyId - e.g. 'ecommerce-full', 'booking-full'
 * @param {string[]} params.selectedEventNames - event names to include (user can deselect some)
 * @param {{ products: object[], services: object[], subscriptions: object[] }} params.catalog
 * @param {object} params.options
 * @param {number} params.options.journeyCount - number of journey runs per profile (1–10)
 * @param {number} params.options.profilesCount - number of mock profiles (when not using profileIds)
 * @param {string} params.options.dateRange - 'day' | 'week' (spread timestamps over last 1 or 7 days)
 * @returns {{ events: object[], profileIds: string[] }}
 */
export function generateEvents({ journeyId, selectedEventNames, catalog, options = {} }) {
  const journey = getJourneyById(journeyId)
  if (!journey) return { events: [], profileIds: [] }

  const journeysPerProfile = Math.max(1, Math.min(10, Number(options.journeyCount) || 1))
  const profilesCount = Math.max(1, Number(options.profilesCount) || 5)
  const dateRangeKey = options.dateRange || 'week'
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000
  const rangeMsByKey = {
    day: 1 * DAY_MS,
    week: 7 * DAY_MS,
    month: 30 * DAY_MS,
    '3months': 90 * DAY_MS,
    '6months': 180 * DAY_MS,
    '12months': 365 * DAY_MS,
    '24months': 730 * DAY_MS,
  }
  const rangeMs = rangeMsByKey[dateRangeKey] ?? rangeMsByKey.week
  const startMs = now - rangeMs

  const selectedSet = new Set(selectedEventNames || [])
  const emitSequence = buildEmitSequence(journey, selectedSet)
  if (emitSequence.length === 0) return { events: [], profileIds: [] }

  const PROFILE_EMAIL_DOMAIN = 'klaviyo-dummy.com'
  const useProvidedProfiles = Array.isArray(options.profileIds) && options.profileIds.length > 0 && Array.isArray(options.profileEmails) && options.profileEmails.length > 0
  const profileIds = useProvidedProfiles
    ? options.profileIds
    : Array.from({ length: profilesCount }, (_, i) => makeId('01J', i + 1))
  const profileEmails = useProvidedProfiles
    ? options.profileEmails
    : profileIds.map((id, i) => getProfileEmailAndName(i, PROFILE_EMAIL_DOMAIN).email)
  const totalRuns = profileIds.length * journeysPerProfile
  const productsPerOrderOpts = (options.productsPerOrderMin != null || options.productsPerOrderMax != null)
    ? { productsPerOrderMin: options.productsPerOrderMin ?? 1, productsPerOrderMax: options.productsPerOrderMax ?? 3 }
    : {}
  const events = []
  let eventIndex = 0

  const timingProfileId = journey.timingProfile ?? 'ecommerce_linear'
  const baseTimingProfile = getTimingProfile(timingProfileId) || TIMING_PROFILES.ecommerce_linear
  const timingOverrides = options.timingOverrides || {}
  const timingProfile = { ...baseTimingProfile, ...timingOverrides }
  const subscriptionInterval = catalog?.subscriptions?.[0]
    ? { interval: catalog.subscriptions[0].interval ?? 'month', intervalCount: catalog.subscriptions[0].intervalCount ?? 1 }
    : {}
  const subscriptionIntervalDays = (() => {
    if (!subscriptionInterval.interval) return 30
    const mult = subscriptionInterval.intervalCount ?? 1
    if (subscriptionInterval.interval === 'year') return 365 * mult
    if (subscriptionInterval.interval === 'week') return 7 * mult
    if (subscriptionInterval.interval === 'day') return 1 * mult
    return 30 * mult
  })()
  const catalogTypeForLineItems = isProductJourneyType(journey.type) ? 'ecommerce' : journey.type
  const orderSource = journey.type === 'ecommerce_instore' ? 'instore' : (journey.type === 'ecommerce_online' ? 'online' : 'online')
  const isSubscription = journey.type === 'subscription'

  const countPlacedOrdersInSequence = emitSequence.filter((x) => x.isOrder).length
  const hasLeadEvents = emitSequence.some((x) => x.eventName === 'Viewed Product' || x.eventName === 'Added to Cart' || x.eventName === 'Started Checkout')
  const countOrderLineItemSets = Math.max(countPlacedOrdersInSequence, hasLeadEvents ? 1 : 0)

  const MIN_MS = 60 * 1000
  const stepCount = emitSequence.filter((x) => !x.isLineItem).length
  const stepMinutesMax = timingProfile.stepMinutesMax ?? timingProfile.stepMinutesMin ?? 10
  const reserveEndMs = timingProfileId === 'ecommerce_linear'
    ? stepCount * stepMinutesMax * MIN_MS
    : timingProfileId === 'booking_spaced'
      ? 14 * 24 * 60 * MIN_MS
      : timingProfileId === 'subscription_interval'
        ? 400 * 24 * 60 * MIN_MS
        : stepCount * 15 * MIN_MS
  const usableRangeMs = Math.max(0, rangeMs - reserveEndMs)

  const locationsList = getLocationsList(catalog)

  for (let run = 0; run < totalRuns; run++) {
    const profileIndex = Math.floor(run / journeysPerProfile)
    const profileId = profileIds[profileIndex]
    const profileEmail = profileEmails[profileIndex]
    const runStartMs = startMs + (run / Math.max(1, totalRuns)) * usableRangeMs
    const runLocation = toEventLocation(pickRandom(locationsList, null))

    const runLineItemsByOrderIndex = []
    for (let o = 0; o < countOrderLineItemSets; o++) {
      runLineItemsByOrderIndex.push(
        buildLineItems(catalogTypeForLineItems, catalog, o, catalogTypeForLineItems === 'ecommerce' ? productsPerOrderOpts : {})
      )
    }

    let orderIndex = 0
    let lineItems = []
    let lastOrderId = null
    let lastOrderItems = []
    let lastOrderValue = 0
    let lastOrderCurrency = 'USD'
    let sequenceIndex = 0
    let previousEventMs = runStartMs
    let placedOrderCountInRun = 0
    let subscriptionStartMs = runStartMs + 15 * MIN_MS
    let subscriptionRenewalIndex = 0
    let subscriptionLeadStep = 0

    for (let i = 0; i < emitSequence.length; i++) {
      const item = emitSequence[i]
      let eventMs = runStartMs
      if (timingProfileId === 'ecommerce_linear' && timingProfile.stepMinutesMin != null) {
        eventMs = linearStepMs(runStartMs, sequenceIndex, timingProfile.stepMinutesMin, timingProfile.stepMinutesMax ?? timingProfile.stepMinutesMin)
      } else if (timingProfileId === 'booking_spaced' && timingProfile.daysAfterCreate) {
        eventMs = bookingStepMs(runStartMs, item.eventName, i, timingProfile)
      } else if (timingProfileId === 'subscription_interval') {
        if (item.eventName === 'Placed Order') {
          eventMs = previousEventMs
        } else if (item.eventName === 'Viewed Product' || item.eventName === 'Added to Cart' || item.eventName === 'Started Checkout') {
          eventMs = runStartMs + subscriptionLeadStep * 5 * MIN_MS
          subscriptionLeadStep++
        } else if (item.eventName === 'Subscription Started') {
          eventMs = subscriptionStartMs
        } else if (item.eventName === 'Subscription Renewed') {
          subscriptionRenewalIndex++
          eventMs = subscriptionStartMs + subscriptionRenewalIndex * subscriptionIntervalDays * DAY_MS
        } else if (item.eventName === 'Subscription Expiry Reminder') {
          const fraction = timingProfile.expiryReminderFraction ?? 0.2
          const nextRenewalAt = (subscriptionRenewalIndex + 1) * subscriptionIntervalDays * DAY_MS
          eventMs = subscriptionStartMs + nextRenewalAt - fraction * subscriptionIntervalDays * DAY_MS
        } else if (item.eventName === 'Subscription Expired') {
          eventMs = subscriptionStartMs + 1 * subscriptionIntervalDays * DAY_MS
        } else if (item.eventName === 'Subscription Cancelled') {
          eventMs = previousEventMs
        } else {
          eventMs = previousEventMs
        }
      } else {
        const runEndMs = runStartMs + (rangeMs / Math.max(1, totalRuns)) * 0.9
        const stepMs = (runEndMs - runStartMs) / Math.max(1, emitSequence.length)
        eventMs = runStartMs + i * stepMs
      }
      previousEventMs = eventMs
      const timestamp = new Date(eventMs).toISOString()
      if (!item.isLineItem) sequenceIndex++

      const leadLineItems = runLineItemsByOrderIndex[placedOrderCountInRun]

      if (item.isLineItem && lineItems.length > 0 && lastOrderId) {
        for (const line of lineItems) {
          events.push({
            id: makeId('evt_', ++eventIndex),
            time: timestamp,
            metric_name: KD('Ordered Product'),
            eventName: 'Ordered Product',
            profileId,
            profileEmail,
            orderId: lastOrderId,
            lineItem: line,
            value: (line.price || 0) * (line.quantity || 1),
            valueCurrency: line.currency || 'USD',
          })
        }
        continue
      }

      if (item.isOrder) {
        lineItems = leadLineItems != null && leadLineItems.length > 0 ? leadLineItems : buildLineItems(catalogTypeForLineItems, catalog, orderIndex, catalogTypeForLineItems === 'ecommerce' ? productsPerOrderOpts : {})
        const orderValue = lineItems.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 1), 0)
        lastOrderId = `ord_${run}_${orderIndex}`
        lastOrderItems = lineItemsToKlaviyoItems(lineItems, catalogTypeForLineItems)
        lastOrderValue = orderValue
        lastOrderCurrency = lineItems[0]?.currency ?? 'USD'
        placedOrderCountInRun++
        const orderType = isSubscription
          ? (placedOrderCountInRun === 1 ? 'New subscription' : 'Recurring subscription')
          : 'One time'
        const source = isProductJourneyType(journey.type) ? orderSource : 'online'
        const orderLists = deriveOrderListsFromItems(lastOrderItems)
        const payload = {
          id: makeId('evt_', ++eventIndex),
          time: timestamp,
          metric_name: KD('Placed Order'),
          eventName: 'Placed Order',
          profileId,
          profileEmail,
          orderId: lastOrderId,
          items: lastOrderItems,
          value: orderValue,
          valueCurrency: lastOrderCurrency,
          brands: orderLists.brands,
          item_names: orderLists.item_names,
          categories: orderLists.categories,
          source,
          OrderType: orderType,
        }
        if (source === 'instore' && runLocation) Object.assign(payload, runLocation)
        events.push(payload)
        orderIndex++
        continue
      }

      if (item.eventName === 'Viewed Product' && leadLineItems && leadLineItems.length > 0) {
        for (const line of leadLineItems) {
          events.push({
            id: makeId('evt_', ++eventIndex),
            time: timestamp,
            metric_name: KD('Viewed Product'),
            eventName: 'Viewed Product',
            profileId,
            profileEmail,
            lineItem: line,
            value: (line.price || 0) * (line.quantity || 1),
            valueCurrency: line.currency || 'USD',
          })
        }
        continue
      }

      if (item.eventName === 'Added to Cart' && leadLineItems && leadLineItems.length > 0) {
        for (const line of leadLineItems) {
          events.push({
            id: makeId('evt_', ++eventIndex),
            time: timestamp,
            metric_name: KD('Added to Cart'),
            eventName: 'Added to Cart',
            profileId,
            profileEmail,
            lineItem: line,
            value: (line.price || 0) * (line.quantity || 1),
            valueCurrency: line.currency || 'USD',
          })
        }
        continue
      }

      if (item.eventName === 'Started Checkout') {
        const checkoutLineItems = leadLineItems != null && leadLineItems.length > 0 ? leadLineItems : buildLineItems(catalogTypeForLineItems, catalog, orderIndex, catalogTypeForLineItems === 'ecommerce' ? productsPerOrderOpts : {})
        const checkoutItems = lineItemsToKlaviyoItems(checkoutLineItems, catalogTypeForLineItems)
        const cartValue = checkoutLineItems.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 1), 0)
        const checkoutLists = deriveOrderListsFromItems(checkoutItems)
        events.push({
          id: makeId('evt_', ++eventIndex),
          time: timestamp,
          metric_name: KD('Started Checkout'),
          eventName: 'Started Checkout',
          profileId,
          profileEmail,
          items: checkoutItems,
          value: cartValue,
          item_count: checkoutItems.length,
          currency: checkoutLineItems[0]?.currency ?? 'USD',
          brands: checkoutLists.brands,
          item_names: checkoutLists.item_names,
          categories: checkoutLists.categories,
        })
        continue
      }

      const orderPayload = {
        id: makeId('evt_', ++eventIndex),
        time: timestamp,
        metric_name: KD(item.eventName),
        eventName: item.eventName,
        profileId,
        profileEmail,
        ...(lastOrderId && { orderId: lastOrderId }),
      }
      if (['Fulfilled Order', 'Cancelled Order', 'Refunded Order'].includes(item.eventName)) {
        orderPayload.items = lastOrderItems
        const orderLists = deriveOrderListsFromItems(lastOrderItems)
        orderPayload.brands = orderLists.brands
        orderPayload.item_names = orderLists.item_names
        orderPayload.categories = orderLists.categories
        if (item.eventName === 'Refunded Order') {
          orderPayload.value = lastOrderValue
          orderPayload.valueCurrency = lastOrderCurrency
        }
        if (orderSource === 'instore' && runLocation) Object.assign(orderPayload, runLocation)
      }
      if (['Booking Checked in', 'Booking Attended', 'Booking Created'].includes(item.eventName) && runLocation) {
        Object.assign(orderPayload, runLocation)
      }
      events.push(orderPayload)
    }
  }

  events.sort((a, b) => new Date(a.time) - new Date(b.time))

  const eventCounts = {}
  events.forEach((ev) => {
    eventCounts[ev.eventName] = (eventCounts[ev.eventName] || 0) + 1
  })

  const examplesByEventName = {}
  const EXAMPLES_PER_EVENT = 2
  events.forEach((ev) => {
    if (!examplesByEventName[ev.eventName]) examplesByEventName[ev.eventName] = []
    if (examplesByEventName[ev.eventName].length < EXAMPLES_PER_EVENT) {
      examplesByEventName[ev.eventName].push(ev)
    }
  })

  const jobSummary = {
    journeyId,
    journeyName: journey.name,
    journeyCount: totalRuns,
    journeysPerProfile,
    profilesCount: profileIds.length,
    dateRange: dateRangeKey,
    totalEvents: events.length,
    eventCounts,
    profileIds,
    profileEmails,
  }

  return { events, profileIds, profileEmails, jobSummary, examplesByEventName }
}
