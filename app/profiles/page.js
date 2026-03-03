import { Suspense } from 'react'
import ProfilesPageClient from './ProfilesPageClient'

export const dynamic = 'force-dynamic'

export default function ProfilesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <ProfilesPageClient />
    </Suspense>
  )
}
