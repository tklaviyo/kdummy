/**
 * Event property definitions: mandatory properties per event and catalog/context-driven properties.
 * Used for preview on Events page and for defining what each event sends.
 *
 * Builder: Edit this file to set the default (base) properties for each event. Edit
 * eventPropertiesByBusinessType.js to set defaults per industry. User customisations
 * (Events → Configure) are stored in localStorage and merged on top of these defaults.
 */

import { getEventPropertiesForBusinessType } from './eventPropertiesByBusinessType'
import { getCustomisationsForEvent, customisationsToSchema } from './eventPropertiesCustomisationsStorage'
import { getPropertyRange, pickValueFromRange } from './eventPropertyRanges'
import { getLocationsList, toEventLocation } from './defaultLocations'

/** Suffix for dummy event metric names in Klaviyo (e.g. "Placed Order (KD)") */
export const KD_METRIC_SUFFIX = ' (KD)'

/** Mandatory property: key, description, example (or source: 'catalog' for catalog-driven) */
const MANDATORY = [
  { key: 'metric_name', description: 'Event metric name', example: 'Viewed Product (KD)', source: 'system' },
  { key: 'time', description: 'Event time (ISO 8601)', example: '2025-01-28T12:00:00.000Z', source: 'system' },
  { key: 'profile_id', description: 'Profile identifier', example: '01J001', source: 'system' },
  { key: 'profile_email', description: 'Profile email', example: 'profile-001@klaviyo-dummy.com', source: 'system' },
]

