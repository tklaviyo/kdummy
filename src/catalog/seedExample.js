/**
 * Seed example catalog items for events generation (products, services, subscriptions).
 * Uses localStorage via storage. Safe to call multiple times (upserts by id).
 */

import { upsertCatalogItem } from './storage.js'

const EXAMPLE_PRODUCTS = [
  { name: 'Example T-Shirt', price: 29.99, currency: 'USD' },
  { name: 'Example Coffee Mug', price: 14.99, currency: 'USD' },
  { name: 'Example Notebook', price: 9.99, currency: 'USD' },
]

const EXAMPLE_SERVICES = [
  { name: 'Example Consultation', price: 99, currency: 'USD', durationMinutes: 60 },
  { name: 'Example Workshop', price: 149, currency: 'USD', durationMinutes: 120 },
]

const EXAMPLE_SUBSCRIPTIONS = [
  { name: 'Example Monthly Plan', price: 19.99, currency: 'USD', interval: 'month', intervalCount: 1 },
  { name: 'Example Annual Plan', price: 199, currency: 'USD', interval: 'year', intervalCount: 1 },
]

/**
 * Seed a minimal set of products, services, and subscriptions into catalog storage.
 * Only runs in browser. Idempotent (upserts by id).
 * @returns {{ products: number, services: number, subscriptions: number }}
 */
export function seedExampleCatalog() {
  if (typeof window === 'undefined') return { products: 0, services: 0, subscriptions: 0 }
  let products = 0,
    services = 0,
    subscriptions = 0

  EXAMPLE_PRODUCTS.forEach((p, i) => {
    const id = `seed-prod-${i + 1}`
    upsertCatalogItem('product', { id, ...p })
    products++
  })

  EXAMPLE_SERVICES.forEach((s, i) => {
    const id = `seed-serv-${i + 1}`
    upsertCatalogItem('service', { id, ...s })
    services++
  })

  EXAMPLE_SUBSCRIPTIONS.forEach((s, i) => {
    const id = `seed-sub-${i + 1}`
    upsertCatalogItem('subscription', { id, ...s })
    subscriptions++
  })

  return { products, services, subscriptions }
}
