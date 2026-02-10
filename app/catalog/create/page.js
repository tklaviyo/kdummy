'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CatalogCreatePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/catalog?tab=products&create=1')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Redirecting to Data Catalog…</p>
    </div>
  )
}
