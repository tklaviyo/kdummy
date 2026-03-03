'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { fetchWithApiKey } from '@/lib/apiClient'
import { createEmptyItem, getTemplate } from '@/src/catalog/schema.js'
import { validateItem } from '@/src/catalog/validators.js'
import { loadCatalog, loadAllCatalog, upsertCatalogItem, deleteCatalogItem } from '@/src/catalog/storage.js'
import { CatalogFormFields } from '@/src/catalog/CatalogFormFields.js'
import { CreateCatalogModal } from '@/components/CreateCatalogModal'
import { useConfirm } from '@/context/ConfirmContext'

const TEMPLATE_KEYS = ['product', 'service', 'subscription']

export default function DataCatalogPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('products')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'products' || tab === 'locations' || tab === 'loyalty' || tab === 'countries') {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="catalog" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Data Catalog</h1>
            <p className="mt-2 text-sm text-gray-600">
              Configure catalog items (products, services, subscriptions), locations, loyalty programs, and countries used for profile and event generation
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`${
                  activeTab === 'products'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Catalog Items
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`${
                  activeTab === 'locations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Locations
              </button>
              <button
                onClick={() => setActiveTab('loyalty')}
                className={`${
                  activeTab === 'loyalty'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Loyalty
              </button>
              <button
                onClick={() => setActiveTab('countries')}
                className={`${
                  activeTab === 'countries'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Countries
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-lg p-6">
            {activeTab === 'products' && <ProductsServicesTab />}
            {activeTab === 'locations' && <LocationsTab />}
            {activeTab === 'loyalty' && <LoyaltyTab />}
            {activeTab === 'countries' && <CountriesTab />}
          </div>
        </div>
      </main>
    </div>
  )
}

// Catalog Items tab — single table for all types, filter by type
const TYPE_FILTER_ALL = ''
function ProductsServicesTab() {
  const searchParams = useSearchParams()
  const { confirm } = useConfirm()
  const [typeFilter, setTypeFilter] = useState(TYPE_FILTER_ALL) // '' | 'product' | 'service' | 'subscription'
  const [allItems, setAllItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formValues, setFormValues] = useState(null)
  const [errors, setErrors] = useState([])
  const [selectedKeys, setSelectedKeys] = useState(new Set()) // Set of `${_type}:${id}`

  const refreshList = useCallback(() => {
    if (typeof window === 'undefined') return
    setAllItems(loadAllCatalog())
  }, [])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  useEffect(() => {
    if (searchParams.get('create') === '1') setShowCreateModal(true)
  }, [searchParams])

  const items = typeFilter
    ? allItems.filter((i) => i._type === typeFilter)
    : allItems

  const handleEdit = (item) => {
    setFormValues({ ...item })
    setErrors([])
    setShowModal(true)
  }

  const handleSave = () => {
    const templateKey = formValues._type
    const result = validateItem(templateKey, formValues)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    try {
      upsertCatalogItem(templateKey, formValues)
      setShowModal(false)
      setFormValues(null)
      setErrors([])
      refreshList()
    } catch (e) {
      setErrors([{ field: '_', message: e.message || 'Save failed' }])
    }
  }

  const handleDelete = async (item) => {
    const ok = await confirm('Are you sure you want to delete this item?', { confirmLabel: 'Delete', danger: true })
    if (!ok) return
    deleteCatalogItem(item._type, item.id)
    refreshList()
    setShowModal(false)
    setFormValues(null)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      next.delete(`${item._type}:${item.id}`)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) return
    const ok = await confirm(`Delete ${selectedKeys.size} selected item(s)?`, { confirmLabel: 'Delete', danger: true })
    if (!ok) return
    selectedKeys.forEach((key) => {
      const [type, id] = key.split(/:(.*)/)
      deleteCatalogItem(type, id)
    })
    setSelectedKeys(new Set())
    refreshList()
  }

  const itemKey = (item) => `${item._type}:${item.id}`

  const toggleSelect = (item) => {
    const key = itemKey(item)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedKeys.size === items.length) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(items.map(itemKey)))
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Catalog Items</h2>
          <div className="flex gap-2 items-center">
            {selectedKeys.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
              >
                Delete selected ({selectedKeys.size})
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add Catalog Items
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter by type:</span>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setTypeFilter(TYPE_FILTER_ALL)}
              className={`px-3 py-1.5 text-sm font-medium border rounded-l-md ${
                typeFilter === TYPE_FILTER_ALL
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {TEMPLATE_KEYS.map((key) => {
              const template = getTemplate(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeFilter(key)}
                  className={`px-3 py-1.5 text-sm font-medium border border-l-0 border-gray-300 ${
                    typeFilter === key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${key === TEMPLATE_KEYS[TEMPLATE_KEYS.length - 1] ? 'rounded-r-md' : ''}`}
                >
                  {template.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {typeFilter
            ? `No ${getTemplate(typeFilter).label.toLowerCase()} items. Change filter or click &quot;Create new&quot;.`
            : 'No items. Click &quot;Create new&quot; to add manually or from a template.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedKeys.size === items.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={itemKey(item)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(itemKey(item))}
                      onChange={() => toggleSelect(item)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTemplate(item._type).label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item._type === 'subscription'
                      ? (item.subscriptionInterval || item.paymentInterval
                          ? `${item.subscriptionInterval ?? '—'} / ${item.paymentInterval ?? '—'} • `
                          : '') +
                        (item.currency && item.price != null ? `${item.currency} ${Number(item.price)}` : '—')
                      : `${item.currency || ''} ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price ?? '—'}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
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

      {showModal && formValues && (
        <CatalogItemModal
          templateKey={formValues._type}
          formValues={formValues}
          setFormValues={setFormValues}
          errors={errors}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setFormValues(null)
            setErrors([])
          }}
          onDelete={formValues.id ? () => handleDelete(formValues) : null}
        />
      )}

      <CreateCatalogModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refreshList}
      />
    </div>
  )
}

