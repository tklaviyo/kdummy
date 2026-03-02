/**
 * Profile property groups for organising properties on Generate and Configure screens.
 * Order defines display order in the UI.
 */

export const PROFILE_PROPERTY_GROUPS = [
  { id: 'general', label: 'General' },
  { id: 'locations', label: 'Locations' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'other', label: 'Other' },
]

/** Default group for custom properties when not specified */
export const DEFAULT_GROUP_ID = 'other'

/** Map default property names to group id */
const DEFAULT_PROPERTY_GROUP_MAP = {
  gender: 'general',
  birthday: 'general',
  signup_date: 'general',
  marketing_preferences: 'preferences',
  loyalty_member: 'loyalty',
  loyalty_tier: 'loyalty',
}

/** Default (built-in) property names; custom properties are not in this set */
export const DEFAULT_PROPERTY_NAMES = new Set(Object.keys(DEFAULT_PROPERTY_GROUP_MAP))

/**
 * Whether this property is a built-in default (vs custom).
 * @param {{ name: string, original_name?: string }} property
 * @returns {boolean}
 */
export function isDefaultProfileProperty(property) {
  const name = property.original_name || property.name
  return DEFAULT_PROPERTY_NAMES.has(name)
}

/**
 * Whether this property name is a built-in default (vs custom). Used when prefixing custom properties with kd_ for Klaviyo.
 * @param {string} name - Property name
 * @returns {boolean}
 */
export function isDefaultProfilePropertyName(name) {
  return DEFAULT_PROPERTY_NAMES.has(name)
}

/**
 * Get group id for a property (from property.group or inferred from name for defaults).
 * Normalizes legacy group ids (demographics → general, in_store → locations).
 * Default (built-in) properties always use their canonical group from the map (e.g. signup_date → general).
 * @param {{ name: string, original_name?: string, group?: string }} property
 * @returns {string}
 */
export function getPropertyGroupId(property) {
  const name = property.original_name || property.name
  if (DEFAULT_PROPERTY_GROUP_MAP[name]) {
    return DEFAULT_PROPERTY_GROUP_MAP[name]
  }
  let group = property.group
  if (group === 'demographics') group = 'general'
  if (group === 'in_store') group = 'locations'
  if (group && PROFILE_PROPERTY_GROUPS.some((g) => g.id === group)) {
    return group
  }
  return DEFAULT_GROUP_ID
}

/**
 * Group an array of properties by their group id, in PROFILE_PROPERTY_GROUPS order.
 * @param {object[]} properties
 * @returns {{ groupId: string, label: string, properties: object[] }[]}
 */
export function groupProperties(properties) {
  const byGroup = new Map()
  PROFILE_PROPERTY_GROUPS.forEach((g) => byGroup.set(g.id, { groupId: g.id, label: g.label, properties: [] }))
  properties.forEach((p) => {
    const groupId = getPropertyGroupId(p)
    const bucket = byGroup.get(groupId) || byGroup.get(DEFAULT_GROUP_ID)
    bucket.properties.push(p)
  })
  return PROFILE_PROPERTY_GROUPS.map((g) => byGroup.get(g.id)).filter((b) => b && b.properties.length > 0)
}
