'use client'

import { useState, useEffect, useCallback } from 'react'
import { EVENT_DEFINITIONS } from '@/src/lib/events/eventDefinitions'
import { getMergedEventPropertySchema, buildSampleEventProperties } from '@/src/lib/events/eventPropertiesSchema'
import {
  getEventPropertyCustomisations,
  getCustomisationsForEvent,
  addEventPropertyCustomisation,
  removeEventPropertyCustomisation,
} from '@/src/lib/events/eventPropertiesCustomisationsStorage'
import { getCatalogItemsFromBusinessType, getBusinessTypeById, getRelevantBusinessTypeIdsForEvent } from '@/src/catalog/businessTypes'

export default function ConfigureEventsTab() {
  const [customisations, setCustomisations] = useState([])
  const [eventName, setEventName] = useState(EVENT_DEFINITIONS[0]?.name ?? '')
  const [businessTypeId, setBusinessTypeId] = useState('')
  const [addForm, setAddForm] = useState(null)

  const loadCustomisations = useCallback(() => {
    setCustomisations(getEventPropertyCustomisations())
  }, [])

  useEffect(() => {
    loadCustomisations()
  }, [loadCustomisations])

  const businessTypeIdsForEvent = getRelevantBusinessTypeIdsForEvent(eventName)
  const businessTypeOptions = businessTypeIdsForEvent.map((id) => ({
    id,
    label: getBusinessTypeById(id)?.label ?? id,
  }))

  useEffect(() => {
    if (businessTypeId && !businessTypeIdsForEvent.includes(businessTypeId)) {
      setBusinessTypeId('')
    }
  }, [eventName, businessTypeId, businessTypeIdsForEvent])

  const sampleCatalogForBusinessType = (btId) => {
    if (!btId) return { products: [], services: [], subscriptions: [] }
    const bt = getBusinessTypeById(btId)
    if (!bt) return { products: [], services: [], subscriptions: [] }
    const items = getCatalogItemsFromBusinessType(bt)
    if (bt.templateKey === 'product') return { products: items, services: [], subscriptions: [] }
    if (bt.templateKey === 'service') return { products: [], services: items, subscriptions: [] }
    if (bt.templateKey === 'subscription') return { products: [], services: [], subscriptions: items }
    return { products: [], services: [], subscriptions: [] }
  }

  const mergedSchema = getMergedEventPropertySchema(eventName, businessTypeId || null)
  const catalog = sampleCatalogForBusinessType(businessTypeId)
  const previewPayload = buildSampleEventProperties(eventName, catalog, {
    businessTypeId: businessTypeId || undefined,
    profileId: '01J001',
    profileEmail: 'profile-001@klaviyo-dummy.com',
  }).properties

  const customisationsForContext = getCustomisationsForEvent(eventName, businessTypeId || null)

  const handleAddCustomisation = (e) => {
    e.preventDefault()
    const form = e.target
    const key = form.key.value.trim()
    const description = form.description.value.trim()
    if (!eventName || !form.type.value || !key || !description) return
    addEventPropertyCustomisation({
      eventName,
      businessTypeId: businessTypeId || null,
      type: form.type.value,
      key,
      description,
      example: form.example?.value?.trim() || undefined,
      catalogField: form.catalogField?.value?.trim() || undefined,
    })
    loadCustomisations()
    setAddForm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Event</label>
          <select
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[200px]"
          >
            {EVENT_DEFINITIONS.map((ev) => (
              <option key={ev.name} value={ev.name}>{ev.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Business type</label>
          <select
            value={businessTypeId}
            onChange={(e) => setBusinessTypeId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">None</option>
            {businessTypeOptions.map((bt) => (
              <option key={bt.id} value={bt.id}>{bt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Business type only shows options relevant to the selected event. Standard properties are from code; custom properties below apply to this event and business type.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: standard (read-only) + custom (editable) */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Standard properties</h3>
            <p className="text-xs text-gray-500 mb-3">Defined in code; not editable here.</p>
            {mergedSchema ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Mandatory</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {mergedSchema.mandatory?.map((p) => (
                      <li key={p.key}>
                        <code className="bg-white px-1 rounded border border-gray-200">{p.key}</code>
                        {p.description && ` — ${p.description}`}
                      </li>
                    ))}
                  </ul>
                </div>
                {mergedSchema.catalogDriven?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-1">Catalog-driven</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {mergedSchema.catalogDriven.map((p) => (
                        <li key={p.key}>
                          <code className="bg-white px-1 rounded border border-gray-200">{p.key}</code>
                          {p.description && ` — ${p.description}`}
                          {p.catalogField && ` (${p.catalogField})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No schema for this event.</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Custom properties</h3>
            <p className="text-xs text-gray-500 mb-3">Add properties for this event and business type; they are merged on top of standard.</p>
            {addForm ? (
              <form onSubmit={handleAddCustomisation} className="space-y-3">
                <input type="hidden" name="eventName" value={eventName} />
                <input type="hidden" name="businessTypeId" value={businessTypeId} />
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Type</label>
                  <select name="type" required className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                    <option value="mandatory">Mandatory</option>
                    <option value="catalogDriven">Catalog-driven</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Key</label>
                  <input name="key" type="text" required placeholder="e.g. custom_field" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Description</label>
                  <input name="description" type="text" required placeholder="Description" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Example (optional)</label>
                  <input name="example" type="text" placeholder="e.g. value" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Catalog field (optional)</label>
                  <input name="catalogField" type="text" placeholder="e.g. categories" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Add</button>
                  <button type="button" onClick={() => setAddForm(null)} className="px-3 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddForm(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Add custom property
              </button>
            )}
            <ul className="mt-4 space-y-2">
              {customisationsForContext.length === 0 ? (
                <li className="text-sm text-gray-500">No custom properties for this event and business type.</li>
              ) : (
                customisationsForContext.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900">{c.key}</span>
                      <span className="text-gray-500 text-xs ml-2">· {c.type}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { removeEventPropertyCustomisation(c.id); loadCustomisations() }}
                      className="text-red-600 hover:text-red-700 text-sm shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Right: JSON preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 lg:sticky lg:top-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Payload preview</h3>
          <p className="text-xs text-gray-500 mb-3">Sample event payload for the selected event and business type (standard + custom).</p>
          <pre className="text-xs text-gray-700 bg-white rounded border border-gray-200 p-4 overflow-auto max-h-[480px]">
            {JSON.stringify(previewPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
