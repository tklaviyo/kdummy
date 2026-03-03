'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { useRepeatOnHold } from '@/lib/useRepeatOnHold'
import { JOURNEYS, getJourneyById, getUniqueEventNamesForJourney, getJourneysByType, getJourneyIdFromTypeAndVariant, isProductJourneyType } from '@/src/lib/events/journeyDefinitions'
import { getEventDescription } from '@/src/lib/events/eventDefinitions'
import { generateEvents, getProfileEmailAndName } from '@/src/lib/events/generateEvents'
import { buildSampleEventProperties } from '@/src/lib/events/eventPropertiesSchema'
import { samplePropertiesToKlaviyoEventPayload, buildKlaviyoEventPayload } from '@/lib/klaviyoPayloads'
import { getTimingProfile, TIMING_PROFILES } from '@/src/lib/events/journeyTimings'
import { DEFAULT_EVENT_LOCATIONS } from '@/src/lib/events/defaultLocations'
import { loadCatalog } from '@/src/catalog/storage'
import { getBusinessTypesByTemplate, getBusinessTypeById, getCatalogItemsFromBusinessType } from '@/src/catalog/businessTypes'
import { getTemplate } from '@/src/catalog/schema'
import { apiClient } from '@/lib/apiClient'
import { getActiveApiKey } from '@/lib/storage'
import ConfigureEventsTab from '@/app/events/ConfigureEventsTab'
import ColorizedJson from '@/components/ColorizedJson'

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

