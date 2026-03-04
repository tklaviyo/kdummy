'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAccounts, getActiveApiKey } from '@/lib/storage'

export default function HomePageClient() {
  const [hasAccount, setHasAccount] = useState(null)
  const [activeKey, setActiveKey] = useState(null)

  useEffect(() => {
    const accounts = getAccounts()
    const active = getActiveApiKey()
    setHasAccount(accounts.length > 0)
    setActiveKey(active)
  }, [])

  const isConnected = hasAccount && activeKey

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Hero with logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <img src="/logo.svg" alt="" className="h-14 w-14 rounded-xl object-contain" aria-hidden />
              <span className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
                K:Dummy
              </span>
            </div>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Sample data generator for Klaviyo profiles, events, and catalog records.
            </p>
          </div>

          {/* Connection prompt when no account — prominent container, single CTA */}
          {!isConnected && (
            <div className="mt-10 rounded-xl border-2 border-indigo-200 bg-indigo-50/80 p-8 sm:p-10 text-center max-w-xl mx-auto">
              <p className="text-xl sm:text-2xl font-medium text-gray-900">
                Connect a Klaviyo account to get started.
              </p>
              <Link
                href="/settings?tab=accounts"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Connect account
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}

          {/* Cards — always visible so customers see what the app does (no buttons; only CTA is Connect account) */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 14a4 4 0 018 0v1H4v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Profiles</h3>
                  <p className="text-base text-gray-700">Generate sample customer profiles for testing and demos.</p>
                </div>
              </div>
              <ul className="mt-4 text-base text-gray-700 space-y-1 list-disc list-inside flex-1">
                <li>Create single or bulk profiles with identifiers and locations.</li>
                <li>Include default and custom properties defined in Settings.</li>
              </ul>
            </div>

            <div className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Events</h3>
                  <p className="text-base text-gray-700">Generate event timelines for journeys and flows.</p>
                </div>
              </div>
              <ul className="mt-4 text-base text-gray-700 space-y-1 list-disc list-inside flex-1">
                <li>Use prebuilt journeys such as orders, bookings, and subscriptions.</li>
                <li>Run against existing profiles or generate profiles automatically for each run.</li>
              </ul>
            </div>

            <div className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M4 5c0-1.657 2.686-3 6-3s6 1.343 6 3-2.686 3-6 3S4 6.657 4 5z" />
                    <path d="M4 9c0 1.657 2.686 3 6 3s6-1.343 6-3v2c0 1.657-2.686 3-6 3s-6-1.343-6-3V9z" />
                    <path d="M4 13c0 1.657 2.686 3 6 3s6-1.343 6-3v2c0 1.657-2.686 3-6 3s-6-1.343-6-3v-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Data Catalog</h3>
                  <p className="text-base text-gray-700">Maintain products, locations, and other reference data.</p>
                </div>
              </div>
              <ul className="mt-4 text-base text-gray-700 space-y-1 list-disc list-inside flex-1">
                <li>Manage products, services, subscriptions, locations, and loyalty data.</li>
                <li>Use catalog data to make profiles and events consistent with a demo brand.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
