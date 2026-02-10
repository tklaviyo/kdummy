'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import {
  createEmptyItem,
  getTemplate,
  TEMPLATE_TYPES,
  CatalogForm,
  addCatalogItem,
  addCatalogItems,
  buildItemForSave,
  catalogPresets,
  getPresetsByTemplate,
} from '@/src/catalog'
import { useConfirm } from '@/context/ConfirmContext'

const ID_PREFIX = { product: 'PROD', service: 'SERV', subscription: 'SUB' }

export default function CreateProductPage() {
  const router = useRouter()
  const { alert } = useConfirm()
  const [step, setStep] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState('') // 'template' | 'manual'
  const [templateType, setTemplateType] = useState('product')
  const [templateCount, setTemplateCount] = useState(5)
  const [presetId, setPresetId] = useState('')
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleNextFromMethod = async () => {
    if (!selectedMethod) {
      await alert('Please select a method')
      return
    }
    setStep(2)
    if (selectedMethod === 'manual') {
      const empty = createEmptyItem(templateType)
      const preset = presetId ? catalogPresets.find((p) => p.id === presetId) : null
      setFormData({
        ...empty,
        ...(preset?.preset || {}),
        _template: templateType,
      })
    }
  }

  const handleNextFromConfig = async () => {
    if (selectedMethod === 'template') {
      setStep(3)
    } else {
      const template = getTemplate(formData._template)
      const required = [...(template.mandatoryFields || []), ...(template.additionalRequired || [])].filter((f) => f.required)
      const missing = required.filter((f) => {
        const v = formData[f.key]
        return v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
      })
      if (missing.length > 0) {
        await alert(`Required: ${missing.map((f) => f.label).join(', ')}`)
        return
      }
      setStep(3)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      if (selectedMethod === 'template') {
        const prefix = ID_PREFIX[templateType] || 'ITEM'
        const preset = presetId ? catalogPresets.find((p) => p.id === presetId) : null
        const presetValues = preset?.preset || {}
        const items = Array.from({ length: templateCount }, (_, i) => {
          const empty = createEmptyItem(templateType)
          const name = `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} ${i + 1}`
          const id = `${prefix}-${String(i + 1).padStart(3, '0')}`
          return { ...empty, ...presetValues, id, name, _template: templateType }
        })
        addCatalogItems(items)
        await alert(`Created ${templateCount} ${templateType}(s) successfully`)
        router.push('/catalog')
      } else {
        const built = buildItemForSave(formData._template, formData)
        addCatalogItem(built)
        await alert('Item created successfully')
        router.push('/catalog')
      }
    } catch (err) {
      await alert(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const presetsForTemplate = getPresetsByTemplate(templateType)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="catalog" />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => router.push('/catalog')}
              className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Data Catalog
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
            <p className="mt-2 text-sm text-gray-600">Create catalog items from template or manually</p>
          </div>

          <div className="bg-white shadow rounded-lg p-8">
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'}`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className="ml-2 text-sm font-medium">Choose Method</span>
              </div>
              <div className={`flex-1 h-1 max-w-xs ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'}`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className="ml-2 text-sm font-medium">Configure</span>
              </div>
              <div className={`flex-1 h-1 max-w-xs ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'}`}>3</div>
                <span className="ml-2 text-sm font-medium">Review</span>
              </div>
            </div>

            {step === 1 && (
              <div>
                <p className="text-gray-600 mb-6">Choose how you want to create items</p>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <button
                    onClick={() => setSelectedMethod('template')}
                    className={`px-6 py-8 rounded-lg border-2 text-left transition-all ${
                      selectedMethod === 'template' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Create from Template</div>
                    <div className="text-sm text-gray-600">Generate multiple items (Product, Service, or Subscription) with placeholder names.</div>
                  </button>
                  <button
                    onClick={() => setSelectedMethod('manual')}
                    className={`px-6 py-8 rounded-lg border-2 text-left transition-all ${
                      selectedMethod === 'manual' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Create Manually</div>
                    <div className="text-sm text-gray-600">Add one item and fill all fields from the schema.</div>
                  </button>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button onClick={() => router.push('/catalog')} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleNextFromMethod} disabled={!selectedMethod} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Next</button>
                </div>
              </div>
            )}

            {step === 2 && selectedMethod === 'template' && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Template Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template type</label>
                    <select
                      value={templateType}
                      onChange={(e) => { setTemplateType(e.target.value); setPresetId('') }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {TEMPLATE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {presetsForTemplate.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preset (optional)</label>
                      <select
                        value={presetId}
                        onChange={(e) => setPresetId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">None</option>
                        {presetsForTemplate.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of items</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={templateCount}
                      onChange={(e) => setTemplateCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Back</button>
                  <button onClick={handleNextFromConfig} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 2 && selectedMethod === 'manual' && formData && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Item details</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template type</label>
                  <select
                    value={formData._template}
                    onChange={(e) => {
                      const t = e.target.value
                      const empty = createEmptyItem(t)
                      const preset = presetId ? catalogPresets.find((p) => p.id === presetId) : null
                      setFormData({ ...empty, ...(preset?.preset || {}), _template: t })
                      setTemplateType(t)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {getPresetsByTemplate(formData._template).length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preset (optional)</label>
                    <select
                      value={presetId}
                      onChange={(e) => {
                        setPresetId(e.target.value)
                        const preset = e.target.value ? catalogPresets.find((p) => p.id === e.target.value) : null
                        if (preset) setFormData((prev) => ({ ...prev, ...preset.preset }))
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">None</option>
                      {getPresetsByTemplate(formData._template).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <CatalogForm templateType={formData._template} formData={formData} setFormData={setFormData} />
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Back</button>
                  <button onClick={handleNextFromConfig} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  {selectedMethod === 'template' ? 'Review & Generate' : 'Review & Create'}
                </h3>
                {selectedMethod === 'template' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Template</div>
                      <div className="font-medium text-gray-900 capitalize">{templateType}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Count</div>
                      <div className="font-medium text-gray-900">{templateCount}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Type</div>
                      <div className="font-medium text-gray-900 capitalize">{formData?._template}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">ID</div>
                      <div className="font-medium text-gray-900">{formData?.id}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="font-medium text-gray-900">{formData?.name}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Back</button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : selectedMethod === 'template' ? `Generate ${templateCount} Items` : 'Create Item'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
