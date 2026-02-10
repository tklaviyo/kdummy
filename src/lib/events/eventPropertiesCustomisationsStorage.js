/**
 * User customisations for event properties (on top of code-defined defaults).
 * Stored in localStorage. Merge order: code base → code business-type → stored customisations.
 */

const STORAGE_KEY = 'kdummy_event_properties_customisations'

/** @typedef {{ id: string, eventName: string, businessTypeId: string | null, type: 'mandatory'|'catalogDriven', key: string, description: string, example?: any, catalogField?: string }} CustomisationEntry */

function safeParse(json, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function getEventPropertyCustomisations() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return safeParse(raw, [])
}

export function setEventPropertyCustomisations(entries) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(entries) ? entries : []))
}

export function addEventPropertyCustomisation(entry) {
  const entries = getEventPropertyCustomisations()
  const id = entry.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  entries.push({ ...entry, id })
  setEventPropertyCustomisations(entries)
  return id
}

export function removeEventPropertyCustomisation(id) {
  const entries = getEventPropertyCustomisations().filter((e) => e.id !== id)
  setEventPropertyCustomisations(entries)
}

export function updateEventPropertyCustomisation(id, updates) {
  const entries = getEventPropertyCustomisations()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return
  entries[idx] = { ...entries[idx], ...updates }
  setEventPropertyCustomisations(entries)
}

/**
 * Get customisations that apply for a given event and optional business type.
 * Returns entries where eventName matches and (businessTypeId is null or matches).
 * Order: base (businessTypeId null) first, then business-type-specific.
 */
export function getCustomisationsForEvent(eventName, businessTypeId) {
  const all = getEventPropertyCustomisations()
  return all.filter(
    (c) =>
      c.eventName === eventName &&
      (c.businessTypeId === null || c.businessTypeId === undefined || c.businessTypeId === businessTypeId)
  )
}

/**
 * Convert customisation entries to { mandatory, catalogDriven } for merge.
 */
export function customisationsToSchema(entries) {
  const mandatory = entries.filter((c) => c.type === 'mandatory').map((c) => ({ key: c.key, description: c.description, example: c.example, source: 'custom', catalogField: c.catalogField }))
  const catalogDriven = entries.filter((c) => c.type === 'catalogDriven').map((c) => ({ key: c.key, description: c.description, source: 'custom', catalogField: c.catalogField }))
  return { mandatory, catalogDriven }
}
