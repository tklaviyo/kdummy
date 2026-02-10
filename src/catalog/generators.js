/**
 * Data Catalog — generators.
 * Safe dummy generation (no PII). Variants are preview-only and never stored.
 */

import { getTemplate, createEmptyItem, getOrderedFields, getDefaultValue } from './schema.js'

const PREFIX_BY_TEMPLATE = {
  product: 'PROD',
  service: 'SERV',
  subscription: 'SUB',
}

/**
 * Generate a unique id with the given prefix (no PII).
 * @param {string} prefix - e.g. 'PROD', 'SERV', 'SUB'
 * @returns {string} e.g. 'PROD-a1b2c3d4e5'
 */
export function makeId(prefix) {
  const p = typeof prefix === 'string' && prefix.length ? prefix : 'ITEM'
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `${p}-${t}${r}`
}

/**
 * Build a single catalog item from preset + overrides.
 * Mandatory fields are always populated (empty item + preset + overrides).
 * Options are kept on the item when hasOptions=true; variants are NOT generated or stored.
 * @param {object} preset - { id, label, templateKey, defaults }
 * @param {object} [overrides={}] - Fields to override (e.g. id, name)
 * @returns {object} Plain catalog item
 */
export function generateFromPreset(preset, overrides = {}) {
  if (!preset || !preset.templateKey) {
    throw new Error('Preset must have templateKey.')
  }
  const templateKey = preset.templateKey
  const template = getTemplate(templateKey)
  const empty = createEmptyItem(templateKey)

  const merged = { ...empty }
  if (preset.defaults && typeof preset.defaults === 'object') {
    Object.keys(preset.defaults).forEach((k) => {
      if (template.fields.some((f) => f.key === k)) {
        merged[k] = preset.defaults[k]
      }
    })
  }
  if (overrides && typeof overrides === 'object') {
    Object.keys(overrides).forEach((k) => {
      if (overrides[k] !== undefined) merged[k] = overrides[k]
    })
  }

  if (merged.id === undefined || merged.id === null || String(merged.id).trim() === '') {
    merged.id = makeId(PREFIX_BY_TEMPLATE[templateKey] || 'ITEM')
  }

  const mandatory = (template.fields || []).filter((f) => f.required && f.type !== 'variantPreview')
  mandatory.forEach((f) => {
    const v = merged[f.key]
    if (v === undefined || v === null) {
      merged[f.key] = getDefaultValue(f)
    }
    if (f.type === 'string' && (merged[f.key] === undefined || merged[f.key] === null)) {
      merged[f.key] = ''
    }
  })

  return { ...merged }
}

/** Safety cap for variant preview (no storage). */
const VARIANT_PREVIEW_CAP = 50

/**
 * Generate variant preview only. Never stored.
 * Always uses all combinations (capped at VARIANT_PREVIEW_CAP).
 * Events and profile properties can use these options for generation later.
 * @param {boolean} hasOptions
 * @param {Array<{ name: string, values: string[] }>} options
 * @returns {Array<Record<string, string>>} Rows with columns for each option name
 */
export function getVariantPreview(hasOptions, options) {
  if (hasOptions !== true) return []
  if (!Array.isArray(options) || options.length === 0) return []

  const names = options.map((o) => (o && o.name) || '')
  const arrays = options.map((o) => (Array.isArray(o.values) ? o.values : []))

  function cartesian(i) {
    if (i === arrays.length) return [{}]
    const rest = cartesian(i + 1)
    const result = []
    const key = names[i]
    for (const v of arrays[i]) {
      for (const r of rest) {
        result.push({ [key]: v, ...r })
      }
    }
    return result
  }

  const all = cartesian(0)
  return all.slice(0, VARIANT_PREVIEW_CAP)
}

/**
 * Generate multiple catalog items from the same preset.
 * Each item gets a unique id and an optional name suffix (1, 2, …).
 * Options are kept; variants are NOT generated or stored.
 * @param {object} preset - { id, label, templateKey, defaults }
 * @param {number} count - Number of items to generate
 * @returns {object[]} Array of plain catalog items
 */
export function generateManyFromPreset(preset, count) {
  const n = Math.max(0, Math.min(100, Math.floor(Number(count)) || 0))
  const items = []
  const baseName = (preset.defaults && preset.defaults.name) || preset.label || 'Item'
  for (let i = 0; i < n; i++) {
    const overrides = {
      id: makeId(PREFIX_BY_TEMPLATE[preset.templateKey] || 'ITEM'),
      name: n > 1 ? `${baseName} ${i + 1}` : baseName,
    }
    items.push(generateFromPreset(preset, overrides))
  }
  return items
}

/**
 * Build one catalog item from a business type and template index (for create wizard).
 * @param {object} businessType - { templateKey, templates: [ { defaults }, ... ] }
 * @param {number} templateIndex - Index into businessType.templates (0–4)
 * @param {object} [overrides={}] - e.g. id, name
 * @returns {object} Plain catalog item
 */
export function generateItemFromBusinessTypeTemplate(businessType, templateIndex, overrides = {}) {
  if (!businessType || !businessType.templateKey) {
    throw new Error('Business type must have templateKey.')
  }
  const templates = businessType.templates || []
  const t = templates[templateIndex]
  if (!t || !t.defaults) {
    throw new Error(`No template at index ${templateIndex}.`)
  }
  const preset = {
    templateKey: businessType.templateKey,
    defaults: t.defaults,
  }
  return generateFromPreset(preset, overrides)
}
