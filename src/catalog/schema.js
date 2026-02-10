/**
 * Data Catalog — schema (single source of truth).
 * Exactly THREE templates: Product, Service, Subscription.
 * Field order and conditionals only. No industry-specific fields.
 */

const CURRENCY_ENUM = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
const GENDER_ENUM = ['women', 'men', 'unisex', 'kids']
const INTERVAL_ENUM = ['week', 'month', 'year']
const productTemplate = {
  key: 'product',
  label: 'Products',
  fields: [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'id', label: 'ID', type: 'string', required: true, placeholder: 'e.g. PROD-001' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'currency', label: 'Currency', type: 'enum', required: true, enumValues: CURRENCY_ENUM },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'categories', label: 'Categories', type: 'stringArray', required: false, help: 'Comma-separated or array' },
    { key: 'brand', label: 'Brand', type: 'string', required: false, placeholder: 'e.g. Acme' },
    { key: 'url', label: 'URL', type: 'string', required: false },
    { key: 'imageUrl', label: 'Image URL', type: 'string', required: false },
    { key: 'isBundle', label: 'Is bundle', type: 'boolean', required: false, help: 'Product is a bundle of other items (e.g. gift set).' },
    {
      key: 'bundleItems',
      label: 'Bundle items',
      type: 'stringArray',
      required: false,
      help: 'Type item names and press Enter to add.',
      when: { dependsOn: 'isBundle', equals: true },
    },
    { key: 'isDigital', label: 'Is digital', type: 'boolean', required: false, help: 'Product is digital (e.g. download, license).' },
    { key: 'hasGender', label: 'Has gender', type: 'boolean', required: false, help: 'Product is gendered (e.g. women’s, men’s).' },
    {
      key: 'gender',
      label: 'Gender',
      type: 'enum',
      required: false,
      enumValues: GENDER_ENUM,
      when: { dependsOn: 'hasGender', equals: true },
    },
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
    { key: 'currency', label: 'Currency', type: 'enum', required: true, enumValues: CURRENCY_ENUM },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'categories', label: 'Categories', type: 'stringArray', required: false },
    { key: 'url', label: 'URL', type: 'string', required: false },
    { key: 'imageUrl', label: 'Image URL', type: 'string', required: false },
    { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number', required: true },
  ],
}

const subscriptionTemplate = {
  key: 'subscription',
  label: 'Subscriptions',
  fields: [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'id', label: 'ID', type: 'string', required: true, placeholder: 'e.g. SUB-001' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'currency', label: 'Currency', type: 'enum', required: true, enumValues: CURRENCY_ENUM },
    { key: 'description', label: 'Description', type: 'string', required: false },
    { key: 'categories', label: 'Categories', type: 'stringArray', required: false },
    { key: 'url', label: 'URL', type: 'string', required: false },
    { key: 'imageUrl', label: 'Image URL', type: 'string', required: false },
    { key: 'interval', label: 'Interval', type: 'enum', required: true, enumValues: INTERVAL_ENUM },
    { key: 'intervalCount', label: 'Interval count', type: 'number', required: true },
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
