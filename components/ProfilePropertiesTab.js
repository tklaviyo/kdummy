'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getActiveApiKey } from '@/lib/storage'
import { useConfirm } from '@/context/ConfirmContext'
import { groupProperties, PROFILE_PROPERTY_GROUPS, getPropertyGroupId } from '@/lib/profilePropertyGroups'

const ProfilePropertiesTab = forwardRef(function ProfilePropertiesTab(
  {
    onPropertiesChange,
    headerRenderedByParent = false,
    initialAction,
    initialPropertyName,
    embeddedForGenerate = false,
    configureHeader = null,
  },
  ref
) {
  const { alert, confirm } = useConfirm()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [activeGroupId, setActiveGroupId] = useState('all')
  const [initialHandled, setInitialHandled] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    original_name: '',
    type: 'string',
    description: '',
    default_value: '',
    options: '',
    required: false,
    group: 'other',
    date_min: '',
    date_max: '',
    date_range_preset: 'last_12_months',
    integer_min: '',
    integer_max: '',
    array_min_items: '',
    array_max_items: '',
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (properties.length === 0) return
    const grouped = groupProperties(properties)
    const hasActive = activeGroupId === 'all' || grouped.some((g) => g.groupId === activeGroupId)
    if (!hasActive && grouped.length > 0) setActiveGroupId('all')
  }, [properties, activeGroupId])

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

  const handleAdd = () => {
    setEditingProperty(null)
    setFormData({
      name: '',
      original_name: '',
      type: 'string',
      description: '',
      default_value: '',
      options: '',
      required: false,
      group: 'other',
      date_min: '',
      date_max: '',
      date_range_preset: 'last_12_months',
      integer_min: '',
      integer_max: '',
      array_min_items: '',
      array_max_items: '',
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
      required: property.required || false,
      group: getPropertyGroupId(property),
      date_min: property.date_min || '',
      date_max: property.date_max || '',
      date_range_preset: property.date_range_preset || (property.date_min || property.date_max ? 'custom' : 'last_12_months'),
      integer_min: property.integer_min ?? '',
      integer_max: property.integer_max ?? '',
      array_min_items: property.array_min_items != null ? String(property.array_min_items) : '',
      array_max_items: property.array_max_items != null ? String(property.array_max_items) : '',
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
      options: formData.options ? formData.options.split(',').map(o => o.trim()).filter(o => o) : null,
      catalog_source: null,
      catalog_template: null,
      object_property_mapping: null,
      required: formData.required,
      group: formData.group || 'other',
      date_min: formData.date_range_preset === 'custom' ? (formData.date_min || null) : null,
      date_max: formData.date_range_preset === 'custom' ? (formData.date_max || null) : null,
      date_range_preset: formData.type === 'date' ? (formData.date_range_preset || null) : null,
      integer_min: formData.integer_min !== '' ? formData.integer_min : null,
      integer_max: formData.integer_max !== '' ? formData.integer_max : null,
      array_min_items: formData.array_min_items !== '' ? parseInt(formData.array_min_items, 10) : null,
      array_max_items: formData.array_max_items !== '' ? parseInt(formData.array_max_items, 10) : null,
    }

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

  const handleSelectAll = async () => {
    const allEnabled = properties.every((p) => p.enabled !== false)
    const newEnabled = !allEnabled
    try {
      for (const p of properties) {
        await fetchWithApiKey(`/api/profile-properties?name=${encodeURIComponent(p.name)}`, {
          method: 'PATCH',
          body: JSON.stringify({ data: { enabled: newEnabled } }),
        })
      }
      fetchProperties()
      if (onPropertiesChange) onPropertiesChange()
    } catch (error) {
      await alert(`Error: ${error.message}`)
    }
  }

  const isDefaultProperty = (property) => {
    const defaultNames = ['gender', 'birthday', 'marketing_preferences', 'loyalty_number', 'loyalty_tier', 'signup_date']
    return defaultNames.includes(property.original_name || property.name)
  }

  useImperativeHandle(
    ref,
    () => ({
      openAddModal: () => {
        handleAdd()
      },
      openEditModal: (propertyName) => {
        if (!propertyName) return
        const prop = properties.find(
          (p) =>
            (p.original_name || p.name) === propertyName ||
            p.name === propertyName
        )
        if (prop) {
          handleEdit(prop)
        }
      },
      refreshProperties: () => {
        fetchProperties()
      },
    }),
    [properties]
  )

  // When navigated from Generate tab with an initial action, open the appropriate modal once.
  useEffect(() => {
    if (initialHandled) return
    if (!initialAction) return

    if (initialAction === 'add') {
      handleAdd()
      setInitialHandled(true)
      return
    }
    if (initialAction === 'edit' && initialPropertyName && properties.length > 0) {
      const prop = properties.find((p) => (p.original_name || p.name) === initialPropertyName || p.name === initialPropertyName)
      if (prop) {
        handleEdit(prop)
        setInitialHandled(true)
      }
    }
  }, [initialAction, initialPropertyName, properties, initialHandled])

  return (
    <div>
      {/* Add/Edit Modal (always available, even when list is hidden for Generate tab) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {PROFILE_PROPERTY_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Category for organising this property on Generate and Configure screens.</p>
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

                {false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Map to catalog field</label>
                    <select
                      value={formData.object_property_mapping}
                      onChange={(e) => setFormData({ ...formData, object_property_mapping: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select...</option>
                      <option value="id">id</option>
                      <option value="name">name</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Profile property values will use the catalog item’s id or name. Used when generating multiple profiles.</p>
                  </div>
                )}

                {/* Options for string type */}
                {formData.type === 'string' && (
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

                {/* Options for array type */}
                {formData.type === 'array' && (
                  <div>
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
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Array size (min / max items)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Min items</label>
                          <input
                            type="number"
                            min={0}
                            value={formData.array_min_items}
                            onChange={(e) => setFormData({ ...formData, array_min_items: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max items</label>
                          <input
                            type="number"
                            min={0}
                            value={formData.array_max_items}
                            onChange={(e) => setFormData({ ...formData, array_max_items: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 5"
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Leave empty for no constraint when generating</p>
                    </div>
                  </div>
                )}

                {/* Date range configuration: preset or custom */}
                {formData.type === 'date' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date range</label>
                    <select
                      value={formData.date_range_preset}
                      onChange={(e) => setFormData({ ...formData, date_range_preset: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="last_3_months">Last 3 months</option>
                      <option value="last_6_months">Last 6 months</option>
                      <option value="last_12_months">Last 12 months</option>
                      <option value="last_24_months">Last 24 months</option>
                      <option value="custom">Custom date range</option>
                    </select>
                    {formData.date_range_preset === 'custom' && (
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minimum date</label>
                          <input
                            type="date"
                            value={formData.date_min}
                            onChange={(e) => setFormData({ ...formData, date_min: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Maximum date</label>
                          <input
                            type="date"
                            value={formData.date_max}
                            onChange={(e) => setFormData({ ...formData, date_max: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.date_range_preset === 'custom' ? 'Set min/max dates for generated values.' : 'Generated dates will fall within the selected range.'}
                    </p>
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

      {/* Properties List - wrapped in card when configureHeader provided */}
      <div className={embeddedForGenerate ? 'hidden' : ''}>
        {configureHeader ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
              {configureHeader}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap justify-end mb-4">
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Add property
                </button>
              </div>
              {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No properties configured. Click "Add Property" to create one.
          </div>
        ) : (() => {
          const grouped = groupProperties(properties)
          const currentProps = activeGroupId === 'all' ? properties : (grouped.find((g) => g.groupId === activeGroupId) || { properties: [] }).properties
          const navItems = [{ id: 'all', label: 'All properties' }, ...grouped.map((g) => ({ id: g.groupId, label: g.label }))]
          const mid = Math.ceil(currentProps.length / 2)
          const leftProps = currentProps.slice(0, mid)
          const rightProps = currentProps.slice(mid)
          const renderCard = (property) => {
            const isDefault = isDefaultProperty(property)
            const nameChanged = property.original_name && property.name !== property.original_name
            const isEnabled = property.enabled !== false
            const hasDefaultValue = property.default_value != null && property.default_value !== ''
            const dateRangePresetLabels = {
              last_3_months: 'Last 3 months',
              last_6_months: 'Last 6 months',
              last_12_months: 'Last 12 months',
              last_24_months: 'Last 24 months',
              custom: 'Custom range',
            }
            const dateConfig =
              property.type === 'date' &&
              (property.date_range_preset || property.date_min || property.date_max)
                ? property.date_range_preset === 'custom' && (property.date_min || property.date_max)
                  ? `${property.date_min || '…'} to ${property.date_max || '…'}`
                  : dateRangePresetLabels[property.date_range_preset] || property.date_range_preset || 'Custom'
                : null
            const integerConfig =
              (property.type === 'integer' || property.type === 'decimal') &&
              (property.integer_min != null || property.integer_max != null)
                ? `${property.integer_min ?? '—'} to ${property.integer_max ?? '—'}`
                : null
            const arraySizeConfig =
              property.type === 'array' &&
              (property.array_min_items != null || property.array_max_items != null)
                ? `${property.array_min_items ?? 0}–${property.array_max_items ?? '?'} items`
                : null
            const optionsConfig =
              property.options && Array.isArray(property.options) && property.options.length > 0
                ? property.options.join(', ')
                : null

            return (
              <div
                key={property.name}
                className="border border-gray-200 rounded-lg p-4 min-h-[120px] flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{property.name}</span>
                      <span className="text-xs text-gray-500">({property.type})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {isDefault && <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">Default</span>}
                      {nameChanged && <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">Renamed from: {property.original_name}</span>}
                    </div>
                  </div>
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
                </div>
                <dl className="space-y-1 text-xs">
                  <div><dt className="inline font-medium text-gray-500">Description: </dt><dd className="inline text-gray-700">{property.description || '—'}</dd></div>
                  {hasDefaultValue && (
                    <div><dt className="inline font-medium text-gray-500">Default value: </dt><dd className="inline text-gray-700">{String(property.default_value)}</dd></div>
                  )}
                  {dateConfig && (
                    <div><dt className="inline font-medium text-gray-500">Date range: </dt><dd className="inline text-gray-700">{dateConfig}</dd></div>
                  )}
                  {integerConfig != null && (
                    <div><dt className="inline font-medium text-gray-500">Range: </dt><dd className="inline text-gray-700">{integerConfig}</dd></div>
                  )}
                  {arraySizeConfig && (
                    <div><dt className="inline font-medium text-gray-500">Array size: </dt><dd className="inline text-gray-700">{arraySizeConfig}</dd></div>
                  )}
                  {optionsConfig && (
                    <div><dt className="inline font-medium text-gray-500">Options: </dt><dd className="inline text-gray-700">{optionsConfig}</dd></div>
                  )}
                </dl>
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
                  <button onClick={() => handleEdit(property)} className="text-xs font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                  {nameChanged && <button onClick={() => handleRevertName(property)} className="text-xs font-medium text-orange-600 hover:text-orange-900">Revert name</button>}
                  {!isDefault && <button onClick={() => handleDelete(property.name)} className="text-xs font-medium text-red-600 hover:text-red-900">Delete</button>}
                </div>
              </div>
            )
          }
          return (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <select
                  value={activeGroupId}
                  onChange={(e) => setActiveGroupId(e.target.value)}
                  aria-label="Property category"
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {navItems.map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
                {properties.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 shrink-0"
                  >
                    {properties.every((p) => p.enabled !== false) ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>
              {currentProps.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No properties in this category.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">{leftProps.map(renderCard)}</div>
                  <div className="space-y-4">{rightProps.map(renderCard)}</div>
                </div>
              )}
            </>
          )
        })()}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
})

export default ProfilePropertiesTab

