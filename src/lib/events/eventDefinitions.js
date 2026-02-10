/**
 * Event names and descriptions for the event generator.
 * Grouped by category for display. No Zustand; used by Events page and generator.
 */

export const EVENT_DEFINITIONS = [
  { name: 'Viewed Product', description: 'Viewed an individual product page', category: 'Site activity' },
  { name: 'Added to Cart', description: 'Added a product to cart', category: 'Site activity' },
  { name: 'Started Checkout', description: 'Visited the checkout with products in the cart', category: 'Site activity' },
  { name: 'Subscription Started', description: 'Started a subscription', category: 'Subscription' },
  { name: 'Subscription Updated', description: 'Updated a subscription', category: 'Subscription' },
  { name: 'Subscription Cancelled', description: 'Canceled a subscription', category: 'Subscription' },
  { name: 'Subscription Expiry Reminder', description: 'Reminder that a subscription is expiring soon', category: 'Subscription' },
  { name: 'Subscription Expired', description: 'Subscription has expired', category: 'Subscription' },
  { name: 'Subscription Renewed', description: 'Subscription has renewed', category: 'Subscription' },
  { name: 'Booking Created', description: 'Created a new booking', category: 'Booking' },
  { name: 'Booking Updated', description: 'Updated an existing booking', category: 'Booking' },
  { name: 'Booking Reminder', description: 'Reminder that a booking is coming up', category: 'Booking' },
  { name: 'Booking Cancelled', description: 'Booking has been canceled', category: 'Booking' },
  { name: 'Booking Confirmed', description: 'Confirming a booking from a booking reminder', category: 'Booking' },
  { name: 'Booking Checked in', description: 'Checked in to booking at location', category: 'Booking' },
  { name: 'Booking Attended', description: 'Attended a booking', category: 'Booking' },
  { name: 'Booking Not Attended', description: 'Did not attend a booking', category: 'Booking' },
  { name: 'Placed Order', description: 'Event that represents a total order processed', category: 'Orders' },
  { name: 'Ordered Product', description: 'Event that represents individual product in an order processed', category: 'Orders' },
  { name: 'Fulfilled Order', description: 'Order has been fulfilled', category: 'Orders' },
  { name: 'Cancelled Order', description: 'Order has been cancelled', category: 'Orders' },
  { name: 'Refunded Order', description: 'Order has been refunded', category: 'Orders' },
]

/** Group definitions by category for UI */
export function getEventsByCategory() {
  const byCategory = {}
  EVENT_DEFINITIONS.forEach((ev) => {
    if (!byCategory[ev.category]) byCategory[ev.category] = []
    byCategory[ev.category].push(ev)
  })
  return byCategory
}

export function getEventDescription(eventName) {
  return EVENT_DEFINITIONS.find((e) => e.name === eventName)?.description ?? ''
}