/** Per-event mandatory and catalog-driven property definitions */
export const EVENT_PROPERTY_SCHEMAS = {
  'Viewed Product': {
    mandatory: [
      ...MANDATORY,
      { key: 'product_id', description: 'Product identifier', example: 'prod_123', source: 'catalog' },
      { key: 'product_name', description: 'Product name', example: 'Classic Tee', source: 'catalog' },
      { key: 'product_url', description: 'Product page URL', example: 'https://example.com/products/classic-tee', source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'categories', description: 'Product categories', source: 'catalog', catalogField: 'categories' },
      { key: 'brand', description: 'Brand', source: 'catalog', catalogField: 'brand' },
      { key: 'price', description: 'Price', source: 'catalog', catalogField: 'price' },
      { key: 'currency', description: 'Currency', source: 'catalog', catalogField: 'currency' },
      { key: 'image_url', description: 'Image URL', source: 'catalog', catalogField: 'imageUrl' },
    ],
    catalogItemType: 'product',
  },
  'Added to Cart': {
    mandatory: [
      ...MANDATORY,
      { key: 'product_id', description: 'Product identifier', example: 'prod_123', source: 'catalog' },
      { key: 'product_name', description: 'Product name', example: 'Classic Tee', source: 'catalog' },
      { key: 'quantity', description: 'Quantity added', example: 1, source: 'system' },
      { key: 'price', description: 'Unit price', example: 29.99, source: 'catalog' },
      { key: 'currency', description: 'Currency', example: 'USD', source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'categories', description: 'Product categories', source: 'catalog', catalogField: 'categories' },
      { key: 'brand', description: 'Brand', source: 'catalog', catalogField: 'brand' },
    ],
    catalogItemType: 'product',
  },
  'Started Checkout': {
    mandatory: [
      ...MANDATORY,
      { key: 'value', description: 'Cart/order value', example: 79.98, source: 'system' },
      { key: 'currency', description: 'Currency', example: 'USD', source: 'system' },
      { key: 'item_count', description: 'Number of items', example: 2, source: 'system' },
      { key: 'items', description: 'Cart/checkout line items (array with full product/variant data for Klaviyo)', example: [], source: 'catalog' },
      { key: 'brands', description: 'List of brand names from items', example: [], source: 'catalog' },
      { key: 'item_names', description: 'List of product/item names from order', example: [], source: 'catalog' },
      { key: 'categories', description: 'List of all categories from order', example: [], source: 'catalog' },
    ],
    catalogDriven: [],
    catalogItemType: null,
  },
  'Placed Order': {
    mandatory: [
      ...MANDATORY,
      { key: 'order_id', description: 'Order identifier', example: 'ord_001', source: 'system' },
      { key: 'value', description: 'Order total value', example: 79.98, source: 'system' },
      { key: 'value_currency', description: 'Currency', example: 'USD', source: 'system' },
      { key: 'items', description: 'Order line items (array with full product/variant data for Klaviyo)', example: [], source: 'catalog' },
      { key: 'brands', description: 'List of brand names from items', example: [], source: 'catalog' },
      { key: 'item_names', description: 'List of product/item names from order', example: [], source: 'catalog' },
      { key: 'categories', description: 'List of all categories from order', example: [], source: 'catalog' },
      { key: 'source', description: 'Purchase channel: online or instore', example: 'online', source: 'system' },
      { key: 'OrderType', description: 'One time, New subscription, or Recurring subscription', example: 'One time', source: 'system' },
    ],
    catalogDriven: [
      { key: 'location_id', description: 'Store/location ID (in-store only)', source: 'system' },
      { key: 'location_name', description: 'Store/location name (in-store only)', source: 'system' },
      { key: 'location_address', description: 'Store/location address (in-store only)', source: 'system' },
      { key: 'subscription_id', description: 'Subscription plan ID (when OrderType is New/Recurring subscription)', source: 'catalog' },
      { key: 'subscription_name', description: 'Subscription plan name (subscription orders)', source: 'catalog' },
      { key: 'subscription_started_at', description: 'When the subscription started (subscription orders)', source: 'system' },
      { key: 'next_payment_date', description: 'Next payment date YYYY-MM-DD (subscription orders)', source: 'system' },
      { key: 'subscription_interval', description: 'Subscription interval (subscription orders)', source: 'catalog' },
      { key: 'payment_interval', description: 'Payment interval (subscription orders)', source: 'catalog' },
    ],
    catalogItemType: null,
  },
  'Ordered Product': {
    mandatory: [
      ...MANDATORY,
      { key: 'order_id', description: 'Order identifier', example: 'ord_001', source: 'system' },
      { key: 'product_id', description: 'Product identifier', example: 'prod_123', source: 'catalog' },
      { key: 'product_name', description: 'Product name', example: 'Classic Tee', source: 'catalog' },
      { key: 'quantity', description: 'Quantity', example: 1, source: 'system' },
      { key: 'price', description: 'Unit price', example: 29.99, source: 'catalog' },
      { key: 'currency', description: 'Currency', example: 'USD', source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'categories', description: 'Product categories', source: 'catalog', catalogField: 'categories' },
      { key: 'brand', description: 'Brand', source: 'catalog', catalogField: 'brand' },
    ],
    catalogItemType: 'product',
  },
  'Fulfilled Order': {
    mandatory: [
      ...MANDATORY,
      { key: 'order_id', description: 'Order identifier', example: 'ord_001', source: 'system' },
      { key: 'items', description: 'Order line items (array with full product/variant data for Klaviyo)', example: [], source: 'catalog' },
      { key: 'brands', description: 'List of brand names from items', example: [], source: 'catalog' },
      { key: 'item_names', description: 'List of product/item names from order', example: [], source: 'catalog' },
      { key: 'categories', description: 'List of all categories from order', example: [], source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'location_id', description: 'Store/location ID (in-store only)', source: 'system' },
      { key: 'location_name', description: 'Store/location name (in-store only)', source: 'system' },
      { key: 'location_address', description: 'Store/location address (in-store only)', source: 'system' },
    ],
    catalogItemType: null,
  },
  'Cancelled Order': {
    mandatory: [
      ...MANDATORY,
      { key: 'order_id', description: 'Order identifier', example: 'ord_001', source: 'system' },
      { key: 'items', description: 'Order line items (array with full product/variant data for Klaviyo)', example: [], source: 'catalog' },
      { key: 'brands', description: 'List of brand names from items', example: [], source: 'catalog' },
      { key: 'item_names', description: 'List of product/item names from order', example: [], source: 'catalog' },
      { key: 'categories', description: 'List of all categories from order', example: [], source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'location_id', description: 'Store/location ID (in-store only)', source: 'system' },
      { key: 'location_name', description: 'Store/location name (in-store only)', source: 'system' },
      { key: 'location_address', description: 'Store/location address (in-store only)', source: 'system' },
    ],
    catalogItemType: null,
  },
  'Refunded Order': {
    mandatory: [
      ...MANDATORY,
      { key: 'order_id', description: 'Order identifier', example: 'ord_001', source: 'system' },
      { key: 'value', description: 'Refund amount', example: 79.98, source: 'system' },
      { key: 'value_currency', description: 'Currency', example: 'USD', source: 'system' },
      { key: 'items', description: 'Order line items (array with full product/variant data for Klaviyo)', example: [], source: 'catalog' },
      { key: 'brands', description: 'List of brand names from items', example: [], source: 'catalog' },
      { key: 'item_names', description: 'List of product/item names from order', example: [], source: 'catalog' },
      { key: 'categories', description: 'List of all categories from order', example: [], source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'location_id', description: 'Store/location ID (in-store only)', source: 'system' },
      { key: 'location_name', description: 'Store/location name (in-store only)', source: 'system' },
      { key: 'location_address', description: 'Store/location address (in-store only)', source: 'system' },
    ],
    catalogItemType: null,
  },
  'Subscription Started': {
    mandatory: [
      ...MANDATORY,
      { key: 'subscription_id', description: 'Subscription plan identifier', example: 'sub_123', source: 'catalog' },
      { key: 'subscription_name', description: 'Plan name', example: 'Pro Plan', source: 'catalog' },
      { key: 'price', description: 'Price', example: 49, source: 'catalog' },
      { key: 'currency', description: 'Currency', example: 'USD', source: 'catalog' },
      { key: 'subscription_interval', description: 'Subscription interval (weekly, monthly, yearly)', example: 'monthly', source: 'catalog' },
      { key: 'payment_interval', description: 'Payment interval (weekly, monthly, yearly)', example: 'monthly', source: 'catalog' },
      { key: 'subscription_started_at', description: 'When the subscription started (ISO 8601)', example: '2025-01-28T12:00:00.000Z', source: 'system' },
      { key: 'next_payment_date', description: 'Next payment/renewal date (YYYY-MM-DD)', example: '2025-02-28', source: 'system' },
    ],
    catalogDriven: [
      { key: 'categories', description: 'Subscription categories', source: 'catalog', catalogField: 'categories' },
    ],
    catalogItemType: 'subscription',
  },
  'Subscription Updated': {
    mandatory: [
      ...MANDATORY,
      { key: 'subscription_id', description: 'Subscription identifier', example: 'sub_123', source: 'catalog' },
    ],
    catalogDriven: [],
    catalogItemType: 'subscription',
  },
  'Subscription Cancelled': {
    mandatory: [
      ...MANDATORY,
      { key: 'subscription_id', description: 'Subscription identifier', example: 'sub_123', source: 'catalog' },
      { key: 'subscription_started_at', description: 'When the subscription started (ISO 8601)', example: '2025-01-28T12:00:00.000Z', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: 'subscription',
  },
  'Subscription Expiry Reminder': {
    mandatory: [
      ...MANDATORY,
      { key: 'subscription_id', description: 'Subscription identifier', example: 'sub_123', source: 'catalog' },
      { key: 'expires_at', description: 'Expiry date (YYYY-MM-DD, yearly plans)', example: '2025-02-28', source: 'system' },
      { key: 'subscription_started_at', description: 'When the subscription started (ISO 8601)', example: '2025-01-28T12:00:00.000Z', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: 'subscription',
  },
  'Subscription Expired': {
    mandatory: [
      ...MANDATORY,
      { key: 'subscription_id', description: 'Subscription identifier', example: 'sub_123', source: 'catalog' },
      { key: 'expires_at', description: 'Expiry date (YYYY-MM-DD, yearly plans)', example: '2025-02-28', source: 'system' },
      { key: 'subscription_started_at', description: 'When the subscription started (ISO 8601)', example: '2025-01-28T12:00:00.000Z', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: 'subscription',
  },
  'Subscription Renewed': {
    mandatory: [
      ...MANDATORY,
      { key: 'subscription_id', description: 'Subscription identifier', example: 'sub_123', source: 'catalog' },
      { key: 'subscription_name', description: 'Plan name', example: 'Pro Plan', source: 'catalog' },
      { key: 'price', description: 'Price', example: 49, source: 'catalog' },
      { key: 'currency', description: 'Currency', example: 'USD', source: 'catalog' },
      { key: 'subscription_started_at', description: 'When the subscription started (ISO 8601)', example: '2025-01-28T12:00:00.000Z', source: 'system' },
      { key: 'next_payment_date', description: 'Next payment/renewal date (YYYY-MM-DD)', example: '2025-02-28', source: 'system' },
    ],
    catalogDriven: [
      { key: 'expires_at', description: 'Period end date (yearly plans, optional)', example: '2025-02-28', source: 'system' },
    ],
    catalogItemType: 'subscription',
  },
  'Booking Created': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
      { key: 'service_id', description: 'Service identifier', example: 'svc_123', source: 'catalog' },
      { key: 'service_name', description: 'Service name', example: 'Dinner Reservation', source: 'catalog' },
      { key: 'price', description: 'Price', example: 0, source: 'catalog' },
      { key: 'currency', description: 'Currency', example: 'USD', source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'categories', description: 'Service categories', source: 'catalog', catalogField: 'categories' },
      { key: 'duration_minutes', description: 'Duration in minutes', source: 'catalog', catalogField: 'durationMinutes' },
    ],
    catalogItemType: 'service',
  },
  'Booking Updated': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
      { key: 'service_id', description: 'Service identifier', example: 'svc_123', source: 'catalog' },
    ],
    catalogDriven: [],
    catalogItemType: 'service',
  },
  'Booking Reminder': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
      { key: 'service_name', description: 'Service name', example: 'Dinner Reservation', source: 'catalog' },
      { key: 'booking_at', description: 'Scheduled time', example: '2025-01-30T19:00:00.000Z', source: 'system' },
      { key: 'booking_created_at', description: 'When the booking was created', example: '2025-01-27T10:00:00.000Z', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: 'service',
  },
  'Booking Cancelled': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: null,
  },
  'Booking Confirmed': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: 'service',
  },
  'Booking Checked in': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
      { key: 'location_id', description: 'Check-in location ID', example: 'loc_1', source: 'catalog' },
      { key: 'location_name', description: 'Check-in location name', example: 'Main Store', source: 'catalog' },
    ],
    catalogDriven: [
      { key: 'location_address', description: 'Check-in location address', source: 'catalog' },
    ],
    catalogItemType: null,
  },
  'Booking Attended': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: null,
  },
  'Booking Not Attended': {
    mandatory: [
      ...MANDATORY,
      { key: 'booking_id', description: 'Booking identifier', example: 'book_001', source: 'system' },
    ],
    catalogDriven: [],
    catalogItemType: null,
  },
}

