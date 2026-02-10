/**
 * Data Catalog — storage (localStorage).
 * Three collections: catalog_product, catalog_service, catalog_subscription.
 * No external dependencies.
 */

const TEMPLATE_KEYS = ['product', 'service', 'subscription']

function getStorageKey(templateKey) {
  if (!TEMPLATE_KEYS.includes(templateKey)) {
    throw new Error(`Invalid templateKey: ${templateKey}. Must be one of ${TEMPLATE_KEYS.join(', ')}.`)
  }
  return `catalog_${templateKey}`
}

function safeParse(jsonString, fallback) {
  if (jsonString == null || jsonString === '') return fallback
  try {
    const parsed = JSON.parse(jsonString)
    return Array.isArray(parsed) ? parsed : fallback
  } catch (_) {
    return fallback
  }
}

/**
 * Load items for a template from localStorage.
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @returns {object[]} Array of items (empty on error or SSR)
 */
export function loadCatalog(templateKey) {
  if (typeof window === 'undefined') return []
  const key = getStorageKey(templateKey)
  const raw = window.localStorage.getItem(key)
  return safeParse(raw, [])
}

/**
 * Load all catalog items from every type. Each item has _type set to its template key.
 * @returns {{ _type: string, ... }[]} Array of items with _type: 'product' | 'service' | 'subscription'
 */
export function loadAllCatalog() {
  if (typeof window === 'undefined') return []
  const result = []
  for (const key of TEMPLATE_KEYS) {
    const items = loadCatalog(key)
    items.forEach((item) => result.push({ ...item, _type: key }))
  }
  return result
}

/**
 * Save items for a template to localStorage.
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @param {object[]} items - Array of items
 */
export function saveCatalog(templateKey, items) {
  if (typeof window === 'undefined') return
  const key = getStorageKey(templateKey)
  const array = Array.isArray(items) ? items : []
  window.localStorage.setItem(key, JSON.stringify(array))
}

/**
 * Insert or update an item by id. Returns the upserted item.
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @param {object} item - Item with at least id
 * @returns {object} The upserted item
 */
export function upsertCatalogItem(templateKey, item) {
  if (typeof window === 'undefined') return item
  const key = getStorageKey(templateKey)
  const id = item && item.id
  if (id == null || id === '') {
    throw new Error('Item must have an id to upsert.')
  }
  const items = safeParse(window.localStorage.getItem(key), [])
  const index = items.findIndex((i) => i.id === id)
  const next = { ...item }
  if (index >= 0) {
    items[index] = next
  } else {
    items.push(next)
  }
  window.localStorage.setItem(key, JSON.stringify(items))
  return next
}

/**
 * Delete an item by id.
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @param {string} id - Item id
 */
export function deleteCatalogItem(templateKey, id) {
  if (typeof window === 'undefined') return
  const key = getStorageKey(templateKey)
  const items = safeParse(window.localStorage.getItem(key), [])
  const next = items.filter((i) => i.id !== id)
  window.localStorage.setItem(key, JSON.stringify(next))
}
