import { Suspense } from 'react'
import EventsPageClient from './EventsPageClient'

export const dynamic = 'force-dynamic'

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <EventsPageClient />
    </Suspense>
  )
}