/**
 * Get schema for an event (mandatory + catalog-driven). Returns null if event not defined.
 */
export function getEventPropertySchema(eventName) {
  return EVENT_PROPERTY_SCHEMAS[eventName] ?? null
}

/** Convert "Cabin Class" -> cabin_class */
function toSnakeCase(str) {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/([A-Z])/g, (_, c) => '_' + c.toLowerCase())
    .replace(/^_/, '')
}

/** Convert cabin_class -> "Cabin class" for matching option names */
function keyToOptionName(key) {
  if (typeof key !== 'string') return ''
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Flatten item.options (array of { name, values }) to top-level key-value on properties */
function flattenOptionsToProperties(item, properties) {
  if (!item?.options || !Array.isArray(item.options)) return
  for (const opt of item.options) {
    const key = toSnakeCase(opt.name)
    if (key && properties[key] === undefined && opt.values?.length) {
      properties[key] = opt.values[0]
    }
  }
}

/**
 * Build one item object with full product/variant data for Klaviyo (email loops).
 * Option-derived fields (size, color, etc.) are for catalog/UI only—omit from order payloads when includeOptions is false.
 * @param {object} product - Catalog product { id, name, price, currency, url, imageUrl, categories, brand, options, sku }
 * @param {number} [quantity=1]
 * @param {boolean} [includeOptions=false] - If false, do not add option-derived keys (use for order/checkout event payloads)
 * @returns {object}
 */
function buildKlaviyoItemFromProduct(product, quantity = 1, includeOptions = false) {
  if (!product) return {}
  const item = {
    product_id: product.id,
    product_name: product.name,
    product_url: product.url ?? '',
    sku: product.sku ?? product.id,
    image_url: product.imageUrl ?? '',
    price: product.price,
    quantity: Number(quantity) || 1,
    currency: product.currency ?? 'USD',
    categories: Array.isArray(product.categories) ? product.categories : (product.categories ? [product.categories] : []),
    brand: product.brand ?? '',
  }
  if (includeOptions && product?.options && Array.isArray(product.options)) {
    for (const opt of product.options) {
      const key = toSnakeCase(opt.name)
      if (key && opt.values?.length) item[key] = opt.values[0]
    }
  }
  return item
}

/**
 * Derive top-level brands, item_names, and categories lists from an items array (Klaviyo item shape).
 * @param {object[]} items - Array of { product_name, brand, categories }
 * @returns {{ brands: string[], item_names: string[], categories: string[] }}
 */
export function deriveOrderListsFromItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { brands: [], item_names: [], categories: [] }
  }
  const brands = [...new Set(items.map((i) => i.brand).filter(Boolean))]
  const item_names = items.map((i) => i.product_name ?? i.product_id ?? '')
  const categories = [...new Set(items.flatMap((i) => (Array.isArray(i.categories) ? i.categories : i.categories ? [i.categories] : [])))]
  return { brands, item_names, categories }
}

