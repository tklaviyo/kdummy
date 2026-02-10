'use client'

import { useState, useEffect } from 'react'
import { getActiveApiKey } from '@/lib/storage'
import { useConfirm } from '@/context/ConfirmContext'

export default function ProfilePropertiesTab({ onPropertiesChange }) {
  const { alert, confirm } = useConfirm()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [catalogData, setCatalogData] = useState({
    products: [],
    services: [],
    subscriptions: [],
    locations: [],
    reservations: [],
    loyalty: [],
  })
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    original_name: '',
    type: 'string',
    description: '',
    default_value: '',
    options: '',
    data_source: 'static', // 'static' or catalog source
    object_property_mapping: '',
    required: false,
    // For date range
    date_min: '',
    date_max: '',
    // For integer range
    integer_min: '',
    integer_max: '',
  })

  useEffect(() => {
    fetchProperties()
    fetchCatalogData()
  }, [])

  // Helper to add API key to fetch requests
  const fetchWithApiKey = async (url, options = {}) => {
    const apiKey = getActiveApiKey()
    if (!apiKey) {
      throw new Error('No active API key. Please configure an account in Settings.')
    }
    
    const urlObj = new URL(url, window.location.origin)
    urlObj.searchParams.set('api_key', apiKey)
    
    const response = await fetch(urlObj.toString(), {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ errors: [{ detail: 'Unknown error' }] }))
      throw new Error(error.errors?.[0]?.detail || 'Request failed')
    }
    
    return response.json()
  }

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const data = await fetchWithApiKey('/api/profile-properties?include_custom=true')
      setProperties(data.data || [])
      if (onPropertiesChange) {
        onPropertiesChange()
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      await alert(error.message || 'Failed to fetch properties. Please ensure you have an active API key configured in Settings.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCatalogData = async () => {
    try {
      const data = await fetchWithApiKey('/api/data-catalog')
      setCatalogData({
        products: data.data.products || [],
        services: data.data.services || [],
        subscriptions: data.data.subscriptions || [],
        locations: data.data.locations || [],
        reservations: data.data.reservations || [],
        loyalty: data.data.loyalty || [],
      })
    } catch (error) {
      console.error('Error fetching catalog data:', error)
    }
  }

  const handleAdd = () => {
    setEditingProperty(null)
    setFormData({
      name: '',
      original_name: '',
      type: 'string',
      description: '',
      default_value: '',
      options: '',
      data_source: 'static',
      object_property_mapping: '',
      required: false,
      date_min: '',
      date_max: '',
      integer_min: '',
      integer_max: '',
    })
    setShowAddModal(true)
  }

  const handleEdit = (property) => {
    setEditingProperty(property)
    setFormData({
      name: property.name,
      original_name: property.original_name || property.name,
      type: property.type,
      description: property.description || '',
      default_value: property.default_value || '',
      options: property.options ? property.options.join(', ') : '',
      data_source: property.catalog_source || 'static',
      object_property_mapping: property.object_property_mapping || '',
      required: property.required || false,
      date_min: property.date_min || '',
      date_max: property.date_max || '',
      integer_min: property.integer_min || '',
      integer_max: property.integer_max || '',
    })
    setShowAddModal(true)
  }

  const handleRevertName = async (property) => {
    const ok = await confirm(`Revert property name "${property.name}" back to "${property.original_name || property.name}"?`)
    if (!ok) return

    try {
      const data = await fetchWithApiKey(`/api/profile-properties?old_name=${encodeURIComponent(property.name)}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            ...property,
            name: property.original_name || property.name,
            original_name: property.original_name || property.name,
          }
        }),
      })

      await alert('Property name reverted successfully')
      fetchProperties()
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      await alert('Property name is required')
      return
    }

    const propertyData = {
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
      default_value: formData.default_value || null,
      options: formData.data_source === 'static' && formData.options ? formData.options.split(',').map(o => o.trim()).filter(o => o) : null,
      catalog_source: formData.data_source !== 'static' ? formData.data_source : null,
      object_property_mapping: formData.object_property_mapping.trim() || null,
      required: formData.required,
      date_min: formData.date_min || null,
      date_max: formData.date_max || null,
      integer_min: formData.integer_min || null,
      integer_max: formData.integer_max || null,
    }

    // If editing a default property, include original_name
    if (editingProperty && isDefaultProperty(editingProperty)) {
      propertyData.original_name = formData.original_name
    }

    try {
      if (editingProperty) {
        // Update existing property
        await fetchWithApiKey(`/api/profile-properties?old_name=${encodeURIComponent(editingProperty.name)}`, {
          method: 'PUT',
          body: JSON.stringify({ data: propertyData }),
        })
      } else {
        // Create new property
        await fetchWithApiKey('/api/profile-properties', {
          method: 'POST',
          body: JSON.stringify({ data: propertyData }),
        })
      }

      await alert('Property saved successfully')
      fetchProperties()
      setShowAddModal(false)
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const handleDelete = async (propertyName) => {
    const ok = await confirm(`Are you sure you want to delete the property "${propertyName}"?`, { confirmLabel: 'Delete', danger: true })
    if (!ok) return

    try {
      await fetchWithApiKey(`/api/profile-properties?name=${encodeURIComponent(propertyName)}`, {
        method: 'DELETE',
      })

      await alert('Property deleted successfully')
      fetchProperties()
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const handleToggleEnabled = async (propertyName, currentEnabled) => {
    try {
      await fetchWithApiKey(`/api/profile-properties?name=${encodeURIComponent(propertyName)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          data: {
            enabled: !currentEnabled,
          },
        }),
      })

      fetchProperties()
      if (onPropertiesChange) {
        onPropertiesChange()
      }
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const isDefaultProperty = (property) => {
    const defaultNames = [
      'gender', 'birthday', 'marketing_preferences', 'product_preferences',
      'signup_store', 'favourite_store', 'recent_store', 'signup_date',
      'loyalty_member', 'loyalty_signup_date', 'loyalty_points', 'loyalty_spend',
      'current_loyalty_tier', 'next_loyalty_tier'
    ]
    return defaultNames.includes(property.original_name || property.name)
  }

  const getObjectProperties = (catalogSource) => {
    if (!catalogSource || catalogSource === 'static') return []
    
    const catalog = catalogData[catalogSource]
    if (!catalog || catalog.length === 0) return []
    
    // Get all unique property keys from catalog items
    const allKeys = new Set()
    catalog.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key))
    })
    return Array.from(allKeys)
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Add Property
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProperty ? 'Edit Property' : 'Add Property'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., customer_segment"
                  />
                  {editingProperty && isDefaultProperty(editingProperty) && formData.original_name && formData.name !== formData.original_name && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Original name: {formData.original_name}</span>
                      <button
                        onClick={() => setFormData({ ...formData, name: formData.original_name })}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Revert
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="string">String</option>
                    <option value="integer">Integer</option>
                    <option value="decimal">Decimal</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="array">Array</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows="2"
                    placeholder="Description of this property"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                  <input
                    type="text"
                    value={formData.default_value}
                    onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Default value (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Source *</label>
                  <select
                    value={formData.data_source}
                    onChange={(e) => setFormData({ ...formData, data_source: e.target.value, object_property_mapping: '', options: e.target.value !== 'static' ? '' : formData.options })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="static">Static</option>
                    <option value="products">Products</option>
                    <option value="services">Services</option>
                    <option value="subscriptions">Subscriptions</option>
                    <option value="locations">Locations / Stores</option>
                    <option value="reservations">Reservations (advanced)</option>
                    <option value="loyalty">Loyalty</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.data_source === 'static' 
                      ? 'Static values - configure options below'
                      : 'Dynamic values from Data Catalog - values will be drawn from the chosen catalog source'}
                  </p>
                </div>

                {formData.data_source !== 'static' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Map to Object Property</label>
                    {getObjectProperties(formData.data_source).length > 0 ? (
                      <>
                        <select
                          value={formData.object_property_mapping}
                          onChange={(e) => setFormData({ ...formData, object_property_mapping: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select property...</option>
                          {getObjectProperties(formData.data_source).map(prop => (
                            <option key={prop} value={prop}>{prop}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Map this profile property to a specific field from the catalog object (e.g. id, name, category).</p>
                      </>
                    ) : (
                      <>
                        <select
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-400"
                        >
                          <option>No catalog fields available yet</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          This property will fall back to sensible defaults when generating profiles (e.g. using item name or id)
                          until catalog data is available.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Options for static string/array types - array can also be dynamic */}
                {formData.data_source === 'static' && formData.type === 'string' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add option"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const value = e.target.value.trim()
                            if (value) {
                              const currentOptions = formData.options ? formData.options.split(',').map(o => o.trim()).filter(o => o) : []
                              if (!currentOptions.includes(value)) {
                                setFormData({ ...formData, options: [...currentOptions, value].join(', ') })
                                e.target.value = ''
                              }
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling
                          const value = input.value.trim()
                          if (value) {
                            const currentOptions = formData.options ? formData.options.split(',').map(o => o.trim()).filter(o => o) : []
                            if (!currentOptions.includes(value)) {
                              setFormData({ ...formData, options: [...currentOptions, value].join(', ') })
                              input.value = ''
                            }
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.options ? formData.options.split(',').map((opt, idx) => {
                        const trimmed = opt.trim()
                        if (!trimmed) return null
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                          >
                            {trimmed}
                            <button
                              type="button"
                              onClick={() => {
                                const options = formData.options.split(',').filter((_, i) => i !== idx).join(',')
                                setFormData({ ...formData, options })
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-900"
                            >
                              ×
                            </button>
                          </span>
                        )
                      }) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Leave empty if any value is allowed</p>
                  </div>
                )}

                {/* Options for array type - can be static or dynamic */}
                {formData.type === 'array' && (
                  <div>
                    {formData.data_source === 'static' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Options</label>
                        <div className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            placeholder="Add option"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const value = e.target.value.trim()
                                if (value) {
                                  const currentOptions = formData.options ? formData.options.split(',').map(o => o.trim()).filter(o => o) : []
                                  if (!currentOptions.includes(value)) {
                                    setFormData({ ...formData, options: [...currentOptions, value].join(', ') })
                                    e.target.value = ''
                                  }
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.target.previousElementSibling
                              const value = input.value.trim()
                              if (value) {
                                const currentOptions = formData.options ? formData.options.split(',').map(o => o.trim()).filter(o => o) : []
                                if (!currentOptions.includes(value)) {
                                  setFormData({ ...formData, options: [...currentOptions, value].join(', ') })
                                  input.value = ''
                                }
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.options ? formData.options.split(',').map((opt, idx) => {
                            const trimmed = opt.trim()
                            if (!trimmed) return null
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                              >
                                {trimmed}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const options = formData.options.split(',').filter((_, i) => i !== idx).join(',')
                                    setFormData({ ...formData, options })
                                  }}
                                  className="ml-2 text-indigo-600 hover:text-indigo-900"
                                >
                                  ×
                                </button>
                              </span>
                            )
                          }) : null}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Add fixed options for array values</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">Array will be populated dynamically from the selected Data Catalog source</p>
                    )}
                  </div>
                )}

                {/* Date range configuration */}
                {formData.type === 'date' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range (Optional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum Date</label>
                        <input
                          type="date"
                          value={formData.date_min}
                          onChange={(e) => setFormData({ ...formData, date_min: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum Date</label>
                        <input
                          type="date"
                          value={formData.date_max}
                          onChange={(e) => setFormData({ ...formData, date_max: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Leave empty to generate random dates without constraints</p>
                  </div>
                )}

                {/* Integer range configuration */}
                {formData.type === 'integer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Integer Range (Optional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum Value</label>
                        <input
                          type="number"
                          value={formData.integer_min}
                          onChange={(e) => setFormData({ ...formData, integer_min: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., 0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum Value</label>
                        <input
                          type="number"
                          value={formData.integer_max}
                          onChange={(e) => setFormData({ ...formData, integer_max: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., 100"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Leave empty to generate random integers without constraints</p>
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Required</span>
                  </label>
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
                    {editingProperty ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No properties configured. Click "Add Property" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapping</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => {
                  const isDefault = isDefaultProperty(property)
                  const nameChanged = property.original_name && property.name !== property.original_name
                  const isEnabled = property.enabled !== false // Default to true if undefined
                  return (
                    <tr key={property.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(property.name, isEnabled)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                          role="switch"
                          aria-checked={isEnabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        {isDefault && (
                          <div className="text-xs text-indigo-600">Default</div>
                        )}
                        {nameChanged && (
                          <div className="text-xs text-orange-600">Renamed from: {property.original_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{property.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.catalog_source ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            {property.catalog_source}
                          </span>
                        ) : (
                          <span className="text-gray-400">Static</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.object_property_mapping ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {property.object_property_mapping}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(property)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        {nameChanged && (
                          <button
                            onClick={() => handleRevertName(property)}
                            className="text-orange-600 hover:text-orange-900 mr-4"
                          >
                            Revert Name
                          </button>
                        )}
                        {!isDefault && (
                          <button
                            onClick={() => handleDelete(property.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