function CatalogItemModal({
  templateKey,
  formValues,
  setFormValues,
  errors,
  onSave,
  onClose,
  onDelete,
}) {
  const errorByField = {}
  errors.forEach((e) => {
    errorByField[e.field] = e.message
  })

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {formValues.id ? 'Edit' : 'New'} {getTemplate(templateKey).label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {errorByField['_'] && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {errorByField['_']}
            </div>
          )}
          <CatalogFormFields
            templateKey={templateKey}
            formValues={formValues}
            setFormValues={setFormValues}
            errors={errors}
          />
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Locations Tab Component
function LocationsTab() {
  const { alert, confirm } = useConfirm()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({ name: '', address: '' })
  const [selectedItems, setSelectedItems] = useState(new Set())

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const response = await fetchWithApiKey('/api/data-catalog?type=locations')
      const data = await response.json()
      setLocations(data.data || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      await alert('Please select locations to delete')
      return
    }

    const ok = await confirm(`Are you sure you want to delete ${selectedItems.size} location(s)?`, { confirmLabel: 'Delete', danger: true })
    if (!ok) return

    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetchWithApiKey(`/api/data-catalog?type=locations&id=${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)
      await alert('Locations deleted successfully')
      setSelectedItems(new Set())
      fetchLocations()
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const handleAdd = () => {
    setEditingLocation(null)
    setFormData({ name: '', address: '' })
    setShowAddModal(true)
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData({ name: location.name || '', address: location.address || '' })
    setShowAddModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !String(formData.name).trim()) {
      await alert('Location name is required')
      return
    }

    try {
      const url = '/api/data-catalog'
      const method = editingLocation ? 'PUT' : 'POST'
      const item = { name: String(formData.name).trim(), address: formData.address ? String(formData.address).trim() : '' }
      if (editingLocation?.id) item.id = editingLocation.id

      const response = await fetchWithApiKey(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'locations',
          item,
          id: editingLocation?.id
        })
      })

      if (response.ok) {
        await alert('Location saved successfully')
        fetchLocations()
        setShowAddModal(false)
      } else {
        const error = await response.json()
        await alert(error.errors?.[0]?.detail || 'Failed to save location')
      }
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const handleDelete = async (location) => {
    const ok = await confirm(`Are you sure you want to delete ${location.name}?`, { confirmLabel: 'Delete', danger: true })
    if (!ok) return

    try {
      const response = await fetchWithApiKey(`/api/data-catalog?type=locations&id=${location.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await alert('Location deleted successfully')
        fetchLocations()
      } else {
        const error = await response.json()
        await alert(error.errors?.[0]?.detail || 'Failed to delete location')
      }
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const toggleItemSelection = (id) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === locations.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(locations.map(loc => loc.id)))
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage locations used for profile address and phone number generation
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Delete Selected ({selectedItems.size})
            </button>
          )}
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            Add Location
          </button>
        </div>
      </div>


      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No locations found. Add a location to use in events and profile generation.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === locations.length && locations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(location.id)}
                      onChange={() => toggleItemSelection(location.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(location)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(location)}
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

      {/* Add / Edit Modal */}
      {showAddModal && (
        <LocationModal
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={() => setShowAddModal(false)}
          editingLocation={editingLocation}
        />
      )}
    </div>
  )
}

