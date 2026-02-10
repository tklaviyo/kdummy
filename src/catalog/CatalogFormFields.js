/**
 * Shared catalog form: renders fields from getVisibleFields with appropriate widgets.
 * Used by catalog modal (edit) and create wizard page.
 */

import { getTemplate } from './schema.js'
import { getVisibleFields } from './validators.js'
import { getVariantPreview } from './generators.js'

export function CatalogFormFields({ templateKey, formValues, setFormValues, errors = [] }) {
  const visibleFields = getVisibleFields(templateKey, formValues)
  const errorByField = {}
  errors.forEach((e) => {
    errorByField[e.field] = e.message
  })

  const update = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const rendered = []
  for (let i = 0; i < visibleFields.length; i++) {
    const field = visibleFields[i]
    const nextField = visibleFields[i + 1]
    const nextNextField = visibleFields[i + 2]

    // Product variants: same section style as other toggles, toggle right-aligned
    if (templateKey === 'product' && field.key === 'hasOptions' && nextField?.key === 'options' && nextNextField?.type === 'variantPreview') {
      const value = formValues.hasOptions
      const err = errorByField[field.key]
      const optionsErr = errorByField[nextField.key]
      const rows = getVariantPreview(value, formValues.options || [])
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []
      rendered.push(
        <div key="variants-section" className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {field.help && <p className="text-xs text-gray-500 mt-0.5">{field.help}</p>}
            </div>
            <div className="shrink-0">
              <CatalogFieldWidget
                field={field}
                value={value}
                onChange={(v) => update(field.key, v)}
              />
            </div>
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          {value && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{nextField.label}</label>
                {nextField.help && <p className="text-xs text-gray-500 mb-1">{nextField.help}</p>}
                <CatalogFieldWidget
                  field={nextField}
                  value={formValues[nextField.key]}
                  onChange={(v) => update(nextField.key, v)}
                />
                {optionsErr && <p className="mt-1 text-sm text-red-600">{optionsErr}</p>}
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">{nextNextField.label}</div>
                <p className="text-xs text-gray-500 mb-2">All combinations (preview, cap 50).</p>
                {rows.length === 0 ? (
                  <p className="text-sm text-gray-500">Add option names and values above to see combinations.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {columns.map((k) => (
                            <th key={k} className="text-left py-1.5 pr-2 font-medium text-gray-600">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-100">
                            {columns.map((col) => (
                              <td key={col} className="py-1.5 pr-2">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
      i += 2
      continue
    }

    if (field.type === 'variantPreview') {
      continue
    }

    const hasDependentBelow = nextField &&
      nextField.when &&
      nextField.when.dependsOn === field.key

    // Boolean with dependent: section with toggle right-aligned, description, then optional inputs below
    if (field.type === 'boolean' && hasDependentBelow) {
      const value = formValues[field.key]
      const err = errorByField[field.key]
      const nextErr = errorByField[nextField.key]
      rendered.push(
        <div key={field.key} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {field.help && <p className="text-xs text-gray-500 mt-0.5">{field.help}</p>}
            </div>
            <div className="shrink-0">
              <CatalogFieldWidget
                field={field}
                value={value}
                onChange={(v) => update(field.key, v)}
              />
            </div>
          </div>
          {value && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {nextField.label}
                {nextField.required && <span className="text-red-500"> *</span>}
              </label>
              {nextField.help && <p className="text-xs text-gray-500 mb-1">{nextField.help}</p>}
              <div className="max-w-md">
                <CatalogFieldWidget
                  field={nextField}
                  value={formValues[nextField.key]}
                  onChange={(v) => update(nextField.key, v)}
                />
              </div>
              {nextErr && <p className="mt-1 text-sm text-red-600">{nextErr}</p>}
            </div>
          )}
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      )
      i++
      continue
    }

    // Boolean with no dependent (e.g. Is digital): same row layout, toggle right-aligned
    if (field.type === 'boolean') {
      const value = formValues[field.key]
      const err = errorByField[field.key]
      rendered.push(
        <div key={field.key} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {field.help && <p className="text-xs text-gray-500 mt-0.5">{field.help}</p>}
            </div>
            <div className="shrink-0">
              <CatalogFieldWidget
                field={field}
                value={value}
                onChange={(v) => update(field.key, v)}
              />
            </div>
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      )
      continue
    }

    const value = formValues[field.key]
    const err = errorByField[field.key]
    rendered.push(
      <div key={field.key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        {field.help && <p className="text-xs text-gray-500 mb-1">{field.help}</p>}
        <CatalogFieldWidget
          field={field}
          value={value}
          onChange={(v) => update(field.key, v)}
        />
        {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rendered}
    </div>
  )
}

export function CatalogFieldWidget({ field, value, onChange }) {
  const { type, enumValues, placeholder } = field

  if (type === 'string') {
    return (
      <input
        type="text"
        value={value == null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      />
    )
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? '' : value}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') onChange(0)
          else onChange(Number(e.target.value))
        }}
        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      />
    )
  }

  if (type === 'boolean') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!!value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          value ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
          style={{ marginTop: '2px' }}
        />
      </button>
    )
  }

  if (type === 'enum') {
    return (
      <select
        value={value == null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value || (enumValues && enumValues[0]))}
        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      >
        {(enumValues || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  if (type === 'stringArray') {
    const arr = Array.isArray(value) ? value : []
    const inputClass = 'w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500'
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Type value and press Enter"
          className={inputClass}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            const v = e.target.value.trim()
            if (!v) return
            onChange([...arr, v])
            e.target.value = ''
          }}
        />
        {arr.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {arr.map((item, j) => (
              <span
                key={j}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => onChange(arr.filter((_, k) => k !== j))}
                  className="hover:text-indigo-600 rounded-full p-0.5"
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (type === 'optionsArray') {
    const opts = Array.isArray(value) ? value : []
    const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500'
    return (
      <div className="space-y-3">
        {opts.map((opt, i) => {
          const vals = Array.isArray(opt.values) ? opt.values : []
          return (
            <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-3">
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={opt.name || ''}
                    onChange={(e) => {
                      const next = opts.slice()
                      next[i] = { ...opt, name: e.target.value }
                      onChange(next)
                    }}
                    placeholder="e.g. Size"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                  <input
                    type="text"
                    placeholder="Type value and press Enter"
                    className={inputClass}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      const v = e.target.value.trim()
                      if (!v) return
                      const nextVals = [...vals, v]
                      const next = opts.slice()
                      next[i] = { ...opt, values: nextVals }
                      onChange(next)
                      e.target.value = ''
                    }}
                  />
                </div>
                <div className="shrink-0 pb-0.5">
                  <button
                    type="button"
                    onClick={() => onChange(opts.filter((_, j) => j !== i))}
                    className="text-sm text-red-600 hover:text-red-800"
                    aria-label="Remove option"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {vals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {vals.map((v, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-sm"
                    >
                      {v}
                      <button
                        type="button"
                        onClick={() => {
                          const nextVals = vals.filter((_, k) => k !== j)
                          const next = opts.slice()
                          next[i] = { ...opt, values: nextVals }
                          onChange(next)
                        }}
                        className="hover:text-indigo-600 rounded-full p-0.5"
                        aria-label={`Remove ${v}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <button
          type="button"
          onClick={() => onChange([...opts, { name: '', values: [] }])}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Add option
        </button>
      </div>
    )
  }

  return (
      <input
      type="text"
      value={value == null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm"
    />
  )
}
