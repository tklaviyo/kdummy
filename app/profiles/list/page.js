'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilesListPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profiles?tab=list')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  )
}