/** Build Klaviyo-style line item from a service (same shape as product for items array). */
function buildKlaviyoItemFromService(service, quantity = 1) {
  if (!service) return {}
  return {
    product_id: service.id,
    product_name: service.name,
    product_url: service.url ?? '',
    sku: service.sku ?? service.id,
    image_url: service.imageUrl ?? '',
    price: service.price ?? 0,
    quantity: Number(quantity) || 1,
    currency: service.currency ?? 'USD',
    categories: Array.isArray(service.categories) ? service.categories : (service.categories ? [service.categories] : []),
    brand: service.brand ?? '',
  }
}

/** Build Klaviyo-style line item from a subscription. */
function buildKlaviyoItemFromSubscription(sub, quantity = 1) {
  if (!sub) return {}
  return {
    product_id: sub.id,
    product_name: sub.name,
    product_url: sub.url ?? '',
    sku: sub.sku ?? sub.id,
    image_url: sub.imageUrl ?? '',
    price: sub.price ?? 0,
    quantity: Number(quantity) || 1,
    currency: sub.currency ?? 'USD',
    categories: Array.isArray(sub.categories) ? sub.categories : (sub.categories ? [sub.categories] : []),
    brand: sub.brand ?? '',
  }
}

/**
 * Build items array for order/checkout events from catalog (products, services, or subscriptions).
 * @param {object} catalog - { products, services, subscriptions }
 * @param {number} maxItems - max items to include (e.g. 3 for preview)
 * @param {'product'|'service'|'subscription'} [catalogKind] - which catalog type to use; inferred from catalog if omitted
 * @param {boolean} [includeOptions=false] - if true, add option-derived keys to product items (catalog/UI); use false for order payloads
 * @returns {object[]}
 */
