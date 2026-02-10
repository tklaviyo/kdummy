'use client'

/**
 * Renders catalog form dynamically from schema.
 * No hardcoded fields per business type — all from template.
 */

import { getTemplate, getDefaultValue } from './schemas/index.js'

function FieldInput({ field, value, onChange }) {
  const { key, type, label, required, enum: enumValues } = field

  const handleChange = (e) => {
    const raw = e.target.value
    if (type === 'number') onChange(key, raw === '' ? '' : Number(raw))
    else if (type === 'boolean') onChange(key, e.target.checked)
    else onChange(key, raw)
  }

  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={key}
          checked={!!value}
          onChange={handleChange}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor={key} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    )
  }

  if (type === 'enum') {
    return (
      <div>
        <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          id={key}
          value={value ?? ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select...</option>
          {(enumValues || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'stringArray') {
    const arr = Array.isArray(value) ? value : value ? [value] : []
    const str = arr.join(', ')
    return (
      <div>
        <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          id={key}
          value={str}
          onChange={(e) => {
            const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            onChange(key, list)
          }}
          placeholder="Comma-separated"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    )
  }

  if (type === 'optionsArray') {
    const arr = Array.isArray(value) ? value : []
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="space-y-2">
          {arr.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={opt.name ?? ''}
                onChange={(e) => {
                  const next = [...arr]
                  next[i] = { ...next[i], name: e.target.value }
                  onChange(key, next)
                }}
                placeholder="Option name"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                value={Array.isArray(opt.values) ? opt.values.join(', ') : ''}
                onChange={(e) => {
                  const next = [...arr]
                  next[i] = { ...next[i], values: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }
                  onChange(key, next)
                }}
                placeholder="Values (comma-separated)"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => onChange(key, arr.filter((_, j) => j !== i))}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange(key, [...arr, { name: '', values: [] }])}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Add option
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type === 'number' ? 'number' : 'text'}
        id={key}
        value={value ?? ''}
        onChange={handleChange}
        step={type === 'number' ? 'any' : undefined}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  )
}

export function CatalogForm({ templateType, formData, setFormData }) {
  const template = getTemplate(templateType)
  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }))

  const mandatory = template.mandatoryFields || []
  const additional = template.additionalRequired || []
  const toggles = template.toggles || []
  const conditionalFields = template.conditionalFields || []

  const showConditional = (cond) => Object.keys(cond.when).every((k) => formData[k] === true)

  return (
    <div className="space-y-4">
      {mandatory.map((f) => (
        <FieldInput key={f.key} field={f} value={formData[f.key]} onChange={update} />
      ))}
      {additional.map((f) => (
        <FieldInput key={f.key} field={f} value={formData[f.key]} onChange={update} />
      ))}

      {toggles.length > 0 && (
        <div className="pt-4 border-t">
          <div className="text-sm font-medium text-gray-700 mb-2">Toggles</div>
          <div className="flex flex-wrap gap-6">
            {toggles.map((t) => (
              <div key={t.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={t.key}
                  checked={!!formData[t.key]}
                  onChange={(e) => update(t.key, e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={t.key} className="text-sm text-gray-700">
                  {t.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {conditionalFields.map((cond, idx) =>
        showConditional(cond) ? (
          <div key={idx} className="pt-4 border-t space-y-4">
            {cond.fields.map((f) => (
              <FieldInput key={f.key} field={f} value={formData[f.key]} onChange={update} />
            ))}
          </div>
        ) : null
      )}
    </div>
  )
}

export default CatalogForm
