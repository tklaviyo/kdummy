/**
 * Data Catalog — schema (single source of truth).
 * Exactly THREE templates: Product, Service, Subscription.
 * Field order and conditionals only. No industry-specific fields.
 */

const GENDER_ENUM = ['women', 'men', 'unisex', 'kids']
const SUBSCRIPTION_INTERVAL_ENUM = ['weekly', 'monthly', 'yearly']
const productTemplate = {
  key: 'product',
  label: 'Products',
  fields: [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'id', label: 'ID', type: 'string', required: true, placeholder: 'e.g. PROD-001' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'categories', label: 'Categories', type: 'stringArray', required: false, help: 'Comma-separated or array' },
    { key: 'brand', label: 'Brand', type: 'string', required: false, placeholder: 'e.g. Acme' },
    { key: 'url', label: 'URL', type: 'string', required: false },
    { key: 'imageUrl', label: 'Image URL', type: 'string', required: false },
    { key: 'hasOptions', label: 'Has variants', type: 'boolean', required: false, help: 'Product has options like Size or Color; each combination is a variant.' },
    {
      key: 'options',
      label: 'Variant options (name + values)',
      type: 'optionsArray',
      required: false,
      when: { dependsOn: 'hasOptions', equals: true },
    },
    {
      key: 'variantPreview',
      label: 'Variant preview',
      type: 'variantPreview',
      required: false,
      when: { dependsOn: 'hasOptions', equals: true },
    },
  ],
}

const serviceTemplate = {
  key: 'service',
  label: 'Services',
  fields: [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'id', label: 'ID', type: 'string', required: true, placeholder: 'e.g. SERV-001' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'categories', label: 'Categories', type: 'stringArray', required: false },
    { key: 'url', label: 'URL', type: 'string', required: false },
    { key: 'imageUrl', label: 'Image URL', type: 'string', required: false },
    {
      key: 'bookingDateType',
      label: 'Booking date type',
      type: 'enum',
      required: false,
      enumValues: ['single date', 'date range'],
      help: 'Choose whether this booking uses a single date/time or a from–to date range.',
    },
    {
      key: 'dateRangeMinDays',
      label: 'Date range min (days)',
      type: 'number',
      required: false,
      when: { dependsOn: 'bookingDateType', equals: 'date range' },
      help: 'Minimum length of the booking range in days (e.g. 1 for one night).',
    },
    {
      key: 'dateRangeMaxDays',
      label: 'Date range max (days)',
      type: 'number',
      required: false,
      when: { dependsOn: 'bookingDateType', equals: 'date range' },
      help: 'Maximum length of the booking range in days (e.g. 5 for up to five nights).',
    },
    {
      key: 'bookingType',
      label: 'Booking Type',
      type: 'stringArray',
      required: false,
      help: 'Optional booking types (e.g. initial, follow-up); one is picked at random for each event.',
    },
  ],
}

const subscriptionTemplate = {
  key: 'subscription',
  label: 'Subscriptions',
  fields: [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'id', label: 'ID', type: 'string', required: true, placeholder: 'e.g. SUB-001' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'categories', label: 'Categories', type: 'stringArray', required: false },
    { key: 'url', label: 'URL', type: 'string', required: false },
    { key: 'imageUrl', label: 'Image URL', type: 'string', required: false },
    {
      key: 'subscriptionInterval',
      label: 'Subscription Interval',
      type: 'enum',
      required: true,
      enumValues: SUBSCRIPTION_INTERVAL_ENUM,
      help: 'How often the subscription term renews (Subscription Started, Renewed, Expiry Reminder, Expired).',
    },
    {
      key: 'paymentInterval',
      label: 'Payment Interval',
      type: 'enum',
      required: true,
      enumValues: SUBSCRIPTION_INTERVAL_ENUM,
      help: 'How often the customer is charged (Placed Order cadence).',
    },
  ],
}

export const CATALOG_TEMPLATES = {
  product: productTemplate,
  service: serviceTemplate,
  subscription: subscriptionTemplate,
}

export const TEMPLATE_KEYS = Object.keys(CATALOG_TEMPLATES)

/**
 * @param {string} key - Template key ('product' | 'service' | 'subscription')
 * @returns {object} Template definition
 */
export function getTemplate(key) {
  const template = CATALOG_TEMPLATES[key]
  if (!template) {
    throw new Error(`Unknown template: ${key}. Must be one of ${TEMPLATE_KEYS.join(', ')}.`)
  }
  return template
}

/**
 * Fields in render order, excluding pseudo-fields that are not stored (e.g. variantPreview).
 * @param {object} template - Template from getTemplate()
 * @param {boolean} includePreviewOnly - If true, include variantPreview etc.
 * @returns {Array<object>}
 */
export function getOrderedFields(template, includePreviewOnly = false) {
  if (!template || !template.fields) return []
  if (includePreviewOnly) return template.fields
  return template.fields.filter((f) => f.type !== 'variantPreview')
}

/**
 * Keys that are persisted (exclude variantPreview and optional preview-only keys).
 * @param {object} template
 * @returns {string[]}
 */
export function getStoredKeys(template) {
  return getOrderedFields(template, false)
    .filter((f) => f.type !== 'variantPreview')
    .map((f) => f.key)
}

/**
 * Default value for a field definition.
 * @param {object} field - Field from template.fields
 * @returns {string|number|boolean|string[]|object[]}
 */
export function getDefaultValue(field) {
  if (field.type === 'boolean') return false
  if (field.type === 'number') return 0
  if (field.type === 'stringArray' || field.type === 'categories') return []
  if (field.type === 'optionsArray') return []
  if (field.type === 'enum' && field.enumValues && field.enumValues.length) return field.enumValues[0]
  return ''
}

/**
 * Create an empty item for a template (all fields + toggles with defaults).
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @returns {object} Item with _template and default values
 */
export function createEmptyItem(templateKey) {
  const template = getTemplate(templateKey)
  const item = { _template: templateKey }
  const fields = getOrderedFields(template, true).filter((f) => f.type !== 'variantPreview')
  fields.forEach((f) => {
    item[f.key] = getDefaultValue(f)
  })
  return item
}
