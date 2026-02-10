/**
 * Catalog templates — exactly THREE: Product, Service, Subscription.
 * Single source of truth for schema and field order.
 */

import { productTemplate } from './product.js'
import { serviceTemplate } from './service.js'
import { subscriptionTemplate } from './subscription.js'

export const TEMPLATE_TYPES = ['product', 'service', 'subscription']

export const templates = {
  product: productTemplate,
  service: serviceTemplate,
  subscription: subscriptionTemplate,
}

export function getTemplate(type) {
  const t = templates[type]
  if (!t) throw new Error(`Unknown template type: ${type}. Must be one of ${TEMPLATE_TYPES.join(', ')}.`)
  return t
}

export function getOrderedFields(template) {
  const mandatory = template.mandatoryFields || []
  const additional = template.additionalRequired || []
  const conditional = (template.conditionalFields || []).flatMap((c) => c.fields)
  return [...mandatory, ...additional, ...conditional]
}

export function getStoredKeys(template) {
  const ordered = getOrderedFields(template)
  return ordered.filter((f) => !f.previewOnly).map((f) => f.key)
}

export function getDefaultValue(field) {
  if (field.default !== undefined) return field.default
  switch (field.type) {
    case 'string':
    case 'url':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'stringArray':
      return []
    case 'optionsArray':
      return []
    case 'enum':
      return field.enum?.[0] ?? ''
    default:
      return ''
  }
}

export function createEmptyItem(templateType) {
  const template = getTemplate(templateType)
  const item = { _template: templateType }
  const allFields = [
    ...(template.mandatoryFields || []),
    ...(template.additionalRequired || []),
    ...(template.conditionalFields || []).flatMap((c) => c.fields),
  ]
  allFields.forEach((f) => {
    if (!f.previewOnly) item[f.key] = getDefaultValue(f)
  })
  template.toggles?.forEach((t) => {
    item[t.key] = false
  })
  return item
}

export { productTemplate, serviceTemplate, subscriptionTemplate }
