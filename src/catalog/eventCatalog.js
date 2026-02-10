/**
 * Event catalog — canonical list of events and predefined journeys.
 * Use this as the single source of truth for the event builder.
 * Events map to Klaviyo metrics; journeys generate multiple events at once per profile.
 *
 * ——— Suggested flow on the Events page (generate en masse) ———
 *
 * 1. MODE: "By journey" vs "Custom events"
 *
 *    • By journey (recommended): User picks one predefined journey (e.g. "E-commerce purchase",
 *      "Booking completed", "Subscription renewal"). The app then generates all events in that
 *      journey in order for each selected profile. Good for realistic, multi-event scenarios.
 *
 *    • Custom events: User picks one or more events from the catalog (grouped by category:
 *      Site activity, Subscription, Booking, Orders). Generate those events for each selected
 *      profile. Good for one-off or ad-hoc event sets.
 *
 * 2. OFFERING / INDUSTRY (optional filter for journeys)
 *
 *    When "By journey" is selected, optionally filter or group journeys by offering:
 *    • products   — e-commerce (E-commerce purchase, Browse no purchase, Order then refund)
 *    • subscriptions — SaaS, memberships, boxes (New subscriber, Subscription renewal, etc.)
 *    • bookings   — services (Booking completed, No-show, Canceled)
 *
 *    This helps users find the right journey without scrolling the full list.
 *
 * 3. TARGET: Who receives the events
 *
 *    • Single profile: Dropdown/search to pick one profile; all events (or journey) go to that profile.
 *    • Multiple profiles: Choose N (e.g. "Generate for 10 random profiles") or "All in list" / pick
 *      several. Each profile gets the full journey or selected events.
 *
 * 4. TIME SPREAD (optional)
 *
 *    For journeys, events can be generated with realistic spacing (e.g. Viewed Product 3 days ago,
 *    Added to Cart 2 days ago, Placed Order 1 day ago, Fulfilled Order today). Option: "All now"
 *    vs "Spread over last 7 days" (or configurable window).
 *
 * 5. GENERATE
 *
 *    Call Klaviyo (or app API) to create the metric + event(s) for each profile. Data catalog can
 *    power event properties: e.g. product/catalog for Viewed Product / Ordered Product, subscription
 *    for Subscription events, booking resource for Booking events.
 */

// ——— Event catalog (category, name, description) ———
// IDs are slugs used in code and can map to metric names (e.g. "Viewed Product").
export const EVENT_CATALOG = [
  // Site activity
  { id: 'viewed_product', category: 'Site activity', name: 'Viewed Product', description: 'Viewed an individual product page' },
  { id: 'viewed_page', category: 'Site activity', name: 'Viewed Page', description: 'Viewed a non-product page' },
  { id: 'added_to_cart', category: 'Site activity', name: 'Added to Cart', description: 'Added a product to cart' },
  { id: 'started_checkout', category: 'Site activity', name: 'Started Checkout', description: 'Visited the checkout with products in the cart' },
  // Subscription
  { id: 'subscription_started', category: 'Subscription', name: 'Subscription Started', description: 'Started a subscription' },
  { id: 'subscription_updated', category: 'Subscription', name: 'Subscription Updated', description: 'Updated a subscription' },
  { id: 'subscription_canceled', category: 'Subscription', name: 'Subscription Canceled', description: 'Canceled a subscription' },
  { id: 'subscription_expiry_reminder', category: 'Subscription', name: 'Subscription Expiry Reminder', description: 'Reminder that a subscription is expiring soon' },
  { id: 'subscription_expired', category: 'Subscription', name: 'Subscription Expired', description: 'Subscription has expired' },
  { id: 'subscription_renewed', category: 'Subscription', name: 'Subscription Renewed', description: 'Subscription renewed successfully' },
  // Booking
  { id: 'booking_created', category: 'Booking', name: 'Booking Created', description: 'Created a new booking' },
  { id: 'booking_updated', category: 'Booking', name: 'Booking Updated', description: 'Updated an existing booking' },
  { id: 'booking_reminder', category: 'Booking', name: 'Booking Reminder', description: 'Reminder that a booking is coming up' },
  { id: 'booking_canceled', category: 'Booking', name: 'Booking Canceled', description: 'Booking has been canceled' },
  { id: 'booking_confirmed', category: 'Booking', name: 'Booking Confirmed', description: 'Confirmed a booking' },
  { id: 'booking_checked_in', category: 'Booking', name: 'Booking Checked in', description: 'Checked in to booking at location' },
  { id: 'booking_attended', category: 'Booking', name: 'Booking Attended', description: 'Attended a booking' },
  { id: 'booking_not_attended', category: 'Booking', name: 'Booking Not Attended', description: 'Did not attend a booking' },
  // Orders
  { id: 'placed_order', category: 'Orders', name: 'Placed Order', description: 'Event that represents a total order processed' },
  { id: 'ordered_product', category: 'Orders', name: 'Ordered Product', description: 'Event that represents individual product in an order processed' },
  { id: 'fulfilled_order', category: 'Orders', name: 'Fulfilled Order', description: 'Order has been fulfilled' },
  { id: 'canceled_order', category: 'Orders', name: 'Canceled Order', description: 'Order has been canceled' },
  { id: 'refunded_order', category: 'Orders', name: 'Refunded Order', description: 'Order has been refunded' },
]

