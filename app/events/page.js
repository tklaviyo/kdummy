'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { JOURNEYS, getJourneyById, getUniqueEventNamesForJourney, getJourneysByType, getJourneyIdFromTypeAndVariant, isProductJourneyType } from '@/src/lib/events/journeyDefinitions'
import { getEventDescription } from '@/src/lib/events/eventDefinitions'
import { generateEvents } from '@/src/lib/events/generateEvents'
import { buildSampleEventProperties } from '@/src/lib/events/eventPropertiesSchema'
import { getTimingProfile, TIMING_PROFILES } from '@/src/lib/events/journeyTimings'
import { loadCatalog } from '@/src/catalog/storage'
import { getBusinessTypesByTemplate, getBusinessTypeById, getCatalogItemsFromBusinessType } from '@/src/catalog/businessTypes'
import { getTemplate } from '@/src/catalog/schema'
import { apiClient } from '@/lib/apiClient'
import { getActiveApiKey } from '@/lib/storage'
import ConfigureEventsTab from '@/app/events/ConfigureEventsTab'

const DATA_SOURCE_CATALOG = 'catalog'
const DATA_SOURCE_INDUSTRY = 'industry'

const JOURNEY_TYPES = [
  { value: 'ecommerce_online', label: 'Product (online)' },
  { value: 'ecommerce_instore', label: 'Product (in-store)' },
  { value: 'booking', label: 'Service (booking)' },
  { value: 'subscription', label: 'Subscription' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'day', label: 'Last 24 hours' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '12months', label: 'Last 12 months' },
  { value: '24months', label: 'Last 24 months' },
]

const RUN_HISTORY_KEY = 'kdummy_event_runs'
const RUN_HISTORY_MAX = 50

function loadRunHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RUN_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRunHistory(runs) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(runs.slice(0, RUN_HISTORY_MAX)))
  } catch (_) {}
}

function buildFullCatalog(journeyType, catalogFromStorage, dataSourceProducts, dataSourceServices, dataSourceSubscriptions, industryProducts, industryServices, industrySubscriptions) {
  const products = dataSourceProducts === DATA_SOURCE_CATALOG
    ? catalogFromStorage.products
    : (getBusinessTypeById(industryProducts) ? getCatalogItemsFromBusinessType(getBusinessTypeById(industryProducts)) : [])
  const services = dataSourceServices === DATA_SOURCE_CATALOG
    ? catalogFromStorage.services
    : (getBusinessTypeById(industryServices) ? getCatalogItemsFromBusinessType(getBusinessTypeById(industryServices)) : [])
  const subscriptions = dataSourceSubscriptions === DATA_SOURCE_CATALOG
    ? catalogFromStorage.subscriptions
    : (getBusinessTypeById(industrySubscriptions) ? getCatalogItemsFromBusinessType(getBusinessTypeById(industrySubscriptions)) : [])
  return { products, services, subscriptions }
}

function filterCatalogBySelectedIds(fullCatalog, selectedProductIds, selectedServiceIds, selectedSubscriptionIds, journeyType) {
  const idSet = (arr) => new Set(Array.isArray(arr) ? arr : [])
  const productIds = idSet(selectedProductIds)
  const serviceIds = idSet(selectedServiceIds)
  const subIds = idSet(selectedSubscriptionIds)
  return {
    products: (fullCatalog.products || []).filter((p) => productIds.has(p.id)),
    services: (fullCatalog.services || []).filter((s) => serviceIds.has(s.id)),
    subscriptions: (fullCatalog.subscriptions || []).filter((s) => subIds.has(s.id)),
  }
}

