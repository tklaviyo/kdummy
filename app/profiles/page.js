'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import ProfilePropertiesTab from '@/components/ProfilePropertiesTab'
import GenerateProfilesTab from '@/components/GenerateProfilesTab'
import { useConfirm } from '@/context/ConfirmContext'
import { fetchWithApiKey } from '@/lib/apiClient'
import { getActiveApiKey } from '@/lib/storage'

export default function ProfilesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { alert, confirm } = useConfirm()
  const tab = searchParams.get('tab') || 'generate'
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [propertiesCount, setPropertiesCount] = useState(0)

  useEffect(() => {
    if (tab === 'list') {
      fetchProfiles()
    } else if (tab === 'configure') {
      fetchPropertiesCount()
    }
  }, [tab])

  const fetchPropertiesCount = async () => {
    try {
      const response = await fetch('/api/profile-properties?include_custom=true')
      const data = await response.json()
      setPropertiesCount((data.data || []).length)
    } catch (error) {
      console.error('Error fetching properties count:', error)
    }
  }

  const fetchProfiles = async () => {
    const apiKey = getActiveApiKey()
    if (!apiKey) {
      setProfiles([])
      return
    }
    setLoading(true)
    try {
      const response = await fetchWithApiKey('/api/profiles?page=1&page_size=500')
      const data = await response.json()
      if (response.ok) {
        setProfiles(data.data || [])
      } else {
        setProfiles([])
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (profileId) => {
    const ok = await confirm('Are you sure you want to delete this profile?', { confirmLabel: 'Delete', danger: true })
    if (!ok) return

    // Note: In a real implementation, you'd call DELETE /api/profiles/:id
    // For now, we'll just refresh
    fetchProfiles()
    await alert('Profile deleted (mock - in real implementation would call API)')
  }

  const handleViewDetails = (profile) => {
    setSelectedProfile(profile)
  }

  const handleTabChange = (newTab) => {
    router.push(`/profiles?tab=${newTab}`)
  }

  const tabs = [
    { id: 'generate', label: 'Generate' },
    { id: 'configure', label: 'Configure' },
    { id: 'list', label: 'Profiles' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="profiles" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profiles</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage dummy profiles with custom properties and identifiers
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => handleTabChange(tabItem.id)}
                  className={`${
                    tab === tabItem.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tabItem.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {tab === 'list' && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Generated Profiles</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    View and manage all generated profiles
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('generate')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Generate New Profile
                </button>
              </div>

              {/* Profiles List */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Profiles ({profiles.length})
                  </h3>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : profiles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {!getActiveApiKey() ? (
                      <p className="mb-4">Set your API key in Settings to view profiles. Generated profiles are stored per account.</p>
                    ) : (
                      <>
                        <p className="mb-4">No profiles generated yet.</p>
                        <button
                          onClick={() => handleTabChange('generate')}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Generate your first profile
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {profiles.map((profile) => (
                          <tr key={profile.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {profile.id.substring(0, 12)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {profile.attributes.first_name} {profile.attributes.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {profile.attributes.email || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {profile.attributes.phone_number || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {profile.attributes.location 
                                ? `${profile.attributes.location.city}, ${profile.attributes.location.region}` 
                                : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleViewDetails(profile)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDelete(profile.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'configure' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Configure Properties ({propertiesCount})</h2>
              </div>
              <div className="p-6">
                <ProfilePropertiesTab onPropertiesChange={fetchPropertiesCount} />
              </div>
            </div>
          )}

          {tab === 'generate' && (
            <div>
              <GenerateProfilesTab />
            </div>
          )}
        </div>
      </main>

      {/* Profile Details Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Profile Details</h3>
              <button 
                onClick={() => setSelectedProfile(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">ID:</span>
                      <p className="text-sm font-mono text-gray-900">{selectedProfile.id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Name:</span>
                      <p className="text-sm text-gray-900">
                        {selectedProfile.attributes.first_name} {selectedProfile.attributes.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Email:</span>
                      <p className="text-sm text-gray-900">{selectedProfile.attributes.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Phone:</span>
                      <p className="text-sm text-gray-900">{selectedProfile.attributes.phone_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">External ID:</span>
                      <p className="text-sm text-gray-900">{selectedProfile.attributes.external_id || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Locale:</span>
                      <p className="text-sm text-gray-900">{selectedProfile.attributes.locale || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProfile.attributes.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-900">
                      {selectedProfile.attributes.location.address1}
                      {selectedProfile.attributes.location.address2 && `, ${selectedProfile.attributes.location.address2}`}
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedProfile.attributes.location.city}, {selectedProfile.attributes.location.region} {selectedProfile.attributes.location.zip}
                    </p>
                    <p className="text-sm text-gray-900">{selectedProfile.attributes.location.country}</p>
                  </div>
                </div>
              )}

              {selectedProfile.attributes.properties && Object.keys(selectedProfile.attributes.properties).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Properties</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedProfile.attributes.properties).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-xs text-gray-500">{key}:</span>
                          <p className="text-sm text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
