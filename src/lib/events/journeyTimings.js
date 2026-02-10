/**
 * Timing between events in a journey.
 * Ecommerce: events close together (linear, minutes).
 * Booking: create → reminder (days before) → confirm → check-in → attend (spaced over days).
 * Subscription: started → renewal/expiry/reminder spaced by subscription interval from catalog.
 *
 * Builder: edit this file to change spacing. generateEvents uses getTimingProfile and computeTimestamps.
 */

const MIN_MS = 60 * 1000
const HOUR_MS = 60 * MIN_MS
const DAY_MS = 24 * HOUR_MS

/**
 * Timing profiles keyed by journey.timingProfile (from journeyDefinitions.js).
 * - ecommerce_linear: equal small steps (e.g. 2–10 min between events)
 * - booking_spaced: offsets in days (create=0, reminder=-2d before booking_at, confirm=-1d, check-in=0, attend=0)
 * - subscription_interval: use catalog subscription interval (e.g. month) to space renewal/expiry/reminder
 */
export const TIMING_PROFILES = {
  ecommerce_linear: {
    /** Minutes between consecutive events (min–max for random) */
    stepMinutesMin: 2,
    stepMinutesMax: 10,
  },
  booking_spaced: {
    /** Days from "booking created" to each subsequent event (positive = after create). Reminder/confirm are negative = before booking_at. */
    daysAfterCreate: {
      'Booking Created': 0,
      'Placed Order': 0,
      'Booking Reminder': -2,
      'Booking Confirmed': -1,
      'Booking Checked in': 0,
      'Booking Attended': 0,
      'Booking Cancelled': 0,
      'Booking Not Attended': 0,
    },
    /** Default booking-at is create + this many days */
    bookingAtDaysFromCreate: 3,
  },
  subscription_interval: {
    /** Fraction of interval for expiry reminder before renewal (e.g. 0.2 = reminder 20% of interval before end) */
    expiryReminderFraction: 0.2,
    /** If catalog has no interval, default to this many days between renewal/expiry events */
    defaultIntervalDays: 30,
  },
}

/** Short descriptions for UI (Events > Generate) */
export const TIMING_DESCRIPTIONS = {
  ecommerce_linear: 'Events are spaced 2–10 minutes apart (linear).',
  booking_spaced: 'Events are spaced over days (reminder/confirm before booking, then check-in/attend).',
  subscription_interval: 'Events follow the subscription interval (renewal, expiry reminder, etc.).',
}

/**
 * @param {string} profileId - e.g. 'ecommerce_linear', 'booking_spaced', 'subscription_interval'
 * @returns {typeof TIMING_PROFILES[keyof typeof TIMING_PROFILES] | null}
 */
export function getTimingProfile(profileId) {
  return TIMING_PROFILES[profileId] ?? null
}

/** Human-readable timing description for the Generate page */
export function getTimingDescription(profileId) {
  return TIMING_DESCRIPTIONS[profileId] ?? 'Events are spread within the timestamp range.'
}

/**
 * Compute timestamp for event at index i in sequence, for ecommerce_linear.
 * @param {number} runStartMs - start of this run
 * @param {number} i - event index in emitSequence
 * @param {number} stepMinutesMin
 * @param {number} stepMinutesMax
 * @returns {number} ms since epoch
 */
export function linearStepMs(runStartMs, i, stepMinutesMin, stepMinutesMax) {
  const stepMs = (stepMinutesMin + Math.random() * (stepMinutesMax - stepMinutesMin)) * MIN_MS
  return runStartMs + i * stepMs
}

/**
 * Compute timestamp for booking_spaced: events spaced by days from create; reminder/confirm are "days before booking_at".
 * @param {number} runStartMs - start of run (booking create time)
 * @param {string} eventName
 * @param {number} indexInSequence
 * @param {{ daysAfterCreate: Record<string, number>, bookingAtDaysFromCreate: number }} profile
 * @returns {number} ms since epoch
 */
export function bookingStepMs(runStartMs, eventName, indexInSequence, profile) {
  const daysMap = profile.daysAfterCreate || {}
  const daysFromCreate = daysMap[eventName] ?? 0
  const bookingAtMs = runStartMs + (profile.bookingAtDaysFromCreate || 3) * DAY_MS
  if (daysFromCreate < 0) {
    return bookingAtMs + daysFromCreate * DAY_MS
  }
  return runStartMs + daysFromCreate * DAY_MS
}

/**
 * Compute timestamp for subscription_interval: renewal/expiry/reminder spaced by interval.
 * Caller passes catalog subscription interval (e.g. 'month', 30) and event role.
 * @param {number} runStartMs - subscription started time
 * @param {number} indexInSequence - index in emit sequence
 * @param {object} opts - { intervalDays?: number, interval?: string, intervalCount?: number }
 * @returns {number} ms since epoch
 */
export function subscriptionStepMs(runStartMs, indexInSequence, opts = {}) {
  let intervalDays = opts.intervalDays ?? opts.defaultIntervalDays ?? 30
  if (opts.interval === 'year') intervalDays = 365
  else if (opts.interval === 'month') intervalDays = 30
  else if (opts.interval === 'week') intervalDays = 7
  else if (opts.interval === 'day') intervalDays = 1
  if (opts.intervalCount) intervalDays *= opts.intervalCount
  return runStartMs + indexInSequence * intervalDays * DAY_MS
}