function EventsPageContent() {
  const [journeyType, setJourneyType] = useState('ecommerce_online')
  const [journeyVariant, setJourneyVariant] = useState('full')
  const [selectedEventNames, setSelectedEventNames] = useState([])
  const [journeyCount, setJourneyCount] = useState('1')
  const [profilesCount, setProfilesCount] = useState('5')
  const [dateRange, setDateRange] = useState('12months')
  const [dataSourceProducts, setDataSourceProducts] = useState(DATA_SOURCE_INDUSTRY)
  const [dataSourceServices, setDataSourceServices] = useState(DATA_SOURCE_INDUSTRY)
  const [dataSourceSubscriptions, setDataSourceSubscriptions] = useState(DATA_SOURCE_INDUSTRY)
  const [industryProducts, setIndustryProducts] = useState('apparel')
  const [industryServices, setIndustryServices] = useState('')
  const [industrySubscriptions, setIndustrySubscriptions] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState([])
  const [selectedLocationIds, setSelectedLocationIds] = useState([])
  const [includeLocationsInEvents, setIncludeLocationsInEvents] = useState(false)
  const [locationDataSource, setLocationDataSource] = useState('default')
  const [runHistory, setRunHistory] = useState([])
  const [selectedJobIds, setSelectedJobIds] = useState(new Set())
  const [catalogFromStorage, setCatalogFromStorage] = useState({ products: [], services: [], subscriptions: [] })
  const [catalogLocations, setCatalogLocations] = useState([])
  const [previewEventName, setPreviewEventName] = useState(null)
  const [previewExampleIndex, setPreviewExampleIndex] = useState(0)
  const [multiSelectOpen, setMultiSelectOpen] = useState(null)
  const [profileSearchQuery, setProfileSearchQuery] = useState('')
  const multiSelectRef = useRef(null)
  const profileDropdownRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const resolvedTab = tabParam === 'configure' ? 'preview' : tabParam
  const eventsTab = resolvedTab === 'jobs' || resolvedTab === 'preview' || resolvedTab === 'generate' ? resolvedTab : 'generate'
  const setEventsTab = useCallback((tab) => {
    router.replace(`/events?tab=${tab === 'configure' ? 'preview' : tab}`)
  }, [router])
  const [generateStep, setGenerateStep] = useState('setup') // 'setup' | 'confirm'
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [sendingToKlaviyo, setSendingToKlaviyo] = useState(false)
  const linearDefaults = getTimingProfile('ecommerce_linear') || TIMING_PROFILES.ecommerce_linear
  const [timingStepMin, setTimingStepMin] = useState(linearDefaults?.stepMinutesMin ?? 2)
  const [timingStepMax, setTimingStepMax] = useState(linearDefaults?.stepMinutesMax ?? 10)
  const bookingSpacedDefaults = getTimingProfile('booking_spaced') || TIMING_PROFILES.booking_spaced
  const defaultSessionDays = bookingSpacedDefaults?.bookingAtDaysFromCreate ?? 3
  const [bookingSessionDaysMin, setBookingSessionDaysMin] = useState(String(defaultSessionDays))
  const [bookingSessionDaysMax, setBookingSessionDaysMax] = useState(String(defaultSessionDays))
  const [profileMode, setProfileMode] = useState('auto') // 'auto' | 'selected'
  const [selectedProfileIds, setSelectedProfileIds] = useState([])
  const [availableProfiles, setAvailableProfiles] = useState([])
  const [profilesLoadError, setProfilesLoadError] = useState(null)
  const [productsPerOrderMin, setProductsPerOrderMin] = useState('1')
  const [productsPerOrderMax, setProductsPerOrderMax] = useState('3')

  const journeyCountNum = useMemo(() => Math.max(1, Math.min(10, parseInt(journeyCount, 10) || 1)), [journeyCount])
  const profilesCountNum = useMemo(() => Math.max(1, Math.min(50, parseInt(profilesCount, 10) || 5)), [profilesCount])
  const productsPerOrderMinNum = useMemo(() => Math.max(1, Math.min(10, parseInt(productsPerOrderMin, 10) || 1)), [productsPerOrderMin])
  const productsPerOrderMaxNum = useMemo(() => Math.max(productsPerOrderMinNum, Math.min(10, parseInt(productsPerOrderMax, 10) || 3)), [productsPerOrderMax, productsPerOrderMinNum])

  const journeyDecHold = useRepeatOnHold(useCallback(() => setJourneyCount((c) => String(Math.max(1, Math.min(10, (parseInt(c, 10) || 1) - 1)))), []))
  const journeyIncHold = useRepeatOnHold(useCallback(() => setJourneyCount((c) => String(Math.min(10, (parseInt(c, 10) || 1) + 1))), []))
  const profilesDecHold = useRepeatOnHold(useCallback(() => setProfilesCount((c) => String(Math.max(1, Math.min(50, (parseInt(c, 10) || 5) - 1)))), []))
  const profilesIncHold = useRepeatOnHold(useCallback(() => setProfilesCount((c) => String(Math.min(50, (parseInt(c, 10) || 5) + 1))), []))

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

  const filteredCatalog = filterCatalogBySelectedIds(
    fullCatalog,
    selectedProductIds,
    selectedServiceIds,
    selectedSubscriptionIds,
    journeyType
  )
  const needsProducts = isProductJourneyType(journeyType)
  const needsServices = journeyType === 'booking'
  const needsSubscriptions = journeyType === 'subscription'
  const needsLocations = journeyType === 'ecommerce_instore' || journeyType === 'booking'

  const allCustomLocations = useMemo(() => catalogLocations || [], [catalogLocations])
  const defaultLocationsTotal = DEFAULT_EVENT_LOCATIONS.length
  const defaultLocationsSelectedCount =
    selectedLocationIds.length === 0
      ? defaultLocationsTotal
      : DEFAULT_EVENT_LOCATIONS.filter((l) => selectedLocationIds.includes(l.id)).length

  const catalog = {
    ...filteredCatalog,
    locations: (() => {
      if (!needsLocations || !includeLocationsInEvents) return []
      if (locationDataSource === 'default') {
        if (selectedLocationIds.length === 0) return DEFAULT_EVENT_LOCATIONS
        return DEFAULT_EVENT_LOCATIONS.filter((l) => selectedLocationIds.includes(l.id))
      }
      if (locationDataSource === 'catalog') {
        if (selectedLocationIds.length > 0) {
          return allCustomLocations.filter((l) => selectedLocationIds.includes(l.id))
        }
        return allCustomLocations
      }
      return []
    })(),
  }

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
    let cancelled = false
    if (!getActiveApiKey()) return
    apiClient.getDataCatalog()
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.locations) setCatalogLocations(Array.isArray(data.data.locations) ? data.data.locations : [])
      })
      .catch(() => { if (!cancelled) setCatalogLocations([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setRunHistory(loadRunHistory())
  }, [])

  useEffect(() => {
    if (locationDataSource === 'catalog' && allCustomLocations.length > 0 && selectedLocationIds.length === 0) {
      setSelectedLocationIds(allCustomLocations.map((l) => l.id))
    }
  }, [locationDataSource, allCustomLocations, selectedLocationIds.length])

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

  const toggleLocationId = useCallback((id) => {
    setSelectedLocationIds((prev) => {
      if (locationDataSource === 'default') {
        const allDefaultIds = DEFAULT_EVENT_LOCATIONS.map((l) => l.id)
        const current = prev.length === 0 ? allDefaultIds : prev
        return current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      }
      // Data Catalog locations
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    })
  }, [locationDataSource])
  const selectAllLocations = useCallback(() => {
    if (locationDataSource === 'default') {
      setSelectedLocationIds(DEFAULT_EVENT_LOCATIONS.map((l) => l.id))
    } else {
      setSelectedLocationIds(allCustomLocations.map((l) => l.id))
    }
  }, [locationDataSource, allCustomLocations])
  const deselectAllLocations = useCallback(() => setSelectedLocationIds([]), [])

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

  const handleGenerate = useCallback(async () => {
    const timingOverrides = journey?.timingProfile === 'ecommerce_linear'
      ? { stepMinutesMin: timingStepMin, stepMinutesMax: Math.max(timingStepMin, timingStepMax) }
      : journey?.timingProfile === 'booking_spaced'
        ? { bookingAtDaysFromCreateMin: Math.max(0, Math.min(90, parseInt(bookingSessionDaysMin, 10) || 0)), bookingAtDaysFromCreateMax: Math.max(0, Math.min(90, parseInt(bookingSessionDaysMax, 10) || 0)) }
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
        ? { productsPerOrderMin: productsPerOrderMinNum, productsPerOrderMax: productsPerOrderMaxNum }
        : needsProducts
          ? { productsPerOrderMin: productsPerOrderMinNum, productsPerOrderMax: productsPerOrderMaxNum }
          : undefined
    const result = generateEvents({
      journeyId: selectedJourneyId,
      selectedEventNames,
      catalog,
      options: {
        journeyCount: journeyCountNum,
        profilesCount: profileMode === 'auto' ? profilesCountNum : undefined,
        dateRange,
        timingOverrides,
        ...profilesOption,
        ...productsPerOrder,
      },
    })
    const profileSummaries = result.jobSummary.profileIds.map((id, i) => {
      const email = result.jobSummary.profileEmails[i]
      const attrs = profileMode === 'selected' ? availableProfiles.find((p) => p.id === id)?.attributes : null
      const firstName = attrs?.first_name ?? result.jobSummary.profileFirstNames?.[i] ?? null
      const lastName = attrs?.last_name ?? result.jobSummary.profileLastNames?.[i] ?? null
      return { id, email, firstName, lastName }
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

    // Send all events to Klaviyo by default (via /api/events which forwards to Klaviyo Client API)
    if (result.events.length > 0) {
      setSendingToKlaviyo(true)
      let sent = 0
      let failed = 0
      try {
        for (const ev of result.events) {
          try {
            const payload = buildKlaviyoEventPayload(ev)
            const res = await apiClient.createEvent(payload.data)
            if (res.ok) sent++
            else failed++
          } catch {
            failed++
          }
        }
        if (failed === 0) {
          // Optional: could show a brief success toast instead of alert for large runs
          if (result.events.length <= 10) {
            alert(`Generated ${result.events.length} event(s) and sent to Klaviyo.`)
          }
        } else {
          alert(`Generated ${result.events.length} event(s). Sent ${sent} to Klaviyo. ${failed} failed.`)
        }
      } catch (e) {
        alert(`Generated ${result.events.length} event(s) but sending to Klaviyo failed: ${e?.message || 'Unknown error'}.`)
      } finally {
        setSendingToKlaviyo(false)
      }
    }
  }, [selectedJourneyId, selectedEventNames, catalog, journeyCount, profilesCount, dateRange, journey?.timingProfile, timingStepMin, timingStepMax, bookingSessionDaysMin, bookingSessionDaysMax, profileMode, selectedProfileIds, availableProfiles, needsProducts, productsPerOrderMin, productsPerOrderMax])

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
            <div className="border-b border-gray-200 mt-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setEventsTab('generate')}
                  className={`${
                    eventsTab === 'generate'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => setEventsTab('preview')}
                  className={`${
                    eventsTab === 'preview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setEventsTab('jobs')}
                  className={`${
                    eventsTab === 'jobs'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Jobs
                  {runHistory.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                      {runHistory.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {eventsTab === 'jobs' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Run history</h2>
                  <p className="text-sm text-gray-500 mt-1">Past event generation runs. Click a job to view details. Events are sent to Klaviyo with the <code className="bg-gray-100 px-1 rounded text-xs">(KD)</code> metric suffix.</p>
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

          {eventsTab === 'preview' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <ConfigureEventsTab />
            </div>
          )}

          {eventsTab === 'generate' && (
          <div className="space-y-6">
            {/* Configuration: only show when not on confirmation */}
            {generateStep !== 'confirm' && (
            <>
            {/* Step 1: Journey type (online / in-store / booking / subscription), variant, then events */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">1</span>
                  Journey type & events
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-11">Choose what type of journey (online, in-store, booking, or subscription), then which events to generate. In the next step you&apos;ll pick which items or industry template to use.</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-0 min-h-0">
                  <aside className="md:w-1/4 md:min-w-0 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 flex-shrink-0 p-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 px-1">Journey type</h3>
                    <nav className="flex md:flex-col gap-0 overflow-x-auto md:overflow-x-visible" aria-label="Journey type">
                      {JOURNEY_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          role="option"
                          aria-selected={journeyType === t.value}
                          onClick={() => setJourneyType(t.value)}
                          className={`w-full text-left py-2.5 px-3 rounded-md text-sm font-medium whitespace-nowrap ${
                            journeyType === t.value ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </nav>
                  </aside>
                  <aside className="md:w-1/4 md:min-w-0 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 flex-shrink-0 p-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 px-1">Variant</h3>
                    <nav className="flex md:flex-col gap-0 overflow-x-auto md:overflow-x-visible" aria-label="Journey variant">
                      {journeysOfType.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          role="option"
                          aria-selected={journeyVariant === j.variant}
                          onClick={() => setJourneyVariant(j.variant)}
                          className={`w-full text-left py-2.5 px-3 rounded-md text-sm font-medium whitespace-nowrap ${
                            journeyVariant === j.variant ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {j.name.includes(' — ') ? j.name.split(' — ')[1] : j.variant}
                        </button>
                      ))}
                    </nav>
                  </aside>
                  <div className="md:w-2/4 min-w-0 p-4 overflow-auto">
                    {journey && (
                      <>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Events</h3>
                        <p className="text-xs text-gray-500 mb-2">Check or uncheck events. Order is fixed for a sensible story.</p>
                        <div className="flex gap-2 mb-2">
                          <button type="button" onClick={selectAllEvents} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Select all</button>
                          <span className="text-gray-300">|</span>
                          <button type="button" onClick={deselectAllEvents} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Deselect all</button>
                        </div>
                        <ul className="space-y-1.5 pr-1">
                          {availableEventNames.map((name, idx) => (
                            <li key={name}>
                              <label className={`flex items-start gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${selectedEventNames.includes(name) ? 'border-indigo-200 bg-indigo-100' : 'border-gray-200 hover:bg-gray-100'}`}>
                                <input type="checkbox" checked={selectedEventNames.includes(name)} onChange={() => toggleEvent(name)} className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm">
                                  <span className="font-medium text-gray-900">{name}</span>
                                  {getEventDescription(name) && <span className="text-gray-500 block text-xs mt-0.5">{getEventDescription(name)}</span>}
                                </span>
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

            {/* Step 2: Event Data — items, locations */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">2</span>
                  Event Data
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-11">
                  Choose where item data comes from, then which items to use in generated events. You can <button type="button" onClick={() => setEventsTab('preview')} className="text-indigo-600 hover:text-indigo-800 font-medium">preview event payloads</button> in the other tab.
                </p>
              </div>
              <div className="p-6 space-y-6">
                {journey && (needsProducts || needsServices || needsSubscriptions) && (
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-gray-900">Items</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: data source + template (1/2) */}
                      <div className="space-y-6 min-w-0">
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                          <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (needsProducts) setDataSourceProducts(DATA_SOURCE_INDUSTRY)
                            if (needsServices) setDataSourceServices(DATA_SOURCE_INDUSTRY)
                            if (needsSubscriptions) setDataSourceSubscriptions(DATA_SOURCE_INDUSTRY)
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (needsProducts) setDataSourceProducts(DATA_SOURCE_INDUSTRY); if (needsServices) setDataSourceServices(DATA_SOURCE_INDUSTRY); if (needsSubscriptions) setDataSourceSubscriptions(DATA_SOURCE_INDUSTRY) } }}
                          className={`rounded-xl border-2 p-4 text-left transition-colors flex flex-col min-h-[152px] cursor-pointer ${(needsProducts && dataSourceProducts === DATA_SOURCE_INDUSTRY) || (needsServices && dataSourceServices === DATA_SOURCE_INDUSTRY) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_INDUSTRY) ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="w-full text-left flex-1 min-h-0">
                            <span className="block font-medium text-gray-900">Template Items</span>
                            <span className="block text-xs text-gray-500 mt-1">Use sample items from an industry template (no catalog setup needed)</span>
                          </div>
                          <div
                            className="mt-3 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (needsProducts && dataSourceProducts !== DATA_SOURCE_INDUSTRY) setDataSourceProducts(DATA_SOURCE_INDUSTRY)
                              if (needsServices && dataSourceServices !== DATA_SOURCE_INDUSTRY) setDataSourceServices(DATA_SOURCE_INDUSTRY)
                              if (needsSubscriptions && dataSourceSubscriptions !== DATA_SOURCE_INDUSTRY) setDataSourceSubscriptions(DATA_SOURCE_INDUSTRY)
                            }}
                          >
                            <select
                              id="catalog-template-select"
                              aria-label="Which template"
                              value={needsProducts ? industryProducts : needsServices ? industryServices : industrySubscriptions}
                              onChange={(e) => {
                                if (needsProducts) setIndustryProducts(e.target.value)
                                if (needsServices) setIndustryServices(e.target.value)
                                if (needsSubscriptions) setIndustrySubscriptions(e.target.value)
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">Select a template</option>
                              {needsProducts && productBusinessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                              {needsServices && serviceBusinessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                              {needsSubscriptions && subscriptionBusinessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (needsProducts) { setDataSourceProducts(DATA_SOURCE_CATALOG); setIndustryProducts('') }
                            if (needsServices) { setDataSourceServices(DATA_SOURCE_CATALOG); setIndustryServices('') }
                            if (needsSubscriptions) { setDataSourceSubscriptions(DATA_SOURCE_CATALOG); setIndustrySubscriptions('') }
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (needsProducts) { setDataSourceProducts(DATA_SOURCE_CATALOG); setIndustryProducts('') }; if (needsServices) { setDataSourceServices(DATA_SOURCE_CATALOG); setIndustryServices('') }; if (needsSubscriptions) { setDataSourceSubscriptions(DATA_SOURCE_CATALOG); setIndustrySubscriptions('') } } }}
                          className={`rounded-xl border-2 p-4 text-left transition-colors flex flex-col min-h-[152px] cursor-pointer ${(needsProducts && dataSourceProducts === DATA_SOURCE_CATALOG) || (needsServices && dataSourceServices === DATA_SOURCE_CATALOG) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_CATALOG) ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="w-full text-left flex-1 min-h-0">
                            <span className="block font-medium text-gray-900">Custom Items</span>
                            <span className="block text-xs text-gray-500 mt-1">Use items you’ve added in the <Link href="/catalog" className="text-indigo-600 hover:text-indigo-800" onClick={(e) => e.stopPropagation()}>Data Catalog</Link></span>
                          </div>
                          <div className="mt-3 flex-shrink-0 flex items-center gap-3 min-h-[38px] flex-wrap">
                            {(needsProducts && dataSourceProducts === DATA_SOURCE_CATALOG) || (needsServices && dataSourceServices === DATA_SOURCE_CATALOG) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_CATALOG) ? (
                              <>
                                {(() => {
                                  const count = needsProducts ? catalogFromStorage.products.length : needsServices ? catalogFromStorage.services.length : catalogFromStorage.subscriptions.length
                                  const label = needsProducts ? 'products' : needsServices ? 'services' : 'subscriptions'
                                  return count > 0 ? <span className="text-xs text-gray-500">{count} {label} available</span> : null
                                })()}
                                <Link
                                  href="/catalog"
                                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Add Catalog Items
                                </Link>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 invisible">—</span>
                            )}
                          </div>
                        </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: item selection table (1/2) */}
                      <div className="min-w-0">
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
                              if (items.length === 0) {
                                return (
                                  <p className="p-4 text-sm text-gray-500">
                                    Add items in <Link href="/catalog" className="text-indigo-600 hover:text-indigo-800">Data Catalog</Link> or choose Template Items and a template on the left.
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
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {journey && needsLocations && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Locations (optional)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Add location data to in-store and service (booking) events.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={includeLocationsInEvents}
                      onClick={() => setIncludeLocationsInEvents((v) => !v)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${includeLocationsInEvents ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`pointer-events-none absolute top-1/2 left-0.5 inline-block h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow ring-0 transition ${includeLocationsInEvents ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>

                    {includeLocationsInEvents && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: data source cards — same layout as Catalog Items */}
                        <div className="space-y-6 min-w-0">
                          <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setLocationDataSource('default')}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocationDataSource('default') } }}
                                className={`rounded-xl border-2 p-4 text-left transition-colors flex flex-col min-h-[152px] cursor-pointer ${locationDataSource === 'default' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                              >
                                <div className="w-full text-left flex-1 min-h-0">
                                  <span className="block font-medium text-gray-900">Template locations</span>
                                  <span className="block text-xs text-gray-500 mt-1">Use 5 generic locations (Location 1–5). No catalog setup needed.</span>
                                </div>
                              </div>
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setLocationDataSource('catalog')}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocationDataSource('catalog') } }}
                                className={`rounded-xl border-2 p-4 text-left transition-colors flex flex-col min-h-[152px] cursor-pointer ${locationDataSource === 'catalog' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                              >
                                <div className="w-full text-left flex-1 min-h-0">
                                  <span className="block font-medium text-gray-900">Custom Locations</span>
                                  <span className="block text-xs text-gray-500 mt-1">Use locations you’ve added in the <Link href="/catalog?tab=locations" className="text-indigo-600 hover:text-indigo-800" onClick={(e) => e.stopPropagation()}>Data Catalog</Link></span>
                                </div>
                                <div className="mt-3 flex-shrink-0 flex items-center gap-3 min-h-[38px] flex-wrap">
                                  {locationDataSource === 'catalog' ? (
                                    <>
                                      {allCustomLocations.length > 0 ? <span className="text-xs text-gray-500">{allCustomLocations.length} locations available</span> : null}
                                      <Link
                                        href="/catalog?tab=locations"
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Add locations
                                      </Link>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-500 invisible">—</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: location selection table — same format as Catalog Items */}
                        <div className="min-w-0">
                          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col min-h-[260px]">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50 shrink-0">
                              <span className="text-xs text-gray-600">
                                {locationDataSource === 'default'
                                  ? `${defaultLocationsSelectedCount} of ${defaultLocationsTotal} selected`
                                  : allCustomLocations.length === 0
                                    ? 'Select Custom Locations and add locations on the left.'
                                    : `${selectedLocationIds.length} of ${allCustomLocations.length} selected`}
                              </span>
                              {locationDataSource === 'catalog' && allCustomLocations.length > 0 && (
                                <div className="flex gap-2">
                                  <button type="button" onClick={selectAllLocations} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Select all</button>
                                  <span className="text-gray-300">|</span>
                                  <button type="button" onClick={deselectAllLocations} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Deselect all</button>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 overflow-y-auto min-h-0 border-b border-gray-100" style={{ maxHeight: '260px' }}>
                              {locationDataSource === 'default' ? (
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50/80 sticky top-0 z-[0]">
                                    <tr>
                                      <th className="text-left py-2 px-4 font-semibold text-gray-700 w-8" scope="col" />
                                      <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Location name</th>
                                      <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Address</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {DEFAULT_EVENT_LOCATIONS.map((loc) => (
                                      <tr key={loc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                        <td className="py-2 px-4 w-8">
                                          <input
                                            type="checkbox"
                                            checked={selectedLocationIds.length === 0 || selectedLocationIds.includes(loc.id)}
                                            onChange={() => toggleLocationId(loc.id)}
                                            className="rounded border-gray-300 text-indigo-600"
                                            aria-label={`Select ${loc.name}`}
                                          />
                                        </td>
                                        <td className="py-2 px-4 font-medium text-gray-900">{loc.name}</td>
                                        <td className="py-2 px-4 text-gray-600">
                                          {[loc.address, loc.city, loc.state, loc.postcode, loc.country].filter(Boolean).join(', ') || '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : allCustomLocations.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500">
                                  Add locations in <Link href="/catalog?tab=locations" className="text-indigo-600 hover:text-indigo-800">Data Catalog</Link> or choose Template locations on the left.
                                </p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50/80 sticky top-0 z-[0]">
                                    <tr>
                                      <th className="text-left py-2 px-4 font-semibold text-gray-700 w-8" scope="col" />
                                      <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Location name</th>
                                      <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Address</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allCustomLocations.map((loc) => (
                                      <tr key={loc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                        <td className="py-2 px-4 w-8">
                                          <input
                                            type="checkbox"
                                            checked={selectedLocationIds.includes(loc.id)}
                                            onChange={() => toggleLocationId(loc.id)}
                                            className="rounded border-gray-300 text-indigo-600"
                                            aria-label={`Select ${loc.name}`}
                                          />
                                        </td>
                                        <td className="py-2 px-4 font-medium text-gray-900">{loc.name}</td>
                                        <td className="py-2 px-4 text-gray-600">
                                          {[loc.address, loc.city, loc.state, loc.postcode, loc.country].filter(Boolean).join(', ') || '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                <p className="text-sm text-gray-500 mt-1 ml-11">Journeys per profile, timestamp range, and product options.</p>
              </div>
              <div className="p-6">
                <div className={`grid gap-4 grid-cols-1 sm:grid-cols-3`}>
                  {needsProducts && journey && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Products per order</label>
                      <p className="text-xs text-gray-500 mb-3">Min–max line items per order. One Viewed Product and one Added to Cart event per product.</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-7">Min</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={productsPerOrderMin}
                            onChange={(e) => setProductsPerOrderMin(e.target.value)}
                            onBlur={() => {
                              const n = Math.max(1, Math.min(10, parseInt(productsPerOrderMin, 10) || 1))
                              setProductsPerOrderMin(String(n))
                            }}
                            className="w-14 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-7">Max</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={productsPerOrderMax}
                            onChange={(e) => setProductsPerOrderMax(e.target.value)}
                            onBlur={() => {
                              const n = Math.max(1, Math.min(10, parseInt(productsPerOrderMax, 10) || 1))
                              setProductsPerOrderMax(String(n))
                            }}
                            className="w-14 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                          />
                        </div>
                        <span className="text-xs text-gray-500">items per order</span>
                      </div>
                    </div>
                  )}
                  {journey?.timingProfile === 'booking_spaced' && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Booking session (days after create)</label>
                      <p className="text-xs text-gray-500 mb-3">How many days after the booking is created the booking actually takes place.</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Min</span>
                          <input
                            id="bookingSessionDaysMin"
                            type="number"
                            min={0}
                            max={90}
                            value={bookingSessionDaysMin}
                            onChange={(e) => setBookingSessionDaysMin(e.target.value)}
                            onBlur={() => {
                              const n = Math.max(0, Math.min(90, parseInt(bookingSessionDaysMin, 10) || 0))
                              setBookingSessionDaysMin(String(n))
                            }}
                            className="w-14 rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Max</span>
                          <input
                            id="bookingSessionDaysMax"
                            type="number"
                            min={0}
                            max={90}
                            value={bookingSessionDaysMax}
                            onChange={(e) => setBookingSessionDaysMax(e.target.value)}
                            onBlur={() => {
                              const n = Math.max(0, Math.min(90, parseInt(bookingSessionDaysMax, 10) || 0))
                              setBookingSessionDaysMax(String(n))
                            }}
                            className="w-14 rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                          />
                        </div>
                        <span className="text-xs text-gray-500">days</span>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4">
                    <label htmlFor="journeyCount" className="block text-sm font-semibold text-gray-900 mb-2">Journeys per profile</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setJourneyCount((c) => String(Math.max(1, Math.min(10, (parseInt(c, 10) || 1) - 1))))}
                        {...journeyDecHold}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 select-none"
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
                        onChange={(e) => setJourneyCount(e.target.value)}
                        onBlur={() => {
                          const n = Math.max(1, Math.min(10, parseInt(journeyCount, 10) || 1))
                          setJourneyCount(String(n))
                        }}
                        className="w-16 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setJourneyCount((c) => String(Math.min(10, (parseInt(c, 10) || 1) + 1)))}
                        {...journeyIncHold}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 select-none"
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
              </div>
            </div>

            {/* Step 4: Profile assignment — left cards, right selection (like catalog items) */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">4</span>
                  Profile assignment
                </h2>
                <p className="text-sm text-gray-500 mt-1 ml-11">Who should the generated events be attributed to?</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: profile source cards */}
                  <div className="space-y-3 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Profile source</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setProfileMode('auto'); setSelectedProfileIds([]) }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileMode('auto'); setSelectedProfileIds([]) } }}
                        className={`rounded-xl border-2 p-4 text-left transition-colors flex flex-col min-h-[120px] cursor-pointer ${
                          profileMode === 'auto' ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-full text-left flex-1 min-h-0 flex flex-col items-start">
                          <span className="block text-sm font-semibold text-gray-900">Create new profiles</span>
                        </div>
                        {profileMode === 'auto' && (
                          <div className="mt-3 flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setProfilesCount((c) => String(Math.max(1, Math.min(50, (parseInt(c, 10) || 5) - 1))))}
                              {...profilesDecHold}
                              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 select-none"
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={profilesCount}
                              onChange={(e) => setProfilesCount(e.target.value)}
                              onBlur={() => {
                                const n = Math.max(1, Math.min(50, parseInt(profilesCount, 10) || 5))
                                setProfilesCount(String(n))
                              }}
                              className="w-14 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => setProfilesCount((c) => String(Math.min(50, (parseInt(c, 10) || 5) + 1)))}
                              {...profilesIncHold}
                              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 select-none"
                              aria-label="Increase"
                            >
                              +
                            </button>
                            <span className="text-xs text-gray-500">profiles</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileMode('selected')}
                        className={`rounded-xl border-2 p-4 text-left transition-colors min-h-[120px] flex flex-col items-start justify-start cursor-pointer ${
                          profileMode === 'selected' ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-sm font-semibold text-gray-900">Use existing profiles</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: profile selection or random profiles preview */}
                  <div className="min-w-0">
                    {profileMode === 'selected' ? (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Which profiles to use?</h3>
                        <p className="text-xs text-gray-500 mb-2">Select at least one profile. Generated events will be assigned to them.</p>
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col min-h-[260px]" ref={profileDropdownRef}>
                          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50 shrink-0">
                            <span className="text-xs text-gray-600">
                              {selectedProfileIds.length === 0
                                ? 'No profiles selected'
                                : `${selectedProfileIds.length} of ${availableProfiles.length} selected`}
                            </span>
                            {availableProfiles.length > 0 && (
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedProfileIds(availableProfiles.map((p) => p.id))} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Select all</button>
                                <span className="text-gray-300">|</span>
                                <button type="button" onClick={() => setSelectedProfileIds([])} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Deselect all</button>
                              </div>
                            )}
                          </div>
                          {!getActiveApiKey() && <p className="px-4 py-2 text-xs text-amber-600 border-b border-gray-100">Set your API key in Settings to load profiles.</p>}
                          {availableProfiles.length === 0 && !profilesLoadError && getActiveApiKey() && (
                            <div className="p-4 border-b border-gray-100">
                              <button type="button" onClick={loadProfiles} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Load profiles from account</button>
                            </div>
                          )}
                          {profilesLoadError && <p className="px-4 py-2 text-xs text-amber-600 border-b border-gray-100">{profilesLoadError}</p>}
                          {availableProfiles.length > 0 && (
                            <>
                              <div className="p-2 border-b border-gray-100 shrink-0">
                                <input
                                  type="search"
                                  placeholder="Search by email, name, or ID…"
                                  value={profileSearchQuery}
                                  onChange={(e) => setProfileSearchQuery(e.target.value)}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <ul className="py-1 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: '240px' }}>
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
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Which profiles to use?</h3>
                        <p className="text-xs text-gray-500 mb-2">{profilesCountNum} random profile{profilesCountNum !== 1 ? 's' : ''} will be generated for this run.</p>
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col min-h-[260px]">
                          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50 shrink-0">
                            <span className="text-xs text-gray-600">{profilesCountNum} profile{profilesCountNum !== 1 ? 's' : ''} (preview)</span>
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: '240px' }}>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50/80 sticky top-0 z-[0]">
                                <tr>
                                  <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">First name</th>
                                  <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Last name</th>
                                  <th className="text-left py-2 px-4 font-semibold text-gray-700" scope="col">Email</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from({ length: profilesCountNum }, (_, i) => {
                                  const { email, firstName, lastName } = getProfileEmailAndName(i, 'klaviyo-dummy.com')
                                  return (
                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                      <td className="py-2 px-4 font-medium text-gray-900">{firstName}</td>
                                      <td className="py-2 px-4 font-medium text-gray-900">{lastName}</td>
                                      <td className="py-2 px-4 text-gray-600">{email}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
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
                onClick={() => setShowReviewModal(true)}
                disabled={selectedEventNames.length === 0 || !hasEnoughData || (profileMode === 'selected' && selectedProfileIds.length === 0)}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to review
              </button>
            </div>
            </>
            )}

            {/* Review modal: summary + payload preview + generate button */}
            {showReviewModal && journey && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowReviewModal(false)} />
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="relative w-full max-w-5xl rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4 shrink-0">
                      <h2 className="text-lg font-semibold text-gray-900">Review</h2>
                      <button
                        type="button"
                        onClick={() => setShowReviewModal(false)}
                        className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Close"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
                      {/* Summary (1/4) + Preview (3/4) side by side */}
                      <div className="flex gap-4 min-h-0 flex-1">
                        {/* Summary — 1/4 width, items on own row */}
                        <div className="w-1/4 min-w-0 flex flex-col rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm shrink-0">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                            <span className="text-sm font-semibold text-gray-900">Summary</span>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{journey.name}</p>
                            <ul className="mt-1.5 text-xs text-gray-600 flex flex-col gap-y-1">
                              <li><span className="text-gray-500">Journeys per profile:</span> {journeyCountNum}</li>
                              <li><span className="text-gray-500">Total runs:</span> {profileMode === 'auto' ? profilesCountNum * journeyCountNum : selectedProfileIds.length * journeyCountNum}</li>
                              <li><span className="text-gray-500">Data:</span> {(needsProducts && dataSourceProducts === DATA_SOURCE_CATALOG) || (needsServices && dataSourceServices === DATA_SOURCE_CATALOG) || (needsSubscriptions && dataSourceSubscriptions === DATA_SOURCE_CATALOG) ? 'Catalog' : `Template${(needsProducts ? industryProducts : needsServices ? industryServices : industrySubscriptions) ? ` · ${getBusinessTypeById(needsProducts ? industryProducts : needsServices ? industryServices : industrySubscriptions)?.label ?? ''}` : ''}`}</li>
                              <li><span className="text-gray-500">Profiles:</span> {profileMode === 'auto' ? `${profilesCountNum} random` : `${selectedProfileIds.length} selected`}</li>
                              <li><span className="text-gray-500">Dates:</span> {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? dateRange}</li>
                              {needsProducts && <li><span className="text-gray-500">Items/order:</span> {productsPerOrderMinNum}–{productsPerOrderMaxNum}</li>}
                            </ul>
                            <p className="mt-1.5 text-xs text-gray-500">Events use <code className="bg-gray-100 px-1 rounded">(KD)</code> metric suffix.</p>
                          </div>
                        </div>

                        {/* Preview — 3/4 width */}
                        <div className="w-3/4 min-w-0 flex flex-col rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm min-h-0">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex-wrap gap-2">
                            <span className="text-sm font-semibold text-gray-900">Preview</span>
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
                            </div>
                          </div>
                          <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
                            <nav className="sm:w-52 border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50/30 flex sm:flex-col overflow-x-auto shrink-0">
                              {selectedEventNames.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => { setPreviewEventName(name); setPreviewExampleIndex(0) }}
                                  className={`px-4 py-3 text-left text-sm font-medium whitespace-nowrap border-b sm:border-b-0 sm:border-r border-gray-200 last:border-0 transition-colors ${previewEventName === name ? 'bg-white text-indigo-700 border-indigo-500 sm:border-r-indigo-500 shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
                                >
                                  {name}
                                </button>
                              ))}
                            </nav>
                            <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 bg-white">
                              {previewEventName && previewExamplesByEvent[previewEventName] && (
                                (() => {
                                  const examples = previewExamplesByEvent[previewEventName]
                                  const sampleProperties = examples[previewExampleIndex] ?? examples[0]
                                  const klaviyoPayload = samplePropertiesToKlaviyoEventPayload(sampleProperties, previewEventName)
                                  return (
                                    <>
                                      <p className="text-xs text-gray-500 mb-2">{previewEventName} — example {previewExampleIndex + 1} of {examples.length} (Klaviyo API request body)</p>
                                      <pre className="flex-1 text-xs rounded-lg p-4 overflow-auto border border-gray-700 font-mono min-h-[280px] bg-gray-900 text-gray-100" style={{ maxHeight: 'min(520px, 55vh)' }}>
                                        <ColorizedJson jsonString={JSON.stringify(klaviyoPayload, null, 2)} />
                                      </pre>
                                    </>
                                  )
                                })()
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Generate + Cancel — subtle, no outline */}
                      <div className="flex items-center justify-end gap-3 pt-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowReviewModal(false)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => { await handleGenerate(); setShowReviewModal(false); setEventsTab('jobs') }}
                          disabled={selectedEventNames.length === 0 || !hasEnoughData || sendingToKlaviyo}
                          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingToKlaviyo ? 'Sending to Klaviyo…' : 'Generate events'}
                        </button>
                      </div>
                    </div>
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

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <EventsPageContent />
    </Suspense>
  )
}
