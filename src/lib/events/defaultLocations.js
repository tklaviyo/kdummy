/**
 * Default locations used when the data catalog has no locations (e.g. no custom locations created).
 * Same shape as catalog locations: id, name, and optional address parts for event payloads.
 * Used for in-store order events and booking (check-in) events so location_id/location_name
 * can power profile properties (e.g. favorite_store, last_purchase_location).
 */

export const DEFAULT_EVENT_LOCATIONS = [
  { id: 'LOC-001', name: 'Main Store', address: '123 Main St', city: 'City', state: 'ST', country: 'United States', postcode: '12345' },
  { id: 'LOC-002', name: 'Downtown Location', address: '456 Central Ave', city: 'City', state: 'ST', country: 'United States', postcode: '12346' },
  { id: 'LOC-003', name: 'Mall Store', address: '789 Mall Dr', city: 'City', state: 'ST', country: 'United States', postcode: '12347' },
]

/**
 * Normalize a catalog or default location to event payload shape.
 * @param {object} loc - Location from catalog (id, name, address?, city?, state?, country?, postcode?) or already { location_id, location_name, location_address }
 * @returns {{ location_id: string, location_name: string, location_address: string }}
 */
export function toEventLocation(loc) {
  if (!loc) {
    return {
      location_id: 'loc_001',
      location_name: 'Main Store',
      location_address: '123 Main St, City, ST 12345',
    }
  }
  if (loc.location_id != null && loc.location_name != null) {
    return {
      location_id: String(loc.location_id),
      location_name: String(loc.location_name),
      location_address: loc.location_address != null ? String(loc.location_address) : '',
    }
  }
  const parts = [loc.address, loc.city, loc.state, loc.postcode, loc.country].filter(Boolean)
  return {
    location_id: loc.id != null ? String(loc.id) : 'loc_001',
    location_name: loc.name != null ? String(loc.name) : 'Main Store',
    location_address: parts.length ? parts.join(', ') : (loc.address || ''),
  }
}

/**
 * Get the list of locations to use for event generation: catalog locations or defaults.
 * @param {{ locations?: object[] }} catalog
 * @returns {object[]}
 */
export function getLocationsList(catalog) {
  const list = catalog?.locations
  if (Array.isArray(list) && list.length > 0) return list
  return DEFAULT_EVENT_LOCATIONS
}
