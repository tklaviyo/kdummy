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
              Generate realistic profiles, events, and catalog data for demos, testing, and training — without touching production data.
            </p>
            <p className="mt-3 text-sm text-gray-500 max-w-2xl mx-auto">
              Use the sections below together: first define your business context, then create profiles, then generate journeys of events tied to those profiles. For example, you can spin up a demo store with products, a handful of customers, and a few weeks of realistic order history.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Link
              href="/profiles"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profiles</h3>
              <p className="text-gray-600 text-sm">
                Who your customers are.
              </p>
              <ul className="mt-3 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Generate single or multiple dummy profiles with realistic identifiers.</li>
                <li>Apply default and custom profile properties configured in the app.</li>
                <li>Use these profiles as the audience when generating events.</li>
              </ul>
            </Link>

            <Link
              href="/events"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Events</h3>
              <p className="text-gray-600 text-sm">
                What those customers do over time.
              </p>
              <ul className="mt-3 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Choose journeys (ecommerce, booking, subscription) that match your business.</li>
                <li>Generate timelines of events at scale, tied to your generated profiles.</li>
                <li>Preview the exact Klaviyo event payloads that will be sent.</li>
              </ul>
            </Link>

            <Link
              href="/catalog"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Catalog</h3>
              <p className="text-gray-600 text-sm">
                The business context that makes everything look real.
              </p>
              <ul className="mt-3 text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Define products, services, and subscriptions used in event generation.</li>
                <li>Manage locations, loyalty programs, and countries for profiles and events.</li>
                <li>Use this data to drive realistic values in generated profiles and journeys.</li>
              </ul>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

