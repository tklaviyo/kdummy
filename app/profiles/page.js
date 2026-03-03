'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [selectedProfileIds, setSelectedProfileIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(null) // null until after mount to avoid hydration mismatch
  const propertiesTabRef = useRef(null)

  useEffect(() => {
    setHasApiKey(!!getActiveApiKey())
  }, [])

  useEffect(() => {
    if (tab === 'list') {
      fetchProfiles()
    } else if (tab === 'configure') {
      fetchPropertiesCount()
    }
  }, [tab])

  const fetchPropertiesCount = async () => {
    try {
      const response = await fetchWithApiKey('/api/profile-properties?include_custom=true')
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

  const deleteProfilesByIds = useCallback(async (ids) => {
    if (ids.length === 0) return
    setDeleting(true)
    try {
      const res = await fetchWithApiKey('/api/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => !ids.includes(p.id)))
        setSelectedProfileIds((prev) => {
          const next = new Set(prev)
          ids.forEach((id) => next.delete(id))
          return next
        })
        if (selectedProfile && ids.includes(selectedProfile.id)) setSelectedProfile(null)
        await alert(`Deleted ${ids.length} profile(s).`)
      } else {
        const data = await res.json().catch(() => ({}))
        await alert(data?.errors?.[0]?.detail || 'Failed to delete profiles.')
      }
    } catch (e) {
      await alert(e?.message || 'Failed to delete profiles.')
    } finally {
      setDeleting(false)
    }
  }, [selectedProfile, alert])

  const handleDelete = async (profileId) => {
    const ok = await confirm('Are you sure you want to delete this profile?', { confirmLabel: 'Delete', danger: true })
    if (!ok) return
    await deleteProfilesByIds([profileId])
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedProfileIds)
    if (ids.length === 0) return
    const ok = await confirm(`Delete ${ids.length} selected profile(s)?`, { confirmLabel: 'Delete', danger: true })
    if (!ok) return
    await deleteProfilesByIds(ids)
  }

  const toggleSelectAll = useCallback(() => {
    setSelectedProfileIds((prev) => {
      if (prev.size === profiles.length) return new Set()
      return new Set(profiles.map((p) => p.id))
    })
  }, [profiles.length])

  const toggleSelectProfile = useCallback((profileId) => {
    setSelectedProfileIds((prev) => {
      const next = new Set(prev)
      if (next.has(profileId)) next.delete(profileId)
      else next.add(profileId)
      return next
    })
  }, [])

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
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
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
              <div className="border-t border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Profiles ({profiles.length})
                  </h3>
                  {selectedProfileIds.size > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{selectedProfileIds.size} selected</span>
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        disabled={deleting}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting ? 'Deleting…' : 'Delete selected'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProfileIds(new Set())}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : profiles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {hasApiKey === false || hasApiKey === null ? (
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
                          <th className="px-4 py-3 text-left w-10">
                            <input
                              type="checkbox"
                              checked={profiles.length > 0 && selectedProfileIds.size === profiles.length}
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              aria-label="Select all profiles"
                            />
                          </th>
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
                            <td className="px-4 py-4 whitespace-nowrap w-10">
                              <input
                                type="checkbox"
                                checked={selectedProfileIds.has(profile.id)}
                                onChange={() => toggleSelectProfile(profile.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                aria-label={`Select ${profile.attributes?.email || profile.id}`}
                              />
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

          {/* Properties configuration component is always mounted so its modal can be used from Generate tab. */}
          <ProfilePropertiesTab
            ref={propertiesTabRef}
            headerRenderedByParent={tab === 'configure'}
            onPropertiesChange={tab === 'configure' ? fetchPropertiesCount : undefined}
            initialAction={searchParams.get('action')}
            initialPropertyName={searchParams.get('property')}
            embeddedForGenerate={tab !== 'configure'}
            configureHeader={tab === 'configure' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900">Custom Properties ({propertiesCount})</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Define default property settings here. These settings drive what is available and how values are generated on the Generate tab.
                </p>
              </>
            ) : null}
          />

          {tab === 'generate' && (
            <div>
              <GenerateProfilesTab
                onAddCustomProperty={() => propertiesTabRef.current?.openAddModal?.()}
                onEditCustomProperty={(propertyName) =>
                  propertiesTabRef.current?.openEditModal?.(propertyName)
                }
              />
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
