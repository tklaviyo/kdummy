/**
 * Event property overrides/additions per business type (industry).
 * Keys are business type ids from businessTypes.js. These are merged on top of
 * EVENT_PROPERTY_SCHEMAS in eventPropertiesSchema.js so that certain events
 * get additional mandatory or catalog-driven properties for that offering.
 *
 * Builder: Edit this file to set the default template per industry (e.g. apparel
 * adds gender; variant/options from catalog appear as top-level key-value in payloads; flight-tickets add flight_number, departure_airport).
 * Users can add further customisations in the app (Events → Configure).
 *
 * Examples:
 * - Apparel/Footwear: gender, size, color (variant details) on product events
 * - Flight tickets: flight_number, departure_airport, arrival_airport on booking/order events
 * - SaaS/Subscription plans: plan_tier, seat_count, interval on subscription events
 */

/** @typedef {{ key: string, description: string, example?: any, source?: string, catalogField?: string }} PropertyDef */

/**
 * Per business type id: { [eventName]: { mandatory?: PropertyDef[], catalogDriven?: PropertyDef[] } }
 * Only list events that need extra properties for this business type.
 */
export const EVENT_PROPERTIES_BY_BUSINESS_TYPE = {
  // ——— Product: fashion / apparel ———
  apparel: {
    'Viewed Product': {
      catalogDriven: [
        { key: 'gender', description: 'Gender (from catalog)', source: 'catalog', catalogField: 'gender' },
      ],
    },
    'Added to Cart': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
    'Ordered Product': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
  },
  footwear: {
    'Viewed Product': {
      catalogDriven: [
        { key: 'gender', description: 'Gender (from catalog)', source: 'catalog', catalogField: 'gender' },
      ],
    },
    'Added to Cart': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
    'Ordered Product': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
  },
  activewear: {
    'Viewed Product': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
    'Added to Cart': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
    'Ordered Product': {
      catalogDriven: [
        { key: 'gender', description: 'Gender', source: 'catalog', catalogField: 'gender' },
      ],
    },
  },

  // ——— Product: travel / flights ———
  'flight-tickets': {
    'Viewed Product': {
      mandatory: [
        { key: 'flight_number', description: 'Flight number', example: 'KL123', source: 'catalog' },
        { key: 'departure_airport', description: 'Departure airport code', example: 'JFK', source: 'catalog' },
        { key: 'arrival_airport', description: 'Arrival airport code', example: 'AMS', source: 'catalog' },
        { key: 'departure_datetime', description: 'Scheduled departure (ISO 8601)', example: '2025-02-15T14:30:00Z', source: 'catalog' },
      ],
      catalogDriven: [
        { key: 'cabin_class', description: 'Cabin class', source: 'catalog', catalogField: 'options' },
        { key: 'fare_type', description: 'Fare type (Standard/Flex/Refundable)', source: 'catalog', catalogField: 'options' },
      ],
    },
    'Added to Cart': {
      mandatory: [
        { key: 'flight_number', description: 'Flight number', example: 'KL123', source: 'catalog' },
        { key: 'departure_airport', description: 'Departure airport', example: 'JFK', source: 'catalog' },
        { key: 'arrival_airport', description: 'Arrival airport', example: 'AMS', source: 'catalog' },
      ],
      catalogDriven: [
        { key: 'cabin_class', description: 'Cabin class', source: 'catalog', catalogField: 'options' },
      ],
    },
    'Placed Order': {
      mandatory: [
        { key: 'flight_number', description: 'Flight number', example: 'KL123', source: 'catalog' },
        { key: 'departure_airport', description: 'Departure airport', example: 'JFK', source: 'catalog' },
        { key: 'arrival_airport', description: 'Arrival airport', example: 'AMS', source: 'catalog' },
        { key: 'departure_datetime', description: 'Scheduled departure', example: '2025-02-15T14:30:00Z', source: 'catalog' },
      ],
    },
    'Ordered Product': {
      mandatory: [
        { key: 'flight_number', description: 'Flight number', example: 'KL123', source: 'catalog' },
        { key: 'departure_airport', description: 'Departure airport', example: 'JFK', source: 'catalog' },
        { key: 'arrival_airport', description: 'Arrival airport', example: 'AMS', source: 'catalog' },
      ],
      catalogDriven: [
        { key: 'cabin_class', description: 'Cabin class', source: 'catalog', catalogField: 'options' },
      ],
    },
  },

  // ——— Subscription: SaaS / plans ———
  'saas-plans': {
    'Subscription Started': {
      catalogDriven: [
        { key: 'plan_tier', description: 'Plan tier (from categories)', source: 'catalog', catalogField: 'categories' },
        { key: 'interval', description: 'Billing interval', source: 'catalog', catalogField: 'interval' },
        { key: 'interval_count', description: 'Interval count', source: 'catalog', catalogField: 'intervalCount' },
      ],
    },
    'Subscription Renewed': {
      catalogDriven: [
        { key: 'plan_tier', description: 'Plan tier', source: 'catalog', catalogField: 'categories' },
        { key: 'interval', description: 'Billing interval', source: 'catalog', catalogField: 'interval' },
      ],
    },
    'Subscription Updated': {
      catalogDriven: [
        { key: 'plan_tier', description: 'Plan tier', source: 'catalog', catalogField: 'categories' },
      ],
    },
  },
  'gym-studio-memberships': {
    'Subscription Started': {
      catalogDriven: [
        { key: 'membership_type', description: 'Membership type', source: 'catalog', catalogField: 'categories' },
        { key: 'interval', description: 'Billing interval', source: 'catalog', catalogField: 'interval' },
      ],
    },
    'Subscription Renewed': {
      catalogDriven: [
        { key: 'membership_type', description: 'Membership type', source: 'catalog', catalogField: 'categories' },
      ],
    },
  },

  // ——— Service: bookings (e.g. restaurant, hotel) ———
  'restaurant-reservations': {
    'Booking Created': {
      catalogDriven: [
        { key: 'party_size', description: 'Party size (range configured in eventPropertyRanges.js)', source: 'range' },
        { key: 'duration_minutes', description: 'Reservation duration', source: 'catalog', catalogField: 'durationMinutes' },
      ],
    },
    'Booking Reminder': {
      catalogDriven: [
        { key: 'duration_minutes', description: 'Reservation duration', source: 'catalog', catalogField: 'durationMinutes' },
      ],
    },
  },
  'hotel-rooms': {
    'Booking Created': {
      mandatory: [
        { key: 'check_in_date', description: 'Check-in date', example: '2025-02-15', source: 'catalog' },
        { key: 'check_out_date', description: 'Check-out date', example: '2025-02-17', source: 'catalog' },
      ],
      catalogDriven: [
        { key: 'room_type', description: 'Room type (from name/categories)', source: 'catalog', catalogField: 'name' },
        { key: 'duration_minutes', description: 'Stay length (minutes)', source: 'catalog', catalogField: 'durationMinutes' },
      ],
    },
  },
}

/**
 * Get business-type-specific property overrides for an event.
 * @param {string} businessTypeId - From businessTypes.js (e.g. 'apparel', 'flight-tickets')
 * @param {string} eventName
 * @returns {{ mandatory: PropertyDef[], catalogDriven: PropertyDef[] } | null}
 */
export function getEventPropertiesForBusinessType(businessTypeId, eventName) {
  if (!businessTypeId) return null
  const byEvent = EVENT_PROPERTIES_BY_BUSINESS_TYPE[businessTypeId]
  if (!byEvent) return null
  return byEvent[eventName] ?? null
}

/**
 * List all business type ids that have event property overrides.
 */
export function getBusinessTypeIdsWithOverrides() {
  return Object.keys(EVENT_PROPERTIES_BY_BUSINESS_TYPE)
}

/**
 * Get business type ids that have overrides for the given event (for Configure dropdown).
 */
export function getBusinessTypeIdsForEvent(eventName) {
  if (!eventName) return []
  return Object.keys(EVENT_PROPERTIES_BY_BUSINESS_TYPE).filter(
    (btId) => EVENT_PROPERTIES_BY_BUSINESS_TYPE[btId][eventName]
  )
}

