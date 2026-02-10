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
              Quickly create personalised dummy data for demo and educational purposes
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Link
              href="/profiles"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profiles</h3>
              <p className="text-gray-600">
                Create and manage dummy profiles with custom properties and identifiers
              </p>
            </Link>

            <Link
              href="/events"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Events</h3>
              <p className="text-gray-600">
                Generate events from templates or create custom events from scratch
              </p>
            </Link>

            <Link
              href="/catalog"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Catalog</h3>
              <p className="text-gray-600">
                Configure loyalty programs, locations, products, and reservations for profile and event generation
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

