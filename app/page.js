import Navigation from '@/components/Navigation'
import HomePageClient from '@/components/HomePageClient'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="home" />
      <HomePageClient />
    </div>
  )
}

