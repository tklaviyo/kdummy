'use client'

import { useState, useEffect, useCallback } from 'react'
import { createEmptyItem, getTemplate } from '@/src/catalog/schema.js'
import { validateItem } from '@/src/catalog/validators.js'
import { upsertCatalogItem } from '@/src/catalog/storage.js'
import {
  getBusinessTypesByTemplate,
  getMaxTemplatesForBusinessType,
} from '@/src/catalog/businessTypes.js'
import { generateItemFromBusinessTypeTemplate, makeId } from '@/src/catalog/generators.js'
import { CatalogFormFields } from '@/src/catalog/CatalogFormFields.js'
import { useConfirm } from '@/context/ConfirmContext'

const TEMPLATE_KEYS = ['product', 'service', 'subscription']

const CATALOG_TYPE_DESCRIPTIONS = {
  product: 'Physical or digital goods you sell (e.g. apparel, electronics, downloads).',
  service: 'Bookable or deliverable services (e.g. appointments, classes, consultations).',
  subscription: 'Recurring plans (e.g. monthly boxes, memberships, software licenses).',
}

export function CreateCatalogModal({ open, onClose, onSuccess }) {
  const { confirm } = useConfirm()
  const [step, setStep] = useState(0)
  const [templateKey, setTemplateKey] = useState('')
  const [templateSearchQuery, setTemplateSearchQuery] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState(null)
  const [itemForms, setItemForms] = useState([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [pendingGenerateCount, setPendingGenerateCount] = useState(0)
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)

  const stepLabels = ['Set up', 'Configure', 'Generate']
  const isSummaryStep = step === 2
  const itemsToGenerate = isSummaryStep ? itemForms.slice(0, pendingGenerateCount) : []

  const canGoToStep = (stepIndex) => {
    if (stepIndex <= 0) return true
    if (stepIndex === 1) return !!templateKey && !!selectedBusinessType
    if (stepIndex === 2) return itemForms.length > 0
    return false
  }

  const populateItemForms = () => {
    if (selectedBusinessType && templateKey) {
      const count = maxForSelected
      const forms = []
      for (let i = 0; i < count; i++) {
        forms.push(generateItemFromBusinessTypeTemplate(selectedBusinessType, i))
      }
      setItemForms(forms)
      setCurrentItemIndex(0)
    }
  }

  const businessTypes = templateKey ? getBusinessTypesByTemplate(templateKey) : []
  const maxForSelected = selectedBusinessType && templateKey
    ? getMaxTemplatesForBusinessType(selectedBusinessType)
    : 0

  const goToStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= stepLabels.length) return
    if (stepIndex === step) return
    if (!canGoToStep(stepIndex)) return
    setErrors([])
    if (stepIndex === 0) setStep(0)
    else if (stepIndex === 1) {
      setStep(1)
      if (itemForms.length === 0) populateItemForms()
    } else if (stepIndex === 2) {
      setStep(2)
      setPendingGenerateCount(itemForms.length > 0 ? itemForms.length : 1)
    }
  }

  const handleSetUpNext = () => {
    if (!templateKey || !selectedBusinessType) return
    setErrors([])
    populateItemForms()
    setStep(1)
  }

  const updateCurrentItem = useCallback(
    (arg) => {
      setItemForms((prev) => {
        const next = [...prev]
        const current = next[currentItemIndex]
        const newCurrent = typeof arg === 'function' ? arg(current) : arg
        next[currentItemIndex] = newCurrent
        return next
      })
    },
    [currentItemIndex]
  )

  const currentFormValues = itemForms[currentItemIndex] || null

  const handleFinish = () => {
    if (step !== 1 || itemForms.length === 0) return
    setErrors([])
    setPendingGenerateCount(itemForms.length)
    setStep(2)
  }

  const handleGenerate = async () => {
    if (!isSummaryStep || itemsToGenerate.length === 0) return
    const ok = await confirm(
      `Create ${itemsToGenerate.length} ${getTemplate(templateKey).label.toLowerCase()}(s) in the catalog?`,
      { confirmLabel: 'Generate' }
    )
    if (!ok) return
    setSaving(true)
    try {
      itemsToGenerate.forEach((item) => upsertCatalogItem(templateKey, item))
      onSuccess?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (isSummaryStep) {
      setStep(1)
      setErrors([])
    } else if (step === 1) {
      setStep(0)
      setItemForms([])
      setCurrentItemIndex(0)
    }
  }

  const handleClose = () => {
    setStep(0)
    setTemplateKey('')
    setTemplateSearchQuery('')
    setSelectedBusinessType(null)
    setItemForms([])
    setCurrentItemIndex(0)
    setErrors([])
    onClose()
  }

  useEffect(() => {
    if (!open) return
    setStep(0)
    setTemplateKey('')
    setTemplateSearchQuery('')
    setSelectedBusinessType(null)
    setItemForms([])
    setCurrentItemIndex(0)
    setErrors([])
  }, [open])

  const filteredBusinessTypes = templateKey
    ? businessTypes.filter((bt) => {
        const q = (templateSearchQuery || '').trim().toLowerCase()
        if (!q) return true
        return (bt.label || '').toLowerCase().includes(q)
      })
    : []

  if (!open) return null

  const summaryPriceOrPlan = (item) => {
    if (templateKey === 'subscription') {
      return [item.intervalCount, item.interval].filter(Boolean).length
        ? `${item.intervalCount ?? ''} ${item.interval ?? ''} • ${item.currency ?? ''} ${item.price != null ? Number(item.price) : '—'}`.trim()
        : (item.currency ? `${item.currency} ` : '') + (item.price != null ? Number(item.price) : '—')
    }
    return (item.currency ? `${item.currency} ` : '') + (item.price != null ? Number(item.price) : '—')
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50 flex items-start justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            {step === 0 ? 'Create catalog item' : step === 1 ? `Configure ${getTemplate(templateKey).label}` : 'Generate'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Catalog item type</label>
                <div className="grid grid-cols-3 gap-4">
                  {TEMPLATE_KEYS.map((key) => {
                    const template = getTemplate(key)
                    const selected = templateKey === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key !== templateKey) {
                            setTemplateKey(key)
                            setSelectedBusinessType(null)
                            setTemplateSearchQuery('')
                          }
                        }}
                        className={`rounded-xl border-2 p-5 text-left transition-colors ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{template.label}</span>
                        <span className="block text-xs text-gray-500 mt-1.5 font-normal">{CATALOG_TYPE_DESCRIPTIONS[key]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Template</label>
                {templateKey ? (
                  <>
                    <div className="mb-3 max-w-md">
                      <input
                        type="search"
                        placeholder="Search templates…"
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredBusinessTypes.map((bt) => {
                        const selected = selectedBusinessType?.id === bt.id
                        const maxItems = getMaxTemplatesForBusinessType(bt)
                        return (
                          <button
                            key={bt.id}
                            type="button"
                            onClick={() => setSelectedBusinessType(selected ? null : bt)}
                            className={`rounded-xl border-2 p-4 text-left transition-colors ${
                              selected
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50'
                            }`}
                          >
                            <span className="block text-sm font-semibold truncate" title={bt.label}>{bt.label}</span>
                            <span className="block text-xs text-gray-500 mt-1">{maxItems} items</span>
                          </button>
                        )
                      })}
                    </div>
                    {filteredBusinessTypes.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">No templates match your search.</p>
                    )}
                    <p className="mt-3 text-xs text-gray-500">
                      {selectedBusinessType ? `Generates ${maxForSelected} items. Edit in the next step.` : 'Select a template above.'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Select an item type above first.</p>
                )}
              </div>
            </div>
          )}

          {isSummaryStep && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Review the {itemsToGenerate.length} item{itemsToGenerate.length !== 1 ? 's' : ''} below, then click Generate to create them.
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {templateKey === 'subscription' ? 'Plan' : 'Price'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {itemsToGenerate.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{i + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.name ?? '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{getTemplate(templateKey).label}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{summaryPriceOrPlan(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 1 && itemForms.length > 0 && currentFormValues && (
            <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
              <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden min-w-0">
                <div className="px-3 py-2.5 border-b border-gray-200 bg-white">
                  <div className="text-sm font-semibold text-gray-800">
                    {getTemplate(templateKey).label} ({itemForms.length})
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Click an item to edit on the right</p>
                </div>
                <ul className="p-2 space-y-1 max-h-[min(40vh,20rem)] overflow-y-auto">
                  {itemForms.map((item, i) => (
                    <li key={i}>
                      <div
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 group border ${
                          currentItemIndex === i ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100' : 'border-transparent hover:bg-white hover:border-gray-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentItemIndex(i)}
                          className="flex-1 text-left text-sm font-medium text-gray-900 truncate min-w-0"
                        >
                          <span className="text-gray-400 font-normal mr-1">{i + 1}.</span>
                          {item.name && String(item.name).trim() ? item.name : `Item ${i + 1}`}
                        </button>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const prefix = { product: 'PROD', service: 'SERV', subscription: 'SUB' }[templateKey] || 'ITEM'
                              const clone = { ...item, id: makeId(prefix) }
                              const next = [...itemForms.slice(0, i + 1), clone, ...itemForms.slice(i + 1)]
                              setItemForms(next)
                              setCurrentItemIndex(i + 1)
                              setErrors([])
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-medium"
                            title="Clone this item"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (itemForms.length <= 1) return
                              const itemLabel = item.name && String(item.name).trim() ? item.name : `Item ${i + 1}`
                              const ok = await confirm(`Remove "${itemLabel}" from the list?`, { confirmLabel: 'Remove', danger: true })
                              if (!ok) return
                              const next = itemForms.filter((_, j) => j !== i)
                              setItemForms(next)
                              setCurrentItemIndex((prev) => (prev === i ? Math.min(prev, next.length - 1) : prev > i ? prev - 1 : prev))
                              setErrors([])
                            }}
                            disabled={itemForms.length <= 1}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Remove this item"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="p-2 border-t border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      const empty = createEmptyItem(templateKey)
                      setItemForms((prev) => [...prev, empty])
                      setCurrentItemIndex(itemForms.length)
                      setErrors([])
                    }}
                    className="w-full py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200"
                  >
                    + Add item
                  </button>
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium text-gray-700">Editing:</span>{' '}
                  {currentFormValues.name && String(currentFormValues.name).trim() ? currentFormValues.name : `Item ${currentItemIndex + 1}`}
                </div>
                {errors.length > 0 && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                    {errors.map((e) => e.message).join(' ')}
                  </div>
                )}
                <CatalogFormFields
                  templateKey={templateKey}
                  formValues={currentFormValues}
                  setFormValues={updateCurrentItem}
                  errors={errors}
                  skipFieldKeys={['id']}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center flex-wrap gap-2 shrink-0">
          {step === 0 && (
            <button
              type="button"
              onClick={handleSetUpNext}
              disabled={!templateKey || !selectedBusinessType}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          )}
          {step === 1 && itemForms.length > 0 && (
            <div className="flex gap-2 items-center">
              <button type="button" onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm">
                Back
              </button>
              <button type="button" onClick={handleFinish} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
                Finish
              </button>
            </div>
          )}
          {isSummaryStep && (
            <div className="flex gap-2 items-center">
              <button type="button" onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'Generating…' : 'Generate'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
