import { Suspense } from 'react'
import SettingsPageClient from './SettingsPageClient'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <SettingsPageClient />
    </Suspense>
  )
}
