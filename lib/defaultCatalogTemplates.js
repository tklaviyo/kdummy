/**
 * Default catalog templates used when the account has no custom data.
 * Used in Configure (profile properties) and Generate (single-profile value picker)
 * so users can still map to properties and pick from template values.
 */

export const DEFAULT_CATALOG_TEMPLATES = {
  products: [
    { id: 'PROD-001', name: 'Wireless Headphones', category: 'Electronics', price: 99.99 },
    { id: 'PROD-002', name: 'Smart Watch', category: 'Electronics', price: 249.99 },
    { id: 'PROD-003', name: 'Running Shoes', category: 'Clothing', price: 79.99 },
    { id: 'PROD-004', name: 'Coffee Maker', category: 'Home', price: 129.99 },
  ],
  services: [
    { id: 'SERV-001', name: 'Consultation', type: 'Advisory', price: 150 },
    { id: 'SERV-002', name: 'Installation', type: 'Support', price: 75 },
  ],
  subscriptions: [
    { id: 'SUB-001', name: 'Premium Monthly', plan: 'Monthly', price: 9.99 },
    { id: 'SUB-002', name: 'Premium Annual', plan: 'Annual', price: 99.99 },
  ],
  locations: [
    { id: 'LOC-001', name: 'Downtown Store', city: 'New York', region: 'NY' },
    { id: 'LOC-002', name: 'Mall Location', city: 'Los Angeles', region: 'CA' },
  ],
  reservations: [
    { id: 'RES-001', type: 'Hotel', name: 'Grand Hotel', location: 'New York' },
    { id: 'RES-002', type: 'Restaurant', name: 'Fine Dining', location: 'Los Angeles' },
    { id: 'RES-003', type: 'Event', name: 'Concert Hall', location: 'Chicago' },
  ],
  loyalty: {
    tiers: [
      { name: 'Bronze', points_threshold: 0, spend_threshold: 0 },
      { name: 'Silver', points_threshold: 1000, spend_threshold: 500 },
      { name: 'Gold', points_threshold: 5000, spend_threshold: 2500 },
      { name: 'Platinum', points_threshold: 10000, spend_threshold: 5000 },
    ],
  },
}

/**
 * Get the list of items for a catalog source (for dropdowns and mapping).
 * For loyalty, returns tiers array; for others returns the array as-is.
 */
export function getCatalogItemsForSource(source, catalogData, useTemplatesWhenEmpty = true) {
  if (!source) return []
  const templates = DEFAULT_CATALOG_TEMPLATES
  if (source === 'loyalty' || source === 'loyalty_tiers') {
    const loyalty = catalogData?.loyalty
    const tiers = loyalty?.tiers
    if (Array.isArray(tiers) && tiers.length > 0) return tiers
    if (useTemplatesWhenEmpty && templates.loyalty?.tiers) return templates.loyalty.tiers
    return []
  }
  const arr = catalogData?.[source]
  if (Array.isArray(arr) && arr.length > 0) return arr
  if (useTemplatesWhenEmpty && templates[source] && Array.isArray(templates[source])) return templates[source]
  return []
}

/**
 * Whether the catalog has custom data for this source (vs using template).
 */
export function hasCustomCatalogData(source, catalogData) {
  if (!source) return false
  if (source === 'loyalty' || source === 'loyalty_tiers') {
    const tiers = catalogData?.loyalty?.tiers
    return Array.isArray(tiers) && tiers.length > 0
  }
  const arr = catalogData?.[source]
  return Array.isArray(arr) && arr.length > 0
}