// Loyalty Tab Component
function LoyaltyTab() {
  const [loyalty, setLoyalty] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLoyalty()
  }, [])

  const fetchLoyalty = async () => {
    setLoading(true)
    try {
      const response = await fetchWithApiKey('/api/data-catalog?type=loyalty')
      const data = await response.json()
      setLoyalty(data.data || null)
    } catch (error) {
      console.error('Error fetching loyalty:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Loyalty Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure loyalty tiers, points thresholds, and reward levels
        </p>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Loyalty configuration interface coming soon...
        </div>
      )}
    </div>
  )
}

// Countries Tab Component (keeping existing implementation)
function CountriesTab() {
  const { alert, confirm } = useConfirm()
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCountry, setEditingCountry] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone_prefix: '+1',
    locale: 'en-US',
    currency: 'USD',
    timezone: 'UTC',
    phone_format: {
      length: 10,
      area_code_length: 3,
      format: 'XXX-XXX-XXXX'
    },
    address_format: {
      has_state: true,
      state_label: 'State',
      zip_label: 'ZIP Code',
      zip_format: 'XXXXX',
      zip_required: true
    }
  })

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    setLoading(true)
    try {
      const response = await fetchWithApiKey('/api/countries')
      const data = await response.json()
      setCountries(data.data || [])
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCountry(null)
    setFormData({
      name: '',
      code: '',
      phone_prefix: '+1',
      locale: 'en-US',
      currency: 'USD',
      timezone: 'UTC',
      phone_format: {
        length: 10,
        area_code_length: 3,
        format: 'XXX-XXX-XXXX'
      },
      address_format: {
        has_state: true,
        state_label: 'State',
        zip_label: 'ZIP Code',
        zip_format: 'XXXXX',
        zip_required: true
      }
    })
    setShowAddModal(true)
  }

  const handleEdit = async (country) => {
    if (country.is_default) {
      await alert('Default countries cannot be edited')
      return
    }
    setEditingCountry(country)
    setFormData({
      name: country.name,
      code: country.code,
      phone_prefix: country.phone_prefix,
      locale: country.locale,
      currency: country.currency,
      timezone: country.timezone,
      phone_format: country.phone_format,
      address_format: country.address_format
    })
    setShowAddModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      await alert('Country name and code are required')
      return
    }

    try {
      const url = editingCountry 
        ? `/api/countries?code=${encodeURIComponent(editingCountry.code)}`
        : '/api/countries'
      
      const method = editingCountry ? 'PUT' : 'POST'
      
      const response = await fetchWithApiKey(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: formData }),
      })

      if (response.ok) {
        await alert('Country saved successfully')
        fetchCountries()
        setShowAddModal(false)
      } else {
        const error = await response.json()
        await alert(error.errors?.[0]?.detail || 'Failed to save country')
      }
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const handleDelete = async (country) => {
    if (country.is_default) {
      await alert('Default countries cannot be deleted')
      return
    }

    const ok = await confirm(`Are you sure you want to delete ${country.name}?`, { confirmLabel: 'Delete', danger: true })
    if (!ok) return

    try {
      const response = await fetchWithApiKey(`/api/countries?code=${encodeURIComponent(country.code)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await alert('Country deleted successfully')
        fetchCountries()
      } else {
        const error = await response.json()
        await alert(error.errors?.[0]?.detail || 'Failed to delete country')
      }
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Countries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage countries used for phone numbers, addresses, and locale settings. Default countries cannot be modified.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm"
        >
          Add Country
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Prefix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locale</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {countries.map((country) => (
                <tr key={country.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{country.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.phone_prefix}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.locale}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {country.is_default ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Default</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Custom</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={country.enabled !== false}
                        onChange={async (e) => {
                          try {
                            const response = await fetchWithApiKey(`/api/countries?code=${encodeURIComponent(country.code)}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ enabled: e.target.checked }),
                            })

                            if (response.ok) {
                              fetchCountries()
                            } else {
                              const error = await response.json()
                              await alert(error.errors?.[0]?.detail || 'Failed to update country')
                            }
                          } catch (error) {
                            await alert(`Error: ${error.message}`)
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-xs">{country.enabled !== false ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!country.is_default && (
                      <>
                        <button
                          onClick={() => handleEdit(country)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(country)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal - keeping the existing implementation from the original file */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCountry ? 'Edit Country' : 'Add Country'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Code * (ISO 3166-1 alpha-2)</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="US"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Prefix</label>
                    <input
                      type="text"
                      value={formData.phone_prefix}
                      onChange={(e) => setFormData({ ...formData, phone_prefix: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
                    <input
                      type="text"
                      value={formData.locale}
                      onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="en-US"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                      maxLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="USD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="America/New_York"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Phone Format</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Total Length</label>
                      <input
                        type="number"
                        value={formData.phone_format.length}
                        onChange={(e) => setFormData({
                          ...formData,
                          phone_format: { ...formData.phone_format, length: parseInt(e.target.value) || 10 }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Area Code Length</label>
                      <input
                        type="number"
                        value={formData.phone_format.area_code_length}
                        onChange={(e) => setFormData({
                          ...formData,
                          phone_format: { ...formData.phone_format, area_code_length: parseInt(e.target.value) || 3 }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Format Pattern</label>
                      <input
                        type="text"
                        value={formData.phone_format.format}
                        onChange={(e) => setFormData({
                          ...formData,
                          phone_format: { ...formData.phone_format, format: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        placeholder="XXX-XXX-XXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Address Format</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.address_format.has_state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address_format: { ...formData.address_format, has_state: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Has State/Province Field</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">State Label</label>
                        <input
                          type="text"
                          value={formData.address_format.state_label}
                          onChange={(e) => setFormData({
                            ...formData,
                            address_format: { ...formData.address_format, state_label: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">ZIP Label</label>
                        <input
                          type="text"
                          value={formData.address_format.zip_label}
                          onChange={(e) => setFormData({
                            ...formData,
                            address_format: { ...formData.address_format, zip_label: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">ZIP Format Pattern (X = digit, space = space)</label>
                      <input
                        type="text"
                        value={formData.address_format.zip_format}
                        onChange={(e) => setFormData({
                          ...formData,
                          address_format: { ...formData.address_format, zip_format: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        placeholder="XXXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingCountry ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Location Modal Component
function LocationModal({ formData, setFormData, onSave, onClose, editingLocation }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
      <div className="relative top-16 mx-auto w-full max-w-md border shadow-lg rounded-lg bg-white overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">Name is used in events; address is optional.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Store"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 123 Main St, City, Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingLocation ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


