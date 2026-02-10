/**
 * Value ranges for event properties that are not in the data catalog.
 * Used when generating sample payloads and mock events (e.g. party_size for bookings).
 * Builder: edit this file to set min/max or options per event (and optionally business type).
 *
 * Structure: EVENT_PROPERTY_RANGES[eventName][propertyKey] = { min, max } (number)
 *   or { options: [...] } for discrete values.
 * Optional: EVENT_PROPERTY_RANGES[eventName][businessTypeId][propertyKey] overrides.
 */

/** @typedef {{ min?: number, max?: number, options?: unknown[] }} RangeDef */

/**
 * By event name, then property key. Optional third level: businessTypeId for overrides.
 * @type {Record<string, Record<string, RangeDef> | Record<string, Record<string, Record<string, RangeDef>>>}
 */
export const EVENT_PROPERTY_RANGES = {
  'Booking Created': {
    party_size: { min: 1, max: 20 },
    duration_minutes: { min: 30, max: 180 },
  },
  'Booking Reminder': {
    duration_minutes: { min: 30, max: 180 },
  },
  'Started Checkout': {
    item_count: { min: 1, max: 10 },
    value: { min: 10, max: 500 },
  },
}

/**
 * Get range config for a property (event-level or event + business type).
 * @param {string} eventName
 * @param {string} propertyKey
 * @param {string} [businessTypeId]
 * @returns {RangeDef | null}
 */
export function getPropertyRange(eventName, propertyKey, businessTypeId) {
  const byEvent = EVENT_PROPERTY_RANGES[eventName]
  if (!byEvent) return null
  if (businessTypeId && byEvent[businessTypeId]?.[propertyKey]) {
    return byEvent[businessTypeId][propertyKey]
  }
  return byEvent[propertyKey] ?? null
}

/**
 * Pick a random value from a range (number) or from options.
 * @param {RangeDef} range
 * @returns {number | string | null}
 */
export function pickValueFromRange(range) {
  if (!range) return null
  if (range.options?.length) {
    return range.options[Math.floor(Math.random() * range.options.length)]
  }
  if (typeof range.min === 'number' && typeof range.max === 'number') {
    const min = Math.min(range.min, range.max)
    const max = Math.max(range.min, range.max)
    return min === max ? min : min + Math.floor(Math.random() * (max - min + 1))
  }
  return null
}