// ——— Predefined journeys (multiple events in sequence, one per profile) ———
// Order of eventIds is the order events should be generated (oldest to newest if using time spread).
export const JOURNEYS = [
  {
    id: 'ecommerce_purchase',
    name: 'E-commerce purchase',
    description: 'Full purchase path: browse → cart → checkout → order → fulfillment',
    offering: 'products',
    eventIds: ['viewed_category', 'viewed_product', 'added_to_cart', 'started_checkout', 'placed_order', 'ordered_product', 'fulfilled_order'],
  },
  {
    id: 'ecommerce_browse_no_purchase',
    name: 'Browse, no purchase',
    description: 'Site activity only: category and product views, add to cart, no order',
    offering: 'products',
    eventIds: ['viewed_page', 'viewed_category', 'viewed_product', 'added_to_cart', 'started_checkout'],
  },
  {
    id: 'new_subscriber',
    name: 'New subscriber',
    description: 'Single event: subscription started',
    offering: 'subscriptions',
    eventIds: ['subscription_started'],
  },
  {
    id: 'subscription_renewal',
    name: 'Subscription renewal',
    description: 'Renewal flow: subscription renewed (optionally after expiry reminder)',
    offering: 'subscriptions',
    eventIds: ['subscription_expiry_reminder', 'subscription_renewed'],
  },
  {
    id: 'subscription_lifecycle',
    name: 'Subscription lifecycle',
    description: 'Start → renew → reminder → renew again',
    offering: 'subscriptions',
    eventIds: ['subscription_started', 'subscription_renewed', 'subscription_expiry_reminder', 'subscription_renewed'],
  },
  {
    id: 'subscription_churn',
    name: 'Subscription churn',
    description: 'Started, reminder, then expired or canceled',
    offering: 'subscriptions',
    eventIds: ['subscription_started', 'subscription_expiry_reminder', 'subscription_expired'],
  },
  {
    id: 'booking_completed',
    name: 'Booking completed',
    description: 'Full booking path: create → confirm → reminder → check-in → attended',
    offering: 'bookings',
    eventIds: ['booking_created', 'booking_confirmed', 'booking_reminder', 'booking_checked_in', 'booking_attended'],
  },
  {
    id: 'booking_no_show',
    name: 'Booking no-show',
    description: 'Booking confirmed and reminded, then not attended',
    offering: 'bookings',
    eventIds: ['booking_created', 'booking_confirmed', 'booking_reminder', 'booking_not_attended'],
  },
  {
    id: 'booking_canceled_flow',
    name: 'Booking canceled',
    description: 'Booking created and confirmed, then canceled',
    offering: 'bookings',
    eventIds: ['booking_created', 'booking_confirmed', 'booking_canceled'],
  },
  {
    id: 'order_refund',
    name: 'Order then refund',
    description: 'Placed order, fulfilled, then refunded',
    offering: 'products',
    eventIds: ['placed_order', 'ordered_product', 'fulfilled_order', 'refunded_order'],
  },
]

// ——— Helpers ———
export const EVENT_CATEGORIES = [...new Set(EVENT_CATALOG.map((e) => e.category))]

export function getEventById(id) {
  return EVENT_CATALOG.find((e) => e.id === id) || null
}

export function getEventsByCategory(category) {
  return EVENT_CATALOG.filter((e) => e.category === category)
}

export function getJourneyById(id) {
  return JOURNEYS.find((j) => j.id === id) || null
}

export function getJourneysByOffering(offering) {
  return JOURNEYS.filter((j) => j.offering === offering)
}

export function getEventsForJourney(journeyId) {
  const journey = getJourneyById(journeyId)
  if (!journey) return []
  return journey.eventIds.map((eid) => getEventById(eid)).filter(Boolean)
}
