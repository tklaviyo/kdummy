/**
 * Catalog system — source of truth and public API.
 * Exactly THREE templates: Product, Service, Subscription.
 */

export {
  templates,
  getTemplate,
  getOrderedFields,
  getStoredKeys,
  createEmptyItem,
  TEMPLATE_TYPES,
} from './schemas/index.js'

export { CatalogForm } from './formRenderer.jsx'
export { getCatalogItems, setCatalogItems, addCatalogItem, addCatalogItems, updateCatalogItem, deleteCatalogItem, deleteCatalogItems, getCatalogItemById, buildItemForSave } from './storage.js'
export { catalogPresets, getPresetById, getPresetsByTemplate } from './presets.js'
export {
  EVENT_CATALOG,
  JOURNEYS,
  EVENT_CATEGORIES,
  getEventById,
  getEventsByCategory,
  getJourneyById,
  getJourneysByOffering,
  getEventsForJourney,
} from './eventCatalog.js'