export function buildItemsArrayFromCatalog(catalog, maxItems = 3, catalogKind, includeOptions = false) {
  const kind = catalogKind || (
    (catalog?.products?.length && 'product') ||
    (catalog?.services?.length && 'service') ||
    (catalog?.subscriptions?.length && 'subscription') ||
    'product'
  )
  let chosen = []
  if (kind === 'service' && catalog?.services?.length) {
    chosen = catalog.services.slice(0, Math.min(maxItems, catalog.services.length))
    return chosen.map((s) => buildKlaviyoItemFromService(s, 1))
  }
  if (kind === 'subscription' && catalog?.subscriptions?.length) {
    chosen = catalog.subscriptions.slice(0, Math.min(maxItems, catalog.subscriptions.length))
    return chosen.map((s) => buildKlaviyoItemFromSubscription(s, 1))
  }
  const products = catalog?.products || []
  const take = Math.min(maxItems, Math.max(1, products.length))
  chosen = products.length ? products.slice(0, take) : []
  if (chosen.length === 0) {
    return [{ product_id: 'prod_sample', product_name: 'Sample Product', product_url: '', sku: 'prod_sample', image_url: '', price: 29.99, quantity: 1, currency: 'USD', categories: [], brand: '' }]
  }
  return chosen.map((p) => buildKlaviyoItemFromProduct(p, 1, includeOptions))
}

const mergeByKey = (arr1, arr2) => {
  const seen = new Set()
  const out = []
  for (const p of [...(arr1 || []), ...(arr2 || [])]) {
    if (p && p.key && !seen.has(p.key)) {
      seen.add(p.key)
      out.push(p)
    }
  }
  return out
}

/**
 * Merge base event schema with business-type overrides and user customisations.
 * Order: code base → code business-type → stored customisations.
 * @param {string} eventName
 * @param {string} [businessTypeId] - From businessTypes.js (e.g. 'apparel', 'flight-tickets')
 * @returns {object | null} Merged schema { mandatory, catalogDriven, catalogItemType } or null
 */
export function getMergedEventPropertySchema(eventName, businessTypeId) {
  const base = getEventPropertySchema(eventName)
  if (!base) return null
  const codeOverrides = businessTypeId ? getEventPropertiesForBusinessType(businessTypeId, eventName) : null
  const customEntries = getCustomisationsForEvent(eventName, businessTypeId || null)
  const customSchema = customisationsToSchema(customEntries)

  return {
    mandatory: mergeByKey(mergeByKey(base.mandatory, codeOverrides?.mandatory), customSchema.mandatory),
    catalogDriven: mergeByKey(mergeByKey(base.catalogDriven, codeOverrides?.catalogDriven), customSchema.catalogDriven),
    catalogItemType: base.catalogItemType,
  }
}

/**
 * Get a single location for sample/preview: from context or first from catalog (or default).
 * @param {object} catalog - { locations?, ... }
 * @param {object} context - optional { locationId, locationName, locationAddress }
 * @returns {{ location_id: string, location_name: string, location_address: string }}
 */
function getLocationForPreview(catalog, context) {
  if (context.locationId != null || context.locationName != null) {
    return toEventLocation({
      location_id: context.locationId,
      location_name: context.locationName,
      location_address: context.locationAddress,
    })
  }
  const list = getLocationsList(catalog)
  return toEventLocation(list[0] ?? null)
}

/**
 * Build sample event properties for preview, using a catalog item when the event is catalog-driven.
 * When context.businessTypeId is set, merged schema (base + business-type overrides) is used.
 * @param {string} eventName
 * @param {object} catalog - { products, services, subscriptions, locations? }
 * @param {object} context - optional { orderId, value, currency, profileEmail, profileId, businessTypeId, catalogKind: 'product'|'service'|'subscription', locationId, locationName, locationAddress }
 * @returns {{ properties: object, schema: object | null }}
 */
