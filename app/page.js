import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="home" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              K:Dummy
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Quickly spin up realistic demo data for Klaviyo — without touching production.
            </p>
            <p className="mt-3 text-sm text-gray-500 max-w-2xl mx-auto">
              Connect a Klaviyo account, create a few demo customers, then generate journeys of events powered by your own products and locations.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              1. Connect a Klaviyo account · 2. Create profiles · 3. Create events · 4. Tune your data catalog
            </span>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Link
              href="/profiles"
              className="group relative block p-6 bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 14a4 4 0 018 0v1H4v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700">Create Profiles</h3>
                  <p className="text-sm text-gray-600">Spin up realistic customers in seconds.</p>
                </div>
              </div>
              <ul className="mt-4 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Generate single or bulk profiles with realistic identifiers and locations.</li>
                <li>Apply default and custom properties you configure in the app.</li>
              </ul>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                  Create profiles
                </span>
              </div>
            </Link>

            <Link
              href="/events"
              className="group relative block p-6 bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700">Create Events</h3>
                  <p className="text-sm text-gray-600">Bring those customers to life with journeys.</p>
                </div>
              </div>
              <ul className="mt-4 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Choose prebuilt journeys (orders, bookings, subscriptions) that match your business.</li>
                <li>Generate timelines of events tied to your demo profiles.</li>
              </ul>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                  Create events
                </span>
              </div>
            </Link>

            <Link
              href="/catalog"
              className="group relative block p-6 bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M4 5c0-1.657 2.686-3 6-3s6 1.343 6 3-2.686 3-6 3S4 6.657 4 5z" />
                    <path d="M4 9c0 1.657 2.686 3 6 3s6-1.343 6-3v2c0 1.657-2.686 3-6 3s-6-1.343-6-3V9z" />
                    <path d="M4 13c0 1.657 2.686 3 6 3s6-1.343 6-3v2c0 1.657-2.686 3-6 3s-6-1.343-6-3v-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">Data Catalog</h3>
                  <p className="text-sm text-gray-600">Products, services, and locations that power everything.</p>
                </div>
              </div>
              <ul className="mt-4 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Define products, services, and subscriptions used in profiles and events.</li>
                <li>Manage locations, loyalty, and countries so everything feels like a real brand.</li>
              </ul>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                  Open data catalog
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

