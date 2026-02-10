/**
 * Data Catalog — validators.
 * Validates catalog items against schema (required fields, types, conditionals).
 */

import {
  CATALOG_TEMPLATES,
  getTemplate as getSchemaTemplate,
  getOrderedFields,
} from './schema.js'

export { getTemplate } from './schema.js'

/**
 * Get field definitions that are visible given current values (applies `when`).
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @param {object} currentValues - Current item or form values (e.g. { hasOptions: true })
 * @returns {object[]} Field definitions in order that should be shown
 */
export function getVisibleFields(templateKey, currentValues) {
  const template = getSchemaTemplate(templateKey)
  if (!template || !template.fields) return []
  const values = currentValues || {}
  return template.fields.filter((field) => {
    if (!field.when) return true
    const { dependsOn, equals } = field.when
    if (dependsOn == null) return true
    return values[dependsOn] === equals
  })
}

/**
 * Allowed keys for an item: schema field keys + _template, schemaVersion.
 * @param {string} templateKey
 * @returns {Set<string>}
 */
function getAllowedKeys(templateKey) {
  const template = getSchemaTemplate(templateKey)
  const fields = getOrderedFields(template, true)
  const keys = new Set(['_template', 'schemaVersion'])
  fields.forEach((f) => keys.add(f.key))
  return keys
}

/**
 * Check required: field present and non-empty.
 * @param {object} field - Field def
 * @param {*} value - Item value
 * @returns {string|null} Error message or null
 */
function checkRequired(field, value) {
  if (!field.required) return null
  if (value === undefined || value === null) return `${field.label || field.key} is required`
  if (field.type === 'string' && typeof value === 'string' && value.trim() === '') return `${field.label || field.key} is required`
  if (field.type === 'stringArray' && Array.isArray(value) && value.length === 0) return `${field.label || field.key} is required`
  if (field.type === 'optionsArray' && Array.isArray(value) && value.length === 0) return `${field.label || field.key} is required`
  return null
}

/**
 * Check type matches.
 * @param {object} field - Field def
 * @param {*} value - Item value
 * @returns {string|null} Error message or null
 */
function checkType(field, value) {
  if (value === undefined || value === null) return null
  const { key, type, label, enumValues } = field
  const name = label || key
  switch (type) {
    case 'string':
      if (typeof value !== 'string') return `${name} must be a string`
      break
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) return `${name} must be a number`
      break
    case 'boolean':
      if (typeof value !== 'boolean') return `${name} must be true or false`
      break
    case 'enum':
      if (!Array.isArray(enumValues) || !enumValues.includes(value)) return `${name} must be one of: ${(enumValues || []).join(', ')}`
      break
    case 'stringArray':
      if (!Array.isArray(value)) return `${name} must be an array`
      if (value.some((v) => typeof v !== 'string')) return `${name} must be an array of strings`
      break
    case 'optionsArray':
      if (!Array.isArray(value)) return `${name} must be an array of options`
      for (let i = 0; i < value.length; i++) {
        const opt = value[i]
        if (!opt || typeof opt !== 'object') return `${name}: option ${i + 1} must be an object with name and values`
        if (typeof opt.name !== 'string') return `${name}: option ${i + 1} must have a string name`
        if (!Array.isArray(opt.values)) return `${name}: option ${i + 1} must have values array`
        if (opt.values.length < 1) return `${name}: option ${i + 1} must have at least one value`
        if (opt.values.some((v) => typeof v !== 'string')) return `${name}: option ${i + 1} values must be strings`
      }
      break
    case 'variantPreview':
    case 'variantCount':
      break
    default:
      break
  }
  return null
}

/**
 * Validate a catalog item against its template.
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @param {object} item - Item to validate
 * @returns {{ ok: boolean, errors: Array<{ field: string, message: string }> }}
 */
export function validateItem(templateKey, item) {
  const errors = []
  if (!item || typeof item !== 'object') {
    return { ok: false, errors: [{ field: '_', message: 'Item must be an object' }] }
  }

  const template = getSchemaTemplate(templateKey)
  const allowedKeys = getAllowedKeys(templateKey)
  const visibleFields = getVisibleFields(templateKey, item)

  // Unknown keys (except _template, schemaVersion)
  Object.keys(item).forEach((key) => {
    if (!allowedKeys.has(key)) {
      errors.push({ field: key, message: `Unknown field: ${key}` })
    }
  })

  // Required and type checks for visible fields
  visibleFields.forEach((field) => {
    if (field.type === 'variantPreview') return
    const value = item[field.key]
    const errRequired = checkRequired(field, value)
    if (errRequired) {
      errors.push({ field: field.key, message: errRequired })
      return
    }
    const errType = checkType(field, value)
    if (errType) errors.push({ field: field.key, message: errType })
  })

  // Product conditionals
  if (templateKey === 'product') {
    if (item.hasGender === true) {
      if (item.gender === undefined || item.gender === null || item.gender === '') {
        errors.push({ field: 'gender', message: 'Gender is required when Has gender is on' })
      }
    }
    if (item.isBundle === true) {
      if (!Array.isArray(item.bundleItems) || item.bundleItems.length < 1) {
        errors.push({ field: 'bundleItems', message: 'Bundle items are required (at least one) when Is bundle is on' })
      }
    }
    if (item.hasOptions === true) {
      if (!Array.isArray(item.options) || item.options.length < 1) {
        errors.push({ field: 'options', message: 'At least one option (name + values) is required when Has options is on' })
      } else {
        item.options.forEach((opt, i) => {
          if (!opt || typeof opt.name !== 'string' || opt.name.trim() === '') {
            errors.push({ field: 'options', message: `Option ${i + 1} must have a name` })
          }
          if (!Array.isArray(opt.values) || opt.values.length < 1) {
            errors.push({ field: 'options', message: `Option ${i + 1} must have at least one value` })
          }
        })
      }
      if (item.variantMode === undefined || item.variantMode === null || item.variantMode === '') {
        errors.push({ field: 'variantMode', message: 'Variant mode is required when Has options is on' })
      }
      if (item.variantMode === 'sample_n') {
        if (item.variantCount === undefined || item.variantCount === null || typeof item.variantCount !== 'number' || item.variantCount < 0) {
          errors.push({ field: 'variantCount', message: 'Sample variant count is required when variant mode is sample_n' })
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}
