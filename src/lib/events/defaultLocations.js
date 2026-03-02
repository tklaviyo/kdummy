/**
 * Default locations used when no custom locations exist, or as generic options.
 * Same shape as catalog locations: id, name, and optional address parts for event payloads.
 * Generic names so they work for any business type (retail, services, offices, etc.).
 */

export const DEFAULT_EVENT_LOCATIONS = [
  { id: 'LOC-001', name: 'Location 1', address: '123 Main St', city: 'City', state: 'ST', country: 'United States', postcode: '12345' },
  { id: 'LOC-002', name: 'Location 2', address: '456 Central Ave', city: 'City', state: 'ST', country: 'United States', postcode: '12346' },
  { id: 'LOC-003', name: 'Location 3', address: '789 Oak Blvd', city: 'City', state: 'ST', country: 'United States', postcode: '12347' },
  { id: 'LOC-004', name: 'Location 4', address: '100 Park Rd', city: 'City', state: 'ST', country: 'United States', postcode: '12348' },
  { id: 'LOC-005', name: 'Location 5', address: '200 River Dr', city: 'City', state: 'ST', country: 'United States', postcode: '12349' },
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
      location_name: 'Location 1',
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
    location_name: loc.name != null ? String(loc.name) : 'Location 1',
    location_address: parts.length ? parts.join(', ') : (loc.address || ''),
  }
}

/**
 * Get the list of locations to use for event generation.
 * When catalog.locations is explicitly an array (including empty), use it; otherwise use defaults.
 * Pass an empty array when locations should not be included in events.
 * @param {{ locations?: object[] }} catalog
 * @returns {object[]}
 */
export function getLocationsList(catalog) {
  const list = catalog?.locations
  if (Array.isArray(list)) return list
  return DEFAULT_EVENT_LOCATIONS
}
