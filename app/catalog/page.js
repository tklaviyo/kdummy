import { Suspense } from 'react'
import DataCatalogPageClient from './DataCatalogPageClient'

export const dynamic = 'force-dynamic'

export default function DataCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <DataCatalogPageClient />
    </Suspense>
  )
}
