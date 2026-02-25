/**
 * Journey definitions: Product (online), Product (in-store), Service (booking), Subscription.
 * Type dropdown: Product (online), Product (in-store), Service (booking), Subscription.
 * Variant for Product: Ordered (full), Abandon, Cancelled, Refunded.
 * Product in-store: no abandon variant. Service and Subscription: include Viewed Product, Added to Cart, Started Checkout and have an abandon variant.
 * timingProfile: see journeyTimings.js for spacing between events.
 */

const LEAD_EVENTS_CART_CHECKOUT = ['Viewed Product', 'Added to Cart', 'Started Checkout']

export const JOURNEYS = [
  // ——— Product (online): Ordered first, then Abandon, Cancelled, Refunded ———
  {
    id: 'ecommerce_online-full',
    name: 'Product (online) — Ordered',
    type: 'ecommerce_online',
    variant: 'full',
    description: 'Complete online purchase: browse → cart → checkout → order → fulfillment',
    eventNames: [
      'Viewed Product',
      'Added to Cart',
      'Started Checkout',
      'Placed Order',
      'Ordered Product',
      'Fulfilled Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  {
    id: 'ecommerce_online-abandon',
    name: 'Product (online) — Abandon',
    type: 'ecommerce_online',
    variant: 'abandon',
    description: 'Abandoned cart: browse → cart → checkout, then stop',
    eventNames: ['Viewed Product', 'Added to Cart', 'Started Checkout'],
    timingProfile: 'ecommerce_linear',
  },
  {
    id: 'ecommerce_online-cancelled',
    name: 'Product (online) — Cancelled',
    type: 'ecommerce_online',
    variant: 'cancelled',
    description: 'Order then cancelled',
    eventNames: [
      'Viewed Product',
      'Added to Cart',
      'Started Checkout',
      'Placed Order',
      'Ordered Product',
      'Cancelled Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  {
    id: 'ecommerce_online-refunded',
    name: 'Product (online) — Refunded',
    type: 'ecommerce_online',
    variant: 'refunded',
    description: 'Order then refunded',
    eventNames: [
      'Viewed Product',
      'Added to Cart',
      'Started Checkout',
      'Placed Order',
      'Ordered Product',
      'Fulfilled Order',
      'Refunded Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  // ——— Product (in-store): Ordered first, then Cancelled, Refunded ———
  {
    id: 'ecommerce_instore-full',
    name: 'Product (in-store) — Ordered',
    type: 'ecommerce_instore',
    variant: 'full',
    description: 'Complete in-store purchase: order → fulfillment',
    eventNames: [
      'Placed Order',
      'Ordered Product',
      'Fulfilled Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  {
    id: 'ecommerce_instore-cancelled',
    name: 'Product (in-store) — Cancelled',
    type: 'ecommerce_instore',
    variant: 'cancelled',
    description: 'In-store order then cancelled',
    eventNames: [
      'Placed Order',
      'Ordered Product',
      'Cancelled Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  {
    id: 'ecommerce_instore-refunded',
    name: 'Product (in-store) — Refunded',
    type: 'ecommerce_instore',
    variant: 'refunded',
    description: 'In-store order then refunded',
    eventNames: [
      'Placed Order',
      'Ordered Product',
      'Fulfilled Order',
      'Refunded Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  // ——— Subscription: Subscribed first, then Abandon, Cancelled, Expired ———
  {
    id: 'subscription-full',
    name: 'Subscription — Subscribed',
    type: 'subscription',
    variant: 'full',
    description: 'Browse → cart → checkout → subscribe → renewals → expiry reminder → renewed',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Subscription Started',
      'Placed Order',
      'Subscription Renewed',
      'Placed Order',
      'Subscription Expiry Reminder',
      'Subscription Renewed',
      'Placed Order',
    ],
    timingProfile: 'subscription_interval',
  },
  {
    id: 'subscription-abandon',
    name: 'Subscription — Abandon',
    type: 'subscription',
    variant: 'abandon',
    description: 'Browse → cart → checkout, then stop before subscribing',
    eventNames: [...LEAD_EVENTS_CART_CHECKOUT],
    timingProfile: 'subscription_interval',
  },
  {
    id: 'subscription-cancelled',
    name: 'Subscription — Cancelled',
    type: 'subscription',
    variant: 'cancelled',
    description: 'Browse → subscribe then cancel',
    eventNames: [...LEAD_EVENTS_CART_CHECKOUT, 'Subscription Started', 'Placed Order', 'Subscription Cancelled'],
    timingProfile: 'subscription_interval',
  },
  {
    id: 'subscription-expired',
    name: 'Subscription — Expired',
    type: 'subscription',
    variant: 'expired',
    description: 'Browse → subscribe → expiry reminder → expired',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Subscription Started',
      'Placed Order',
      'Subscription Expiry Reminder',
      'Subscription Expired',
    ],
    timingProfile: 'subscription_interval',
  },
  // ——— Booking (service): Attended first, then Abandon, Cancelled, Not attended ———
  {
    id: 'booking-full',
    name: 'Booking — Attended',
    type: 'booking',
    variant: 'full',
    description: 'Browse → cart → checkout → create booking → reminder → confirm → check-in → attended',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Booking Created',
      'Placed Order',
      'Booking Reminder',
      'Booking Confirmed',
      'Booking Checked in',
      'Booking Attended',
    ],
    timingProfile: 'booking_spaced',
  },
  {
    id: 'booking-abandon',
    name: 'Booking — Abandon',
    type: 'booking',
    variant: 'abandon',
    description: 'Browse → cart → checkout, then stop before booking',
    eventNames: [...LEAD_EVENTS_CART_CHECKOUT],
    timingProfile: 'booking_spaced',
  },
  {
    id: 'booking-cancelled',
    name: 'Booking — Cancelled',
    type: 'booking',
    variant: 'cancelled',
    description: 'Browse → create booking then cancel',
    eventNames: [...LEAD_EVENTS_CART_CHECKOUT, 'Booking Created', 'Placed Order', 'Booking Cancelled'],
    timingProfile: 'booking_spaced',
  },
  {
    id: 'booking-not-attended',
    name: 'Booking — Not attended',
    type: 'booking',
    variant: 'not-attended',
    description: 'Browse → booking created and reminder, but did not attend',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Booking Created',
      'Placed Order',
      'Booking Reminder',
      'Booking Confirmed',
      'Booking Not Attended',
    ],
    timingProfile: 'booking_spaced',
  },
]

export function getJourneyById(id) {
  return JOURNEYS.find((j) => j.id === id)
}

export function getJourneysByType(type) {
  return JOURNEYS.filter((j) => j.type === type)
}

/** Get journey id from type + variant, e.g. 'ecommerce_online' + 'full' -> 'ecommerce_online-full' */
export function getJourneyIdFromTypeAndVariant(type, variant) {
  const j = JOURNEYS.find((x) => x.type === type && x.variant === variant)
  return j ? j.id : null
}

/** Unique event names for a journey (order preserved; duplicates like Placed Order appear once in set for selection) */
export function getUniqueEventNamesForJourney(journeyId) {
  const j = getJourneyById(journeyId)
  if (!j) return []
  return [...new Set(j.eventNames)]
}

/** Whether this journey type is product (online or in-store) for catalog/UI purposes */
export function isProductJourneyType(type) {
  return type === 'ecommerce_online' || type === 'ecommerce_instore'
}
