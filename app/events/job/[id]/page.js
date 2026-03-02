'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import Navigation from '@/components/Navigation'

const RUN_HISTORY_KEY = 'kdummy_event_runs'

const DATE_RANGE_OPTIONS = [
  { value: 'day', label: 'Last 24 hours' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '12months', label: 'Last 12 months' },
  { value: '24months', label: 'Last 24 months' },
]

function loadRunById(jobId) {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RUN_HISTORY_KEY)
    const runs = raw ? JSON.parse(raw) : []
    return runs.find((r) => r.id === jobId) ?? null
  } catch {
    return null
  }
}

/** Flatten examplesByEventName into a list of { eventName, ...ev } */
function flattenExamples(examplesByEventName) {
  if (!examplesByEventName || typeof examplesByEventName !== 'object') return []
  const list = []
  for (const [eventName, examples] of Object.entries(examplesByEventName)) {
    for (const ev of examples || []) {
      list.push({ eventName, ...ev })
    }
  }
  return list.sort((a, b) => (a.time || a.timestamp || 0) - (b.time || b.timestamp || 0))
}

export default function EventJobDetailPage() {
  const params = useParams()
  const jobId = params?.id
  const [run, setRun] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [detailTab, setDetailTab] = useState('events') // 'events' | 'profiles'
  const [eventDetailModal, setEventDetailModal] = useState(null) // event object or null
  const [filterProfile, setFilterProfile] = useState('') // '' = all, or profileId/profileEmail
  const [filterEventName, setFilterEventName] = useState('') // '' = all, or event name

  useEffect(() => {
    setMounted(true)
    setRun(jobId ? loadRunById(jobId) : null)
  }, [jobId])

  const flatEvents = useMemo(() => {
    if (!run) return []
    if (Array.isArray(run.events)) {
      return run.events.length === 0 ? [] : [...run.events].sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0))
    }
    return flattenExamples(run.examplesByEventName)
  }, [run])

  const hasFullEvents = run && Array.isArray(run.events)
  const totalEventsFromSummary = run?.jobSummary?.totalEvents ?? 0
  const showingSampleOnly = !hasFullEvents && totalEventsFromSummary > flatEvents.length

  const uniqueProfiles = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const ev of flatEvents) {
      const id = ev.profileId ?? ev.profileEmail ?? ''
      if (id && !seen.has(id)) {
        seen.add(id)
        out.push({ id, label: ev.profileEmail || ev.profileId || id })
      }
    }
    return out.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
  }, [flatEvents])

  const uniqueEventNames = useMemo(() => {
    const seen = new Set()
    for (const ev of flatEvents) {
      if (ev.eventName) seen.add(ev.eventName)
    }
    return [...seen].sort()
  }, [flatEvents])

  const filteredEvents = useMemo(() => {
    let list = flatEvents
    if (filterProfile) {
      list = list.filter((ev) => (ev.profileId ?? ev.profileEmail) === filterProfile)
    }
    if (filterEventName) {
      list = list.filter((ev) => ev.eventName === filterEventName)
    }
    return list
  }, [flatEvents, filterProfile, filterEventName])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activePage="events" />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!jobId || !run) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activePage="events" />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Job not found</h2>
              <p className="mt-2 text-sm text-gray-500">This run may have been deleted or the link is invalid.</p>
              <Link
                href="/events?tab=jobs"
                className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                ← Back to Jobs
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const summary = run.jobSummary || {}
  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === summary.dateRange)?.label ?? summary.dateRange
  const profileSummaries = run.profileSummaries || (summary.profileEmails || []).map((email, i) => ({
    id: summary.profileIds?.[i] ?? `p${i}`,
    email,
    firstName: null,
    lastName: null,
  }))
  const profileCount = profileSummaries.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="events" />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/events?tab=jobs"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
          >
            ← Back to Jobs
          </Link>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Summary */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">{summary.journeyName ?? 'Event run'}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Run at {run.runAt ? new Date(run.runAt).toLocaleString() : '—'}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="text-xs font-medium text-gray-500 uppercase">Total profiles</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{summary.profilesCount ?? profileCount}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="text-xs font-medium text-gray-500 uppercase">Total events</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{summary.totalEvents ?? 0}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="text-xs font-medium text-gray-500 uppercase">Total journeys</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{summary.journeyCount ?? 0}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="text-xs font-medium text-gray-500 uppercase">Timestamp range</dt>
                  <dd className="mt-1 text-sm text-gray-900">{dateRangeLabel}</dd>
                </div>
              </dl>
              {summary.eventCounts && Object.keys(summary.eventCounts).length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-gray-500 uppercase">Events by type</span>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(summary.eventCounts).map(([name, count]) => (
                      <li
                        key={name}
                        className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800"
                      >
                        {name}: {count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Tabs: Events | Profiles */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-0" aria-label="Job detail tabs">
                <button
                  type="button"
                  onClick={() => setDetailTab('events')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    detailTab === 'events' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Events
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('profiles')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    detailTab === 'profiles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profiles
                </button>
              </nav>
            </div>

            <div className="px-6 py-5">
              {detailTab === 'events' && (
                <div>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Events {hasFullEvents ? `(${filteredEvents.length}${filterProfile || filterEventName ? ` of ${flatEvents.length}` : ''})` : '(sample)'}
                    </h2>
                    {flatEvents.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <span>Profile</span>
                          <select
                            value={filterProfile}
                            onChange={(e) => setFilterProfile(e.target.value)}
                            className="rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">All profiles</option>
                            {uniqueProfiles.map((p) => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <span>Event / metric</span>
                          <select
                            value={filterEventName}
                            onChange={(e) => setFilterEventName(e.target.value)}
                            className="rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">All events</option>
                            {uniqueEventNames.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                  {showingSampleOnly && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
                      This run was saved before the full event list was stored. Showing a sample only ({flatEvents.length} of {totalEventsFromSummary} events). New runs will show all events.
                    </p>
                  )}
                  {filteredEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {flatEvents.length === 0 ? 'No events stored for this run.' : 'No events match the selected filters.'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredEvents.map((ev) => (
                            <tr key={ev.id ?? `${ev.eventName}-${ev.profileEmail ?? ev.profileId}-${ev.time ?? ev.timestamp}`} className="hover:bg-gray-50">
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                                {ev.profileEmail ?? ev.profileId ?? '—'}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{ev.eventName}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                {(ev.time || ev.timestamp) ? new Date(ev.time || ev.timestamp).toLocaleString() : '—'}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => setEventDetailModal(ev)}
                                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                >
                                  View details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'profiles' && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Profiles this job was sent to</h2>
                  <p className="text-xs text-gray-500 mb-4">{profileCount} profile{profileCount !== 1 ? 's' : ''}</p>
                  {profileCount === 0 ? (
                    <p className="text-sm text-gray-500">No profiles recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last name</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {profileSummaries.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{p.email ?? '—'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.firstName ?? '—'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.lastName ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {eventDetailModal && (
                <div
                  className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-center justify-center p-4"
                  onClick={() => setEventDetailModal(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="event-detail-title"
                >
                  <div
                    className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
                      <h3 id="event-detail-title" className="text-lg font-semibold text-gray-900">
                        {eventDetailModal.eventName} — Event properties
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEventDetailModal(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        aria-label="Close"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
                      <dl className="space-y-3">
                        {Object.entries(eventDetailModal).filter(([k]) => k !== 'eventName').map(([key, value]) => (
                          <div key={key} className="border-b border-gray-100 pb-2 last:border-0">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{key}</dt>
                            <dd className="text-sm text-gray-900 break-words">
                              {typeof value === 'object' && value !== null ? (
                                <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                              ) : (
                                String(value)
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
