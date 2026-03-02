/**
 * Journey definitions: Product (online), Product (in-store), Service (booking), Subscription.
 * Type dropdown: Product (online), Product (in-store), Service (booking), Subscription.
 * Variants: Ordered (full), Cancelled/Refunded for products; Attended, Cancelled/Not attended for bookings; Subscribed/Renewed, Cancelled/Expired for subscriptions.
 * No abandon variants — users deselect events to get lead-only flows.
 * timingProfile: see journeyTimings.js for spacing between events.
 */

const LEAD_EVENTS_CART_CHECKOUT = ['Viewed Product', 'Added to Cart', 'Started Checkout']

export const JOURNEYS = [
  // ——— Product (online): Ordered, Cancelled/Refunded ———
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
    id: 'ecommerce_online-cancelled-refunded',
    name: 'Product (online) — Cancelled/Refunded',
    type: 'ecommerce_online',
    variant: 'cancelled-refunded',
    description: 'Order then cancelled or refunded. Select which events to include (Fulfilled, Cancelled, Refunded).',
    eventNames: [
      'Viewed Product',
      'Added to Cart',
      'Started Checkout',
      'Placed Order',
      'Ordered Product',
      'Fulfilled Order',
      'Cancelled Order',
      'Refunded Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  // ——— Product (in-store): Ordered, Cancelled/Refunded ———
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
    id: 'ecommerce_instore-cancelled-refunded',
    name: 'Product (in-store) — Cancelled/Refunded',
    type: 'ecommerce_instore',
    variant: 'cancelled-refunded',
    description: 'In-store order then cancelled or refunded. Select which events to include (Fulfilled, Cancelled, Refunded).',
    eventNames: [
      'Placed Order',
      'Ordered Product',
      'Fulfilled Order',
      'Cancelled Order',
      'Refunded Order',
    ],
    timingProfile: 'ecommerce_linear',
  },
  // ——— Subscription: Subscribed/Renewed, Cancelled/Expired ———
  {
    id: 'subscription-full',
    name: 'Subscription — Subscribed/Renewed',
    type: 'subscription',
    variant: 'full',
    description: 'Subscribe → (yearly: reminders 30d & 7d before renewal) → renewed. Placed Order at each payment. Yearly only: renewal & reminders.',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Subscription Started',
      'Placed Order',
      'Subscription Expiry Reminder',
      'Subscription Expiry Reminder',
      'Subscription Renewed',
      'Placed Order',
    ],
    timingProfile: 'subscription_interval',
  },
  {
    id: 'subscription-cancelled',
    name: 'Subscription — Cancelled/Expired',
    type: 'subscription',
    variant: 'cancelled',
    description: 'Subscribe → (yearly: reminders 30d & 7d before expiry) → cancel → expire at period end. Yearly only: reminders & expired.',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Subscription Started',
      'Placed Order',
      'Subscription Expiry Reminder',
      'Subscription Expiry Reminder',
      'Subscription Cancelled',
      'Subscription Expired',
    ],
    timingProfile: 'subscription_interval',
  },
  // ——— Booking (service): Attended, Cancelled/Not attended ———
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
    id: 'booking-cancelled-not-attended',
    name: 'Booking — Cancelled/Not attended',
    type: 'booking',
    variant: 'cancelled-not-attended',
    description: 'Booking created then cancelled or not attended. Select which events to include (Reminder, Confirmed, Cancelled, Not attended).',
    eventNames: [
      ...LEAD_EVENTS_CART_CHECKOUT,
      'Booking Created',
      'Placed Order',
      'Booking Reminder',
      'Booking Confirmed',
      'Booking Cancelled',
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