export default function EventsPage() {
  const [journeyType, setJourneyType] = useState('ecommerce_online')
  const [journeyVariant, setJourneyVariant] = useState('full')
  const [selectedEventNames, setSelectedEventNames] = useState([])
  const [journeyCount, setJourneyCount] = useState(1)
  const [profilesCount, setProfilesCount] = useState(5)
  const [dateRange, setDateRange] = useState('12months')
  const [dataSourceProducts, setDataSourceProducts] = useState(DATA_SOURCE_CATALOG)
  const [dataSourceServices, setDataSourceServices] = useState(DATA_SOURCE_CATALOG)
  const [dataSourceSubscriptions, setDataSourceSubscriptions] = useState(DATA_SOURCE_CATALOG)
  const [industryProducts, setIndustryProducts] = useState('')
  const [industryServices, setIndustryServices] = useState('')
  const [industrySubscriptions, setIndustrySubscriptions] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState([])
  const [runHistory, setRunHistory] = useState([])
  const [selectedJobIds, setSelectedJobIds] = useState(new Set())
  const [catalogFromStorage, setCatalogFromStorage] = useState({ products: [], services: [], subscriptions: [] })
  const [previewEventName, setPreviewEventName] = useState(null)
  const [previewExampleIndex, setPreviewExampleIndex] = useState(0)
  const [multiSelectOpen, setMultiSelectOpen] = useState(null)
  const [profileSearchQuery, setProfileSearchQuery] = useState('')
  const multiSelectRef = useRef(null)
  const profileDropdownRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const eventsTab = tabParam === 'jobs' || tabParam === 'configure' || tabParam === 'generate' ? tabParam : 'generate'
  const setEventsTab = useCallback((tab) => {
    router.replace(`/events?tab=${tab}`)
  }, [router])
  const [generateStep, setGenerateStep] = useState('setup') // 'setup' | 'confirm'
  const linearDefaults = getTimingProfile('ecommerce_linear') || TIMING_PROFILES.ecommerce_linear
  const [timingStepMin, setTimingStepMin] = useState(linearDefaults?.stepMinutesMin ?? 2)
  const [timingStepMax, setTimingStepMax] = useState(linearDefaults?.stepMinutesMax ?? 10)
  const [profileMode, setProfileMode] = useState('auto') // 'auto' | 'selected'
  const [selectedProfileIds, setSelectedProfileIds] = useState([])
  const [availableProfiles, setAvailableProfiles] = useState([])
  const [profilesLoadError, setProfilesLoadError] = useState(null)
  const [productsPerOrderMin, setProductsPerOrderMin] = useState(1)
  const [productsPerOrderMax, setProductsPerOrderMax] = useState(3)

  const selectedJourneyId = getJourneyIdFromTypeAndVariant(journeyType, journeyVariant) || getJourneysByType(journeyType)[0]?.id
  const journey = getJourneyById(selectedJourneyId)
  const availableEventNames = journey ? getUniqueEventNamesForJourney(selectedJourneyId) : []
  const journeysOfType = getJourneysByType(journeyType)

  const productBusinessTypes = getBusinessTypesByTemplate('product')
  const serviceBusinessTypes = getBusinessTypesByTemplate('service')
  const subscriptionBusinessTypes = getBusinessTypesByTemplate('subscription')

  const fullCatalog = buildFullCatalog(
    journeyType,
    catalogFromStorage,
    dataSourceProducts,
    dataSourceServices,
    dataSourceSubscriptions,
    industryProducts,
    industryServices,
    industrySubscriptions
  )

  const catalog = filterCatalogBySelectedIds(
    fullCatalog,
    selectedProductIds,
    selectedServiceIds,
    selectedSubscriptionIds,
    journeyType
  )

  const needsProducts = isProductJourneyType(journeyType)
  const needsServices = journeyType === 'booking'
  const needsSubscriptions = journeyType === 'subscription'

  const productsCount = catalog.products.length
  const servicesCount = catalog.services.length
  const subscriptionsCount = catalog.subscriptions.length

  const hasEnoughData =
    (!needsProducts || productsCount > 0) &&
    (!needsServices || servicesCount > 0) &&
    (!needsSubscriptions || subscriptionsCount > 0)

  useEffect(() => {
    if (journeysOfType.length && !journeysOfType.some((j) => j.variant === journeyVariant)) {
      setJourneyVariant(journeysOfType[0].variant)
    }
  }, [journeyType, journeyVariant, journeysOfType])

  useEffect(() => {
    const names = getUniqueEventNamesForJourney(selectedJourneyId)
    setSelectedEventNames(names)
  }, [selectedJourneyId])

  useEffect(() => {
    if (selectedEventNames.length > 0 && (!previewEventName || !selectedEventNames.includes(previewEventName))) {
      setPreviewEventName(selectedEventNames[0])
    } else if (selectedEventNames.length === 0) setPreviewEventName(null)
  }, [selectedEventNames, previewEventName])

  useEffect(() => {
    setCatalogFromStorage({
      products: loadCatalog('product'),
      services: loadCatalog('service'),
      subscriptions: loadCatalog('subscription'),
    })
  }, [])

  useEffect(() => {
    setRunHistory(loadRunHistory())
  }, [])

  const deleteJob = useCallback((jobId) => {
    setRunHistory((prev) => {
      const next = prev.filter((r) => r.id !== jobId)
      saveRunHistory(next)
      return next
    })
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }, [])

  const deleteSelectedJobs = useCallback(() => {
    const ids = Array.from(selectedJobIds)
    if (ids.length === 0) return
    if (!window.confirm(`Remove ${ids.length} job(s) from history?`)) return
    setRunHistory((prev) => {
      const idSet = new Set(ids)
      const next = prev.filter((r) => !idSet.has(r.id))
      saveRunHistory(next)
      return next
    })
    setSelectedJobIds(new Set())
  }, [selectedJobIds])

  const toggleJobSelection = useCallback((jobId) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }, [])

  const toggleSelectAllJobs = useCallback(() => {
    if (selectedJobIds.size === runHistory.length) {
      setSelectedJobIds(new Set())
    } else {
      setSelectedJobIds(new Set(runHistory.map((r) => r.id)))
    }
  }, [runHistory, selectedJobIds.size])

  const syncSelectedIds = useCallback((type, fullItems) => {
    const ids = (fullItems || []).map((x) => x.id)
    if (type === 'product') setSelectedProductIds(ids)
    if (type === 'service') setSelectedServiceIds(ids)
    if (type === 'subscription') setSelectedSubscriptionIds(ids)
  }, [])

  useEffect(() => {
    if (!needsProducts) return
    const items = dataSourceProducts === DATA_SOURCE_CATALOG ? fullCatalog.products : (getBusinessTypeById(industryProducts) ? getCatalogItemsFromBusinessType(getBusinessTypeById(industryProducts)) : [])
    syncSelectedIds('product', items)
  }, [needsProducts, dataSourceProducts, industryProducts, dataSourceProducts === DATA_SOURCE_CATALOG ? catalogFromStorage.products.length : industryProducts])

  useEffect(() => {
    if (!needsServices) return
    const items = dataSourceServices === DATA_SOURCE_CATALOG ? fullCatalog.services : (getBusinessTypeById(industryServices) ? getCatalogItemsFromBusinessType(getBusinessTypeById(industryServices)) : [])
    syncSelectedIds('service', items)
  }, [needsServices, dataSourceServices, industryServices, dataSourceServices === DATA_SOURCE_CATALOG ? catalogFromStorage.services.length : industryServices])

  useEffect(() => {
    if (!needsSubscriptions) return
    const items = dataSourceSubscriptions === DATA_SOURCE_CATALOG ? fullCatalog.subscriptions : (getBusinessTypeById(industrySubscriptions) ? getCatalogItemsFromBusinessType(getBusinessTypeById(industrySubscriptions)) : [])
    syncSelectedIds('subscription', items)
  }, [needsSubscriptions, dataSourceSubscriptions, industrySubscriptions, dataSourceSubscriptions === DATA_SOURCE_CATALOG ? catalogFromStorage.subscriptions.length : industrySubscriptions])

  useEffect(() => {
    function handleClickOutside(e) {
      if (multiSelectRef.current && !multiSelectRef.current.contains(e.target)) setMultiSelectOpen(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleEvent = useCallback((eventName) => {
    setSelectedEventNames((prev) =>
      prev.includes(eventName) ? prev.filter((n) => n !== eventName) : [...prev, eventName]
    )
  }, [])

  const selectAllEvents = useCallback(() => setSelectedEventNames(availableEventNames), [availableEventNames])
  const deselectAllEvents = useCallback(() => setSelectedEventNames([]), [])

  const toggleCatalogId = useCallback((kind, id) => {
    if (kind === 'product') setSelectedProductIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    if (kind === 'service') setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    if (kind === 'subscription') setSelectedSubscriptionIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }, [])

  const selectAllCatalog = useCallback((kind, items) => {
    const ids = (items || []).map((x) => x.id)
    if (kind === 'product') setSelectedProductIds(ids)
    if (kind === 'service') setSelectedServiceIds(ids)
    if (kind === 'subscription') setSelectedSubscriptionIds(ids)
  }, [])

  const deselectAllCatalog = useCallback((kind) => {
    if (kind === 'product') setSelectedProductIds([])
    if (kind === 'service') setSelectedServiceIds([])
    if (kind === 'subscription') setSelectedSubscriptionIds([])
  }, [])

  const loadProfiles = useCallback(async () => {
    setProfilesLoadError(null)
    try {
      const res = await apiClient.getProfiles(1, 200)
      const json = await res.json()
      const list = json?.data || []
      setAvailableProfiles(list)
      if (list.length === 0) setProfilesLoadError('No profiles found. Create profiles first or use auto-generated.')
    } catch (e) {
      setProfilesLoadError(e?.message || 'Failed to load profiles. Configure API key in Settings.')
      setAvailableProfiles([])
    }
  }, [])

  useEffect(() => {
    if (profileMode === 'selected' && getActiveApiKey()) {
      loadProfiles()
    }
  }, [profileMode, loadProfiles])

  const handleGenerate = useCallback(() => {
    const timingOverrides = journey?.timingProfile === 'ecommerce_linear'
      ? { stepMinutesMin: timingStepMin, stepMinutesMax: Math.max(timingStepMin, timingStepMax) }
      : undefined
    const profilesOption =
      profileMode === 'selected' && selectedProfileIds.length > 0
        ? {
            profileIds: selectedProfileIds,
            profileEmails: selectedProfileIds.map(
              (id) => availableProfiles.find((p) => p.id === id)?.attributes?.email || `profile-${id}@klaviyo-dummy.com`
            ),
          }
        : undefined
    const productsPerOrder =
      needsProducts && profileMode !== 'selected'
        ? { productsPerOrderMin, productsPerOrderMax: Math.max(productsPerOrderMin, productsPerOrderMax) }
        : needsProducts
          ? { productsPerOrderMin, productsPerOrderMax: Math.max(productsPerOrderMin, productsPerOrderMax) }
          : undefined
    const result = generateEvents({
      journeyId: selectedJourneyId,
      selectedEventNames,
      catalog,
      options: {
        journeyCount,
        profilesCount: profileMode === 'auto' ? profilesCount : undefined,
        dateRange,
        timingOverrides,
        ...profilesOption,
        ...productsPerOrder,
      },
    })
    const profileSummaries = result.jobSummary.profileIds.map((id, i) => {
      const email = result.jobSummary.profileEmails[i]
      const attrs = profileMode === 'selected' ? availableProfiles.find((p) => p.id === id)?.attributes : null
      return { id, email, firstName: attrs?.first_name ?? null, lastName: attrs?.last_name ?? null }
    })
    const jobRecord = {
      id: `run_${Date.now()}`,
      runAt: new Date().toISOString(),
      jobSummary: result.jobSummary,
      profileSummaries,
      examplesByEventName: result.examplesByEventName,
      events: result.events,
    }
    setRunHistory((prev) => {
      const next = [jobRecord, ...prev]
      saveRunHistory(next)
      return next
    })
  }, [selectedJourneyId, selectedEventNames, catalog, journeyCount, profilesCount, dateRange, journey?.timingProfile, timingStepMin, timingStepMax, profileMode, selectedProfileIds, availableProfiles, needsProducts, productsPerOrderMin, productsPerOrderMax])

  const previewCatalogKind = journeyType === 'booking' ? 'service' : journeyType === 'subscription' ? 'subscription' : 'product'
  const previewExamplesByEvent = useMemo(() => {
    const baseContext = {
      valueCurrency: 'USD',
      orderSource: journeyType === 'ecommerce_instore' ? 'instore' : 'online',
      orderType: journeyType === 'subscription' ? 'New subscription' : 'One time',
      catalogKind: previewCatalogKind,
      businessTypeId:
        (isProductJourneyType(journeyType) && dataSourceProducts === DATA_SOURCE_INDUSTRY ? industryProducts : null) ||
        (journeyType === 'booking' && dataSourceServices === DATA_SOURCE_INDUSTRY ? industryServices : null) ||
        (journeyType === 'subscription' && dataSourceSubscriptions === DATA_SOURCE_INDUSTRY ? industrySubscriptions : null) ||
        undefined,
    }
    const byEvent = {}
    const exampleContexts = [
      { profileId: '01J001', profileEmail: 'profile-001@klaviyo-dummy.com', orderId: 'ord_001', value: 79.98 },
      { profileId: '01J002', profileEmail: 'profile-002@klaviyo-dummy.com', orderId: 'ord_002', value: 120.5 },
      { profileId: '01J003', profileEmail: 'profile-003@klaviyo-dummy.com', orderId: 'ord_003', value: 45.0 },
    ]
    selectedEventNames.forEach((name) => {
      byEvent[name] = exampleContexts.map((ctx) =>
        buildSampleEventProperties(name, catalog, { ...baseContext, ...ctx }).properties
      )
    })
    return byEvent
  }, [selectedEventNames, catalog, journeyType, previewCatalogKind, dataSourceProducts, dataSourceServices, dataSourceSubscriptions, industryProducts, industryServices, industrySubscriptions])

  const itemsForKind = kind => {
    if (kind === 'product') return fullCatalog.products
    if (kind === 'service') return fullCatalog.services
    if (kind === 'subscription') return fullCatalog.subscriptions
    return []
  }

  const selectedIdsForKind = kind => {
    if (kind === 'product') return selectedProductIds
    if (kind === 'service') return selectedServiceIds
    if (kind === 'subscription') return selectedSubscriptionIds
    return []
  }

  const MultiSelect = ({ kind, label }) => {
    const items = itemsForKind(kind)
    const selectedIds = selectedIdsForKind(kind)
    const isOpen = multiSelectOpen === kind
    const selectedCount = selectedIds.length
    if (items.length === 0) return <span className="text-sm text-gray-500">No items</span>
    return (
      <div className="relative" ref={multiSelectRef}>
        <button
          type="button"
          onClick={() => setMultiSelectOpen(isOpen ? null : kind)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
        >
          {label} ({selectedCount} selected)
          <span className="text-gray-400">▾</span>
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg max-h-72 overflow-y-auto">
            <div className="flex gap-2 px-3 py-2 border-b border-gray-100">
              <button type="button" onClick={() => selectAllCatalog(kind, items)} className="text-xs font-medium text-indigo-600">Select all</button>
              <button type="button" onClick={() => deselectAllCatalog(kind)} className="text-xs font-medium text-indigo-600">Deselect all</button>
            </div>
            <ul className="py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleCatalogId(kind, item.id)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm truncate">{item.name}</span>
                    {item.price != null && <span className="text-xs text-gray-500 ml-auto">{item.price} {item.currency || 'USD'}</span>}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="events" />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-2 text-sm text-gray-600">
              Generate events from journey wizards or configure default and custom event properties.
            </p>
            <div className="mt-4 flex gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setEventsTab('generate')}
                className={`py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  eventsTab === 'generate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setEventsTab('configure')}
                className={`py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  eventsTab === 'configure' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Configure
              </button>
              <button
                type="button"
                onClick={() => setEventsTab('jobs')}
                className={`py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  eventsTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Jobs
                {runHistory.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                    {runHistory.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {eventsTab === 'jobs' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Run history</h2>
                  <p className="text-sm text-gray-500 mt-1">Past event generation runs. Click a job to view details. All dummy events use the <code className="bg-gray-100 px-1 rounded text-xs">K:Dummy</code> prefix.</p>
                </div>
                {selectedJobIds.size > 0 && (
                  <button
                    type="button"
                    onClick={deleteSelectedJobs}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete selected ({selectedJobIds.size})
                  </button>
                )}
              </div>
              {runHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No runs yet. Generate events from the Generate tab.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={runHistory.length > 0 && selectedJobIds.size === runHistory.length}
                            onChange={toggleSelectAllJobs}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            aria-label="Select all jobs"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profiles</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Journeys</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {runHistory.map((run) => (
                        <tr key={run.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(run.id)}
                              onChange={() => toggleJobSelection(run.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              aria-label={`Select ${run.jobSummary?.journeyName ?? run.id}`}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link href={`/events/job/${run.id}`} className="text-indigo-600 hover:text-indigo-800">
                              {run.jobSummary?.journeyName ?? 'Run'}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {run.runAt ? new Date(run.runAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {run.jobSummary?.profilesCount ?? 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {run.jobSummary?.totalEvents ?? 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {run.jobSummary?.journeyCount ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {eventsTab === 'configure' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <ConfigureEventsTab />
            </div>
          )}

          {eventsTab === 'generate' && (
          <div className="space-y-6">
            {/* Configuration: only show when not on confirmation */}
            {generateStep !== 'confirm' && (
            <>
            {/* Step 1: Journey type, variant & events in one container */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">1</span>
                  Select journey & events
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-11">Choose journey type and variant, then which events to include (all selected by default).</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-6">
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Journey type</h3>
                    <ul className="space-y-1" role="listbox" aria-label="Journey type">
                      {JOURNEY_TYPES.map((t) => (
                        <li key={t.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={journeyType === t.value}
                            onClick={() => setJourneyType(t.value)}
                            className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${journeyType === t.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                          >
                            {t.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Journey variant</h3>
                    <ul className="space-y-1" role="listbox" aria-label="Journey variant">
                      {journeysOfType.map((j) => (
                        <li key={j.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={journeyVariant === j.variant}
                            onClick={() => setJourneyVariant(j.variant)}
                            className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${journeyVariant === j.variant ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                          >
                            {j.name.includes(' — ') ? j.name.split(' — ')[1] : j.variant}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 min-w-0">
                    {journey && (
                      <>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Events in this journey</h3>
                        <div className="flex gap-2 mb-2">
                          <button type="button" onClick={selectAllEvents} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Select all</button>
                          <span className="text-gray-300">|</span>
                          <button type="button" onClick={deselectAllEvents} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Deselect all</button>
                        </div>
                        <ul className="space-y-1.5 pr-1">
                          {availableEventNames.map((name, idx) => (
                            <li key={name}>
                              <label className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${selectedEventNames.includes(name) ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="checkbox" checked={selectedEventNames.includes(name)} onChange={() => toggleEvent(name)} className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm">
                                  <span className="font-medium text-gray-900">{name}</span>
                                  {getEventDescription(name) && <span className="text-gray-500 block text-xs mt-0.5">{getEventDescription(name)}</span>}
                                </span>
                                <span className="ml-auto text-xs text-gray-400 font-mono">{idx + 1}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Catalog Items — source/template left, item table right */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">2</span>
                  Catalog Items
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-11">
                  Choose where item data comes from, then which items to use in generated events. You can <button type="button" onClick={() => setEventsTab('configure')} className="text-indigo-600 hover:text-indigo-800 font-medium">configure event properties</button> in the other tab.
                </p>
              </div>
              <div className="p-6 space-y-6">
                {journey && (needsProducts || needsServices || needsSubscriptions) && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
                    {/* Left: data source + template */}
                    <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Where should item data come from?</h3>
                      <p className="text-xs text-gray-500 mb-3">Generated events will reference items from one of these sources.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            if (needsProducts) { setDataSourceProducts(DATA_SOURCE_CATALOG); setIndustryProducts('') }
                            if (needsServices) { setDataSourceServices(DATA_SOURCE_CATALOG); setIndustryServices('') }
                            if (needsSubscriptions) { setDataSourceSubscriptions(DATA_SOURCE_CATALOG); setIndustrySubscriptions('') }
                          }}
                          className={`rounded-xl border-2 p-4 text-left transition-colors ${(needsProducts && dataSourceProducts === DATA_SOURCE_CATALOG) || (needsServices && dataSourceServices === DATA_SOURCE_CATALOG) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_CATALOG) ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <span className="block font-medium text-gray-900">Data Catalog</span>
                          <span className="block text-xs text-gray-500 mt-1">Use items you’ve added in the <Link href="/catalog" className="text-indigo-600 hover:text-indigo-800">Data Catalog</Link></span>
                          {needsProducts && <span className="block text-xs text-gray-500 mt-1">{catalogFromStorage.products.length} products available</span>}
                          {needsServices && <span className="block text-xs text-gray-500 mt-1">{catalogFromStorage.services.length} services available</span>}
                          {needsSubscriptions && <span className="block text-xs text-gray-500 mt-1">{catalogFromStorage.subscriptions.length} subscriptions available</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (needsProducts) setDataSourceProducts(DATA_SOURCE_INDUSTRY)
                            if (needsServices) setDataSourceServices(DATA_SOURCE_INDUSTRY)
                            if (needsSubscriptions) setDataSourceSubscriptions(DATA_SOURCE_INDUSTRY)
                          }}
                          className={`rounded-xl border-2 p-4 text-left transition-colors ${(needsProducts && dataSourceProducts === DATA_SOURCE_INDUSTRY) || (needsServices && dataSourceServices === DATA_SOURCE_INDUSTRY) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_INDUSTRY) ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <span className="block font-medium text-gray-900">Default template</span>
                          <span className="block text-xs text-gray-500 mt-1">Use sample items from an industry template (no catalog setup needed)</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 2b: If template, which one? */}
                    {((needsProducts && dataSourceProducts === DATA_SOURCE_INDUSTRY) || (needsServices && dataSourceServices === DATA_SOURCE_INDUSTRY) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_INDUSTRY)) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Which template?</h3>
                        <p className="text-xs text-gray-500 mb-2">Pick an industry template to generate sample items.</p>
                        <select
                          value={needsProducts ? industryProducts : needsServices ? industryServices : industrySubscriptions}
                          onChange={(e) => {
                            if (needsProducts) setIndustryProducts(e.target.value)
                            if (needsServices) setIndustryServices(e.target.value)
                            if (needsSubscriptions) setIndustrySubscriptions(e.target.value)
                          }}
                          className="max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select a template</option>
                          {needsProducts && productBusinessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                          {needsServices && serviceBusinessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                          {needsSubscriptions && subscriptionBusinessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                        </select>
                      </div>
                    )}
                    </div>

                    {/* Right: item selection table — Item name, Item type, Industry */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Which items to include?</h3>
                      <p className="text-xs text-gray-500 mb-2">Select the items that can appear in generated events. At least one must be selected.</p>
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col min-h-[260px]">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50 shrink-0">
                          <span className="text-xs text-gray-600">
                            {(() => {
                              const items = needsProducts ? fullCatalog.products : needsServices ? fullCatalog.services : fullCatalog.subscriptions
                              const selectedIds = needsProducts ? selectedProductIds : needsServices ? selectedServiceIds : selectedSubscriptionIds
                              return items.length === 0 ? 'Select a data source (and template if needed) on the left.' : `${selectedIds.length} of ${items.length} selected`
                            })()}
                          </span>
                          {(() => {
                            const items = needsProducts ? fullCatalog.products : needsServices ? fullCatalog.services : fullCatalog.subscriptions
                            if (items.length === 0) return null
                            return (
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { if (needsProducts) selectAllCatalog('product', items); if (needsServices) selectAllCatalog('service', items); if (needsSubscriptions) selectAllCatalog('subscription', items) }} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Select all</button>
                                <span className="text-gray-300">|</span>
                                <button type="button" onClick={() => { if (needsProducts) deselectAllCatalog('product'); if (needsServices) deselectAllCatalog('service'); if (needsSubscriptions) deselectAllCatalog('subscription') }} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Deselect all</button>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 border-b border-gray-100" style={{ maxHeight: '260px' }}>
                          {(() => {
                            const items = needsProducts ? fullCatalog.products : needsServices ? fullCatalog.services : fullCatalog.subscriptions
                            const kind = needsProducts ? 'product' : needsServices ? 'service' : 'subscription'
                            const selectedIds = needsProducts ? selectedProductIds : needsServices ? selectedServiceIds : selectedSubscriptionIds
                            const itemTypeLabel = (() => { try { return (getTemplate(kind)?.label ?? '').replace(/s$/, '') || (kind === 'product' ? 'Product' : kind === 'service' ? 'Service' : 'Subscription') } catch { return kind === 'product' ? 'Product' : kind === 'service' ? 'Service' : 'Subscription' } })()
                            const industryLabel = needsProducts
                              ? (dataSourceProducts === DATA_SOURCE_CATALOG ? 'Catalog' : (getBusinessTypeById(industryProducts)?.label ?? '—'))
                              : needsServices
                                ? (dataSourceServices === DATA_SOURCE_CATALOG ? 'Catalog' : (getBusinessTypeById(industryServices)?.label ?? '—'))
                                : (dataSourceSubscriptions === DATA_SOURCE_CATALOG ? 'Catalog' : (getBusinessTypeById(industrySubscriptions)?.label ?? '—'))
                            if (items.length === 0) {
                              return (
                                <p className="p-4 text-sm text-gray-500">
                                  Add items in <Link href="/catalog" className="text-indigo-600 hover:text-indigo-800">Data Catalog</Link> or choose Default template and a template on the left.
                                </p>
                              )
                            }
                            return (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 sticky top-0 z-[0]">
                                  <tr>
                                    <th className="text-left py-2 px-4 font-semibold text-gray-700 w-8" scope="col" />
                                    <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Item name</th>
                                    <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Item type</th>
                                    <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Industry</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                      <td className="py-2 px-4 w-8">
                                        <input
                                          type="checkbox"
                                          checked={selectedIds.includes(item.id)}
                                          onChange={() => toggleCatalogId(kind, item.id)}
                                          className="rounded border-gray-300 text-indigo-600"
                                          aria-label={`Select ${item.name}`}
                                        />
                                      </td>
                                      <td className="py-2 px-4 font-medium text-gray-900">{item.name}</td>
                                      <td className="py-2 px-4 text-gray-600">{itemTypeLabel}</td>
                                      <td className="py-2 px-4 text-gray-600">{industryLabel}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )
                          })()}
                        </div>
                      </div>
                      {/* Products per order: controls how many items per order and how many Viewed/Added to Cart events per product */}
                      {needsProducts && journey && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 mt-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">Products per order</h3>
                          <p className="text-xs text-gray-500 mb-3">Each order will have between min–max line items. There will be one Viewed Product and one Added to Cart event per product in the order.</p>
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">Min</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={productsPerOrderMin}
                                onChange={(e) => setProductsPerOrderMin(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                                className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                              />
                            </label>
                            <label className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">Max</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={productsPerOrderMax}
                                onChange={(e) => setProductsPerOrderMax(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                                className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                              />
                            </label>
                            <span className="text-xs text-gray-500">items per order</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(needsProducts && productsCount === 0) || (needsServices && servicesCount === 0) || (needsSubscriptions && subscriptionsCount === 0) ? (
                  journey && (needsProducts || needsServices || needsSubscriptions) && <p className="text-sm text-amber-600">Select at least one item above (or pick a default template and choose a template) before continuing.</p>
                ) : null}
              </div>
            </div>

            {/* Step 3: Generation settings — 1/4 Journey + Timestamp, 3/4 Profile assignment */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">3</span>
                  Generation settings
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-11">Journeys per profile, timestamp range, and profile assignment.</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6">
                  {/* 1/4: Journey runs + Timestamp range stacked */}
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4">
                      <label htmlFor="journeyCount" className="block text-sm font-semibold text-gray-900 mb-2">Journeys per profile</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setJourneyCount((c) => Math.max(1, c - 1))}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                          aria-label="Decrease journeys per profile"
                        >
                          −
                        </button>
                        <input
                          id="journeyCount"
                          type="number"
                          min={1}
                          max={10}
                          value={journeyCount}
                          onChange={(e) => setJourneyCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                          className="w-16 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setJourneyCount((c) => Math.min(10, c + 1))}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                          aria-label="Increase journeys per profile"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">How many journey runs per profile (1–10)</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4">
                      <label htmlFor="dateRange" className="block text-sm font-semibold text-gray-900 mb-2">Timestamp range</label>
                      <select
                        id="dateRange"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {DATE_RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">When generated events will be dated</p>
                    </div>
                  </div>
                  {/* 3/4: Profile assignment — fixed-height scrollable multi-select with search */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 mb-3">Profile assignment</span>
                    <div className="flex flex-col gap-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="profileMode"
                          checked={profileMode === 'auto'}
                          onChange={() => { setProfileMode('auto'); setSelectedProfileIds([]) }}
                          className="mt-1 h-4 w-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Random profiles</span>
                          <p className="text-xs text-gray-500 mt-0.5">Generate this many random profiles for this run</p>
                          {profileMode === 'auto' && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={profilesCount}
                                onChange={(e) => setProfilesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-20 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm shadow-sm"
                              />
                              <span className="text-xs text-gray-500">profiles</span>
                            </div>
                          )}
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="radio"
                          name="profileMode"
                          checked={profileMode === 'selected'}
                          onChange={() => setProfileMode('selected')}
                          className="mt-1 h-4 w-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900">Select profiles</span>
                          <p className="text-xs text-gray-500 mt-0.5">Search and choose profiles from your account</p>
                          {profileMode === 'selected' && (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col min-h-[260px]" ref={profileDropdownRef}>
                              {!getActiveApiKey() && <p className="px-4 py-2 text-xs text-amber-600 border-b border-gray-100">Set your API key in Settings to load profiles.</p>}
                              {availableProfiles.length === 0 && !profilesLoadError && getActiveApiKey() && (
                                <div className="p-4 border-b border-gray-100">
                                  <button type="button" onClick={loadProfiles} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Load profiles</button>
                                </div>
                              )}
                              {profilesLoadError && <p className="px-4 py-2 text-xs text-amber-600 border-b border-gray-100">{profilesLoadError}</p>}
                              {availableProfiles.length > 0 && (
                                <>
                                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50 shrink-0">
                                    <span className="text-xs text-gray-600">{selectedProfileIds.length} of {availableProfiles.length} selected</span>
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => setSelectedProfileIds(availableProfiles.map((p) => p.id))} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Select all</button>
                                      <span className="text-gray-300">|</span>
                                      <button type="button" onClick={() => setSelectedProfileIds([])} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Deselect all</button>
                                    </div>
                                  </div>
                                  <div className="p-2 border-b border-gray-100 shrink-0">
                                    <input
                                      type="search"
                                      placeholder="Search by email or ID…"
                                      value={profileSearchQuery}
                                      onChange={(e) => setProfileSearchQuery(e.target.value)}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                  </div>
                                  <ul className="py-1 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: '260px' }}>
                                    {(() => {
                                      const q = (profileSearchQuery || '').trim().toLowerCase()
                                      const filtered = q
                                        ? availableProfiles.filter((p) => {
                                            const email = (p.attributes?.email || '').toLowerCase()
                                            const id = (p.id || '').toLowerCase()
                                            const first = (p.attributes?.first_name || '').toLowerCase()
                                            const last = (p.attributes?.last_name || '').toLowerCase()
                                            return email.includes(q) || id.includes(q) || first.includes(q) || last.includes(q)
                                          })
                                        : availableProfiles
                                      if (filtered.length === 0) {
                                        return <li className="px-4 py-4 text-sm text-gray-500 text-center">{q ? 'No profiles match your search.' : 'No profiles.'}</li>
                                      }
                                      return filtered.map((p) => (
                                        <li key={p.id}>
                                          <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                                            <input
                                              type="checkbox"
                                              checked={selectedProfileIds.includes(p.id)}
                                              onChange={() => setSelectedProfileIds((prev) => prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id])}
                                              className="rounded border-gray-300 text-indigo-600 shrink-0"
                                            />
                                            <span className="text-sm truncate">{p.attributes?.email || p.id}</span>
                                          </label>
                                        </li>
                                      ))
                                    })()}
                                  </ul>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue to review: outside section, bottom right */}
            <div className="flex justify-end items-center gap-3 flex-wrap">
              {!hasEnoughData && <span className="text-sm text-amber-600">Select at least one item above first.</span>}
              {profileMode === 'selected' && selectedProfileIds.length === 0 && hasEnoughData && <span className="text-sm text-amber-600">Load and select profiles, or use generated.</span>}
              <button
                type="button"
                onClick={() => setGenerateStep('confirm')}
                disabled={selectedEventNames.length === 0 || !hasEnoughData || (profileMode === 'selected' && selectedProfileIds.length === 0)}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to review
              </button>
            </div>
            </>
            )}

            {/* Confirmation: summary + click-through payload preview + prominent Generate button */}
            {generateStep === 'confirm' && journey && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Review & run</h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGenerateStep('setup')}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      ← Back to setup
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleGenerate(); setGenerateStep('setup'); setEventsTab('jobs') }}
                      disabled={selectedEventNames.length === 0 || !hasEnoughData}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate events
                    </button>
                  </div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col gap-6">
                  {/* Summary (1/3) | Example payloads (2/3) side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 min-h-[400px]">
                    {/* Summary — 1/3 */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Summary</h3>
                      <p className="text-lg font-semibold text-gray-900">{journey.name}</p>
                      <ul className="mt-3 text-sm text-gray-600 space-y-1">
                        <li><span className="text-gray-500">Journeys per profile:</span> {journeyCount}</li>
                        <li><span className="text-gray-500">Total runs:</span> {profileMode === 'auto' ? profilesCount * journeyCount : selectedProfileIds.length * journeyCount}</li>
                        <li><span className="text-gray-500">Data:</span> {(needsProducts && dataSourceProducts === DATA_SOURCE_CATALOG) || (needsServices && dataSourceServices === DATA_SOURCE_CATALOG) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_CATALOG) ? 'Catalog' : `Template${(needsProducts ? industryProducts : needsServices ? industryServices : industrySubscriptions) ? ` · ${getBusinessTypeById(needsProducts ? industryProducts : needsServices ? industryServices : industrySubscriptions)?.label ?? ''}` : ''}`}</li>
                        <li><span className="text-gray-500">Profiles:</span> {profileMode === 'auto' ? `${profilesCount} random` : `${selectedProfileIds.length} selected`}</li>
                        <li><span className="text-gray-500">Dates:</span> {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? dateRange}</li>
                        {needsProducts && <li><span className="text-gray-500">Items/order:</span> {productsPerOrderMin}–{Math.max(productsPerOrderMin, productsPerOrderMax)}</li>}
                      </ul>
                      <p className="mt-3 text-xs text-gray-500">All events use the <code className="bg-gray-100 px-1 rounded">K:Dummy</code> prefix.</p>
                    </div>

                    {/* Example payloads — 2/3: event list + 1–3 examples per event */}
                    <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm min-h-0">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex-wrap gap-2">
                        <span className="text-sm font-semibold text-gray-900">Example payloads</span>
                        <div className="flex items-center gap-2">
                          {previewEventName && previewExamplesByEvent[previewEventName] && (
                            <span className="text-xs text-gray-500">
                              Example {previewExampleIndex + 1} of {previewExamplesByEvent[previewEventName].length}
                            </span>
                          )}
                          {previewEventName && previewExamplesByEvent[previewEventName] && previewExamplesByEvent[previewEventName].length > 1 && (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewExampleIndex((i) => Math.max(0, i - 1))}
                                disabled={previewExampleIndex <= 0}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                              >
                                ← Prev
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewExampleIndex((i) => Math.min((previewExamplesByEvent[previewEventName]?.length ?? 1) - 1, i + 1))}
                                disabled={previewExampleIndex >= (previewExamplesByEvent[previewEventName]?.length ?? 1) - 1}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                              >
                                Next →
                              </button>
                            </div>
                          )}
                          <button type="button" onClick={() => setEventsTab('configure')} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Configure properties</button>
                        </div>
                      </div>
                      <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
                        <nav className="sm:w-52 border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50/30 flex sm:flex-col overflow-x-auto shrink-0">
                          {selectedEventNames.map((name, idx) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => { setPreviewEventName(name); setPreviewExampleIndex(0) }}
                              className={`px-4 py-3 text-left text-sm font-medium whitespace-nowrap border-b sm:border-b-0 sm:border-r border-gray-200 last:border-0 transition-colors flex items-center gap-2 ${previewEventName === name ? 'bg-white text-indigo-700 border-indigo-500 sm:border-r-indigo-500 shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">{idx + 1}</span>
                              {name}
                            </button>
                          ))}
                        </nav>
                        <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 bg-white">
                          {previewEventName && previewExamplesByEvent[previewEventName] && (
                            (() => {
                              const examples = previewExamplesByEvent[previewEventName]
                              const payload = examples[previewExampleIndex] ?? examples[0]
                              return (
                                <>
                                  <p className="text-xs text-gray-500 mb-2">{previewEventName} — example {previewExampleIndex + 1} of {examples.length}</p>
                                  <pre className="flex-1 text-xs text-gray-800 bg-gray-50 rounded-lg p-4 overflow-auto border border-gray-100 font-mono min-h-[260px]" style={{ maxHeight: 'min(420px, 50vh)' }}>
                                    {JSON.stringify(payload, null, 2)}
                                  </pre>
                                </>
                              )
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Generate events CTA */}
                  <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ready to generate</p>
                      <p className="text-xs text-gray-600 mt-0.5">Events will be created with the <code className="bg-white/80 px-1 rounded">K:Dummy</code> prefix and saved to run history.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { handleGenerate(); setGenerateStep('setup'); setEventsTab('jobs') }}
                      disabled={selectedEventNames.length === 0 || !hasEnoughData}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate events
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
          )}
        </div>
      </main>
    </div>
  )
}
