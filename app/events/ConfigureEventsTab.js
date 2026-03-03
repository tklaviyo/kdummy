'use client'

import { useState, useEffect } from 'react'
import { EVENT_DEFINITIONS } from '@/src/lib/events/eventDefinitions'
import { buildSampleEventProperties } from '@/src/lib/events/eventPropertiesSchema'
import { getCatalogItemsFromBusinessType, getBusinessTypeById, getRelevantBusinessTypeIdsForEvent } from '@/src/catalog/businessTypes'
import { samplePropertiesToKlaviyoEventPayload } from '@/lib/klaviyoPayloads'
import ColorizedJson from '@/components/ColorizedJson'

export default function ConfigureEventsTab() {
  const [eventName, setEventName] = useState(EVENT_DEFINITIONS[0]?.name ?? '')
  const [businessTypeId, setBusinessTypeId] = useState('')

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
    if (!btId) return { products: [], services: [], subscriptions: [], locations: [] }
    const bt = getBusinessTypeById(btId)
    if (!bt) return { products: [], services: [], subscriptions: [], locations: [] }
    const items = getCatalogItemsFromBusinessType(bt)
    if (bt.templateKey === 'product') return { products: items, services: [], subscriptions: [], locations: [] }
    if (bt.templateKey === 'service') return { products: [], services: items, subscriptions: [], locations: [] }
    if (bt.templateKey === 'subscription') return { products: [], services: [], subscriptions: items, locations: [] }
    return { products: [], services: [], subscriptions: [], locations: [] }
  }

  const catalog = sampleCatalogForBusinessType(businessTypeId)
  const orderSource = eventName && (eventName.includes('Order') || eventName.includes('Checkout')) ? 'online' : undefined
  const sampleProperties = buildSampleEventProperties(eventName, catalog, {
    businessTypeId: businessTypeId || undefined,
    profileId: '01J001',
    profileEmail: 'profile-001@klaviyo-dummy.com',
    orderId: 'ord_001',
    value: 79.98,
    orderSource,
  }).properties
  const klaviyoPayload = samplePropertiesToKlaviyoEventPayload(sampleProperties, eventName)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
      <p className="text-sm text-gray-600">
        Select an event and optional business type to view the Klaviyo API request body. The payload uses template product, service, or subscription data from the selected business type.
      </p>
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
      <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-100 px-4 pt-4 pb-2">Klaviyo API request body</h3>
        <p className="text-xs text-gray-400 px-4 pb-3">
          {eventName}
          {businessTypeId ? ` · ${getBusinessTypeById(businessTypeId)?.label ?? businessTypeId}` : ''}
        </p>
        <pre className="text-xs text-gray-100 rounded-b-lg p-4 overflow-auto max-h-[min(70vh,600px)] font-mono border-t border-gray-700">
          <ColorizedJson jsonString={JSON.stringify(klaviyoPayload, null, 2)} />
        </pre>
      </div>
    </div>
  )
}