export function buildSampleEventProperties(eventName, catalog, context = {}) {
  const businessTypeId = context.businessTypeId || null
  const schema = getMergedEventPropertySchema(eventName, businessTypeId)
  const nowMs = Date.now()
  const now = new Date(nowMs).toISOString()
  const DAY_MS = 24 * 60 * 60 * 1000
  const profileId = context.profileId ?? '01J001'
  const profileEmail = context.profileEmail ?? 'profile-001@klaviyo-dummy.com'

  const base = {
    metric_name: eventName + KD_METRIC_SUFFIX,
    time: now,
    profile_id: profileId,
    profile_email: profileEmail,
  }

  if (!schema) {
    return { properties: base, schema: null }
  }

  let item = null
  let itemKind = null
  if (context.catalogKind === 'service' && catalog?.services?.length) {
    item = catalog.services[0]
    itemKind = 'service'
  } else if (context.catalogKind === 'subscription' && catalog?.subscriptions?.length) {
    item = catalog.subscriptions[0]
    itemKind = 'subscription'
  } else if (context.catalogKind === 'product' && catalog?.products?.length) {
    item = catalog.products[0]
    itemKind = 'product'
  }
  if (item == null) {
    if (schema.catalogItemType === 'product' && catalog?.products?.length) {
      item = catalog.products[0]
      itemKind = 'product'
    } else if (schema.catalogItemType === 'service' && catalog?.services?.length) {
      item = catalog.services[0]
      itemKind = 'service'
    } else if (schema.catalogItemType === 'subscription' && catalog?.subscriptions?.length) {
      item = catalog.subscriptions[0]
      itemKind = 'subscription'
    }
  }
  const effectiveItemKind = itemKind || schema.catalogItemType
  const orderLevelEvents = ['Started Checkout', 'Placed Order', 'Fulfilled Order', 'Cancelled Order', 'Refunded Order']
  const isOrderLevelEvent = orderLevelEvents.includes(eventName)

  const properties = { ...base }

  if (!isOrderLevelEvent) {
    if (effectiveItemKind === 'product' && item) {
      properties.product_id = item.id
      properties.product_name = item.name
      properties.product_url = item.url ?? ''
      properties.price = item.price
      properties.currency = item.currency ?? 'USD'
      if (item.categories?.length) properties.categories = item.categories
      if (item.brand) properties.brand = item.brand
      if (item.imageUrl) properties.image_url = item.imageUrl
    }
    if (effectiveItemKind === 'service' && item) {
      properties.service_id = item.id
      properties.service_name = item.name
      properties.price = item.price ?? 0
      properties.currency = item.currency ?? 'USD'
      if (item.categories?.length) properties.categories = item.categories
      if (item.durationMinutes != null) properties.duration_minutes = item.durationMinutes
    }
    if (effectiveItemKind === 'subscription' && item) {
      properties.subscription_id = item.id
      properties.subscription_name = item.name
      properties.price = item.price
      properties.currency = item.currency ?? 'USD'
      const subInt = item.subscriptionInterval ?? item.subscriptionType ?? item.interval ?? 'monthly'
      const payInt = item.paymentInterval ?? item.subscriptionInterval ?? item.subscriptionType ?? item.interval ?? 'monthly'
      properties.subscription_interval = typeof subInt === 'string' ? subInt.toLowerCase() : 'monthly'
      properties.payment_interval = typeof payInt === 'string' ? payInt.toLowerCase() : 'monthly'
      if (item.categories?.length) properties.categories = item.categories
      const startedMs = nowMs - 30 * DAY_MS
      properties.subscription_started_at = new Date(startedMs).toISOString()
      if (eventName === 'Subscription Started') {
        properties.next_payment_date = new Date(startedMs + 30 * DAY_MS).toISOString().slice(0, 10)
      }
      if (eventName === 'Subscription Renewed') {
        properties.next_payment_date = new Date(startedMs + 60 * DAY_MS).toISOString().slice(0, 10)
      }
      if (['Subscription Expiry Reminder', 'Subscription Expired'].includes(eventName)) {
        properties.expires_at = new Date(startedMs + 365 * DAY_MS).toISOString().slice(0, 10)
      }
    }
    flattenOptionsToProperties(item, properties)
  }

  // Fill from merged catalogDriven (base + business-type) so industry-specific fields appear
  if (item && schema.catalogDriven?.length) {
    for (const entry of schema.catalogDriven) {
      if (entry.source === 'range') continue
      if (!entry.catalogField) continue
      if (entry.catalogField === 'options') {
        const optionName = keyToOptionName(entry.key)
        const opt = item.options?.find((o) => o?.name && String(o.name).toLowerCase() === optionName.toLowerCase())
        if (opt?.values?.length) properties[entry.key] = opt.values[0]
        continue
      }
      const val = item[entry.catalogField]
      if (val !== undefined && val !== null) properties[entry.key] = val
    }
  }
  // Fill range-driven properties (e.g. party_size) from eventPropertyRanges.js when not in catalog
  const allKeys = [
    ...(schema.mandatory || []).map((e) => e.key),
    ...(schema.catalogDriven || []).map((e) => e.key),
  ]
  for (const key of allKeys) {
    if (properties[key] !== undefined) continue
    const range = getPropertyRange(eventName, key, businessTypeId || undefined)
    if (range) {
      const val = pickValueFromRange(range)
      if (val !== null) properties[key] = val
    }
  }
  // Fill business-type mandatory that have example when catalog item doesn't have the field (e.g. flight_number)
  if (schema.mandatory?.length) {
    for (const entry of schema.mandatory) {
      if (entry.example !== undefined && properties[entry.key] === undefined) {
        if (entry.source === 'catalog' && entry.catalogField && item && item[entry.catalogField] !== undefined) {
          properties[entry.key] = item[entry.catalogField]
        } else {
          properties[entry.key] = entry.example
        }
      }
    }
  }

  if (eventName === 'Added to Cart' && item) {
    properties.quantity = 1
  }
  const itemsArray = buildItemsArrayFromCatalog(catalog, 3, context.catalogKind || effectiveItemKind, isOrderLevelEvent ? false : undefined)
  const cartValue = itemsArray.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)

  const orderLists = deriveOrderListsFromItems(itemsArray)
  if (eventName === 'Started Checkout') {
    properties.value = cartValue
    properties.currency = itemsArray[0]?.currency ?? 'USD'
    properties.item_count = itemsArray.length
    properties.items = itemsArray
    properties.brands = orderLists.brands
    properties.item_names = orderLists.item_names
    properties.categories = orderLists.categories
  }
  if (eventName === 'Placed Order') {
    properties.order_id = context.orderId ?? 'ord_001'
    properties.value = context.value ?? cartValue
    properties.value_currency = context.valueCurrency ?? itemsArray[0]?.currency ?? 'USD'
    properties.items = itemsArray
    properties.brands = orderLists.brands
    properties.item_names = orderLists.item_names
    properties.categories = orderLists.categories
    properties.source = context.orderSource ?? 'online'
    properties.OrderType = context.orderType ?? 'One time'
    if (context.orderSource === 'instore') {
      const loc = getLocationForPreview(catalog, context)
      properties.location_id = loc.location_id
      properties.location_name = loc.location_name
      properties.location_address = loc.location_address
    }
    if ((context.orderType === 'New subscription' || context.orderType === 'Recurring subscription' || context.catalogKind === 'subscription') && (item || catalog?.subscriptions?.length)) {
      const sub = item && itemKind === 'subscription' ? item : catalog.subscriptions[0]
      if (sub) {
        properties.subscription_id = sub.id
        properties.subscription_name = sub.name
        const startedMs = nowMs - 30 * DAY_MS
        properties.subscription_started_at = new Date(startedMs).toISOString()
        properties.next_payment_date = new Date(startedMs + 30 * DAY_MS).toISOString().slice(0, 10)
        const subInt = sub.subscriptionInterval ?? sub.subscriptionType ?? sub.interval ?? 'monthly'
        const payInt = sub.paymentInterval ?? sub.subscriptionInterval ?? sub.subscriptionType ?? sub.interval ?? 'monthly'
        properties.subscription_interval = typeof subInt === 'string' ? subInt.toLowerCase() : 'monthly'
        properties.payment_interval = typeof payInt === 'string' ? payInt.toLowerCase() : 'monthly'
      }
    }
  }
  if (eventName === 'Ordered Product' && item) {
    properties.order_id = context.orderId ?? 'ord_001'
    if (effectiveItemKind === 'service') {
      properties.service_id = item.id
      properties.service_name = item.name
    } else {
      properties.product_id = item.id
      properties.product_name = item.name
      if (item.url) properties.product_url = item.url
      if (item.imageUrl) properties.image_url = item.imageUrl
      if (item.brand) properties.brand = item.brand
      flattenOptionsToProperties(item, properties)
    }
    properties.quantity = 1
    properties.price = item.price ?? 0
    properties.currency = item.currency ?? 'USD'
    if (item.categories?.length) properties.categories = item.categories
  }
  if (['Fulfilled Order', 'Cancelled Order'].includes(eventName)) {
    properties.order_id = context.orderId ?? 'ord_001'
    properties.items = itemsArray
    properties.brands = orderLists.brands
    properties.item_names = orderLists.item_names
    properties.categories = orderLists.categories
    if (context.orderSource === 'instore') {
      const loc = getLocationForPreview(catalog, context)
      properties.location_id = loc.location_id
      properties.location_name = loc.location_name
      properties.location_address = loc.location_address
    }
  }
  if (eventName === 'Refunded Order') {
    properties.order_id = context.orderId ?? 'ord_001'
    properties.value = context.value ?? cartValue
    properties.value_currency = context.valueCurrency ?? 'USD'
    properties.items = itemsArray
    properties.brands = orderLists.brands
    properties.item_names = orderLists.item_names
    properties.categories = orderLists.categories
    if (context.orderSource === 'instore') {
      const loc = getLocationForPreview(catalog, context)
      properties.location_id = loc.location_id
      properties.location_name = loc.location_name
      properties.location_address = loc.location_address
    }
  }
  if (['Booking Created', 'Booking Reminder', 'Booking Confirmed', 'Booking Checked in', 'Booking Attended', 'Booking Not Attended', 'Booking Cancelled', 'Booking Updated'].includes(eventName)) {
    if (item) {
      properties.service_id = item.id
      properties.service_name = item.name
      properties.price = item.price ?? 0
      properties.currency = item.currency ?? 'USD'
    }
    properties.booking_id = 'book_001'
    // Booking date vs date range, driven by service.bookingDateType
    const bookingTypeRaw =
      item && typeof item.bookingDateType === 'string'
        ? item.bookingDateType.toLowerCase()
        : 'single date'
    const isDateRange =
      bookingTypeRaw === 'date range' || bookingTypeRaw === 'date_range'

    // For preview: model booking_created_at and booking_at/booking_from/to with the same
    // semantics as generateEvents/journeyTimings:
    // - booking_created_at: when the booking was created
    // - booking_at or booking_from/to: when the session happens
    // Here we treat the session as "now" and the create date as a fixed number of days before.
    const bookingAtDaysFromCreate = 3
    const createdMs = nowMs - bookingAtDaysFromCreate * DAY_MS
    const sessionMs = createdMs + bookingAtDaysFromCreate * DAY_MS

    if (isDateRange) {
      const minDays = item && (Number(item.dateRangeMinDays) > 0 || Number(item.dateRangeMaxDays) > 0)
        ? Math.max(0, Number(item.dateRangeMinDays) || 0)
        : 1
      const maxDays = item && (Number(item.dateRangeMinDays) > 0 || Number(item.dateRangeMaxDays) > 0)
        ? Math.max(minDays, Number(item.dateRangeMaxDays) || 0)
        : 3
      const lengthDays = minDays === maxDays ? minDays : Math.round((minDays + maxDays) / 2)
      const from = new Date(sessionMs).toISOString()
      const to = new Date(sessionMs + lengthDays * DAY_MS).toISOString()
      properties.booking_from = from
      properties.booking_to = to
    } else {
      properties.booking_at = new Date(sessionMs).toISOString()
    }

    // booking_created_at = when the booking was created (session - bookingAtDaysFromCreate)
    const bookingCreatedAt = new Date(createdMs).toISOString()
    properties.booking_created_at = bookingCreatedAt

    // Event time semantics for preview, mirroring booking_spaced:
    // - Booking Created / Updated / Cancelled: at booking_created_at
    // - Reminder: 2 days before session
    // - Confirmed: 1 day before session
    // - Checked in / Attended: at session
    // - Not Attended: after session
    let bookingEventTimeMs = createdMs
    if (eventName === 'Booking Reminder') {
      bookingEventTimeMs = sessionMs - 2 * DAY_MS
    } else if (eventName === 'Booking Confirmed') {
      bookingEventTimeMs = sessionMs - 1 * DAY_MS
    } else if (eventName === 'Booking Checked in' || eventName === 'Booking Attended') {
      bookingEventTimeMs = sessionMs
    } else if (eventName === 'Booking Not Attended') {
      bookingEventTimeMs = sessionMs + 1 * DAY_MS
    }
    properties.time = new Date(bookingEventTimeMs).toISOString()

    if (item && Array.isArray(item.bookingType) && item.bookingType.length > 0) {
      properties.booking_type = item.bookingType[0]
    }
    if (['Booking Checked in', 'Booking Attended', 'Booking Created'].includes(eventName)) {
      const loc = getLocationForPreview(catalog, context)
      properties.location_id = loc.location_id
      properties.location_name = loc.location_name
      properties.location_address = loc.location_address
    }
  }
  if (eventName === 'Subscription Expiry Reminder') {
    properties.subscription_id = item?.id ?? 'sub_123'
  }

  return { properties, schema }
}
