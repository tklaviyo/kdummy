'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { getAccounts, saveAccount, deleteAccount, getActiveApiKey, setActiveApiKey } from '@/lib/storage'
import { useConfirm } from '@/context/ConfirmContext'

const SETTINGS_TABS = ['accounts', 'data']

export default function SettingsPageClient() {
  const searchParams = useSearchParams()
  const { alert, confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState('accounts')
  const [accounts, setAccounts] = useState([])
  const [activeApiKey, setActiveApiKeyState] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    accountName: '',
    apiKey: '',
    listId: ''
  })
  const [editingKey, setEditingKey] = useState(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && SETTINGS_TABS.includes(tab)) setActiveTab(tab)
  }, [searchParams])

  const loadAccounts = () => {
    const accountsList = getAccounts()
    setAccounts(accountsList)
    const active = getActiveApiKey()
    setActiveApiKeyState(active)
    if (accountsList.length === 1 && active !== accountsList[0].apiKey) {
      setActiveApiKey(accountsList[0].apiKey)
      setActiveApiKeyState(accountsList[0].apiKey)
    }
  }

  const handleAddAccount = async () => {
    if (!formData.accountName.trim() || !formData.apiKey.trim()) {
      await alert('Please enter both account name and API key')
      return
    }
    const existing = accounts.find(a => a.apiKey === formData.apiKey)
    if (existing) {
      await alert('This API key already exists')
      return
    }
    const account = {
      accountName: formData.accountName.trim(),
      apiKey: formData.apiKey.trim(),
      listId: (formData.listId || '').trim() || undefined,
      createdAt: new Date().toISOString()
    }
    saveAccount(account)
    const hadNoAccounts = accounts.length === 0
    loadAccounts()
    if (hadNoAccounts) {
      setActiveApiKey(account.apiKey)
      setActiveApiKeyState(account.apiKey)
    }
    setFormData({ accountName: '', apiKey: '', listId: '' })
    setShowAddForm(false)
  }

  const handleEditAccount = (account) => {
    setEditingKey(account.apiKey)
    setFormData({
      accountName: account.accountName,
      apiKey: account.apiKey,
      listId: account.listId || ''
    })
    setShowAddForm(true)
  }

  const handleUpdateAccount = async () => {
    if (!formData.accountName.trim() || !formData.apiKey.trim()) {
      await alert('Please enter both account name and API key')
      return
    }
    if (formData.apiKey !== editingKey) {
      const existing = accounts.find(a => a.apiKey === formData.apiKey && a.apiKey !== editingKey)
      if (existing) {
        await alert('This API key already exists')
        return
      }
    }
    if (formData.apiKey !== editingKey) {
      deleteAccount(editingKey)
    }
    const account = {
      accountName: formData.accountName.trim(),
      apiKey: formData.apiKey.trim(),
      listId: (formData.listId || '').trim() || undefined,
      createdAt: accounts.find(a => a.apiKey === editingKey)?.createdAt || new Date().toISOString()
    }
    saveAccount(account)
    if (activeApiKey === editingKey && formData.apiKey !== editingKey) {
      setActiveApiKey(formData.apiKey)
    }
    loadAccounts()
    setFormData({ accountName: '', apiKey: '', listId: '' })
    setShowAddForm(false)
    setEditingKey(null)
  }

  const handleDeleteAccount = async (apiKey) => {
    const ok = await confirm('Are you sure you want to delete this account? All data associated with this API key will be permanently deleted.', { confirmLabel: 'Delete', danger: true })
    if (!ok) return
    deleteAccount(apiKey)
    loadAccounts()
  }

  const handleSetActive = (apiKey) => {
    setActiveApiKey(apiKey)
    setActiveApiKeyState(apiKey)
  }

  const handleCancel = () => {
    setFormData({ accountName: '', apiKey: '', listId: '' })
    setShowAddForm(false)
    setEditingKey(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activePage="settings" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your Klaviyo accounts and API keys. Each account's data is stored separately.
            </p>
          </div>

          <div className="p-6">
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`${
                    activeTab === 'accounts'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Klaviyo Accounts
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`${
                    activeTab === 'data'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Data Storage Information
                </button>
              </nav>
            </div>

            {activeTab === 'accounts' && (
              <>
                {!showAddForm ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Klaviyo Accounts</h2>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Add Account
                      </button>
                    </div>
                    {accounts.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No accounts configured</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {accounts.map((account) => (
                          <div
                            key={account.apiKey}
                            className={`border rounded-lg p-4 ${
                              activeApiKey === account.apiKey
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{account.accountName}</h3>
                                  {activeApiKey === account.apiKey && (
                                    <span className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded">Active</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 font-mono mb-2">{account.apiKey}</p>
                                {account.listId && (
                                  <p className="text-xs text-gray-600 font-mono mb-1">List ID: {account.listId}</p>
                                )}
                                <p className="text-xs text-gray-500">Added: {new Date(account.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {activeApiKey !== account.apiKey && (
                                  <button
                                    onClick={() => handleSetActive(account.apiKey)}
                                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-600 rounded-md hover:bg-indigo-50"
                                  >
                                    Set Active
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditAccount(account)}
                                  className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAccount(account.apiKey)}
                                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="max-w-md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {editingKey ? 'Edit Account' : 'Add New Account'}
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                        <input
                          type="text"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          placeholder="e.g., Production, Staging, Demo"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Public API Key</label>
                        <input
                          type="text"
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          placeholder="pk_..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          disabled={!!editingKey}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Use your Klaviyo public/company API key. Generated profiles are sent to your Klaviyo account.
                        </p>
                        {editingKey && (
                          <p className="mt-1 text-xs text-gray-500">API key cannot be changed. Delete and recreate to change it.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">List ID</label>
                        <input
                          type="text"
                          value={formData.listId}
                          onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
                          placeholder="e.g. ABC123 (required for Subscribe API)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Required for Subscribe API (email, SMS, WhatsApp).</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={editingKey ? handleUpdateAccount : handleAddAccount}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {editingKey ? 'Update' : 'Add'} Account
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'data' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Data Storage Information</h2>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">How Data is Stored:</p>
                    <p className="mb-2">
                      All data (profiles, events, configurations, etc.) is stored in your browser's <strong>localStorage</strong>.
                      Each Klaviyo account (identified by its API key) has its own separate data storage.
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><code className="bg-gray-100 px-1 py-0.5 rounded">kdummy_active_api_key</code> - Active API key</li>
                      <li><code className="bg-gray-100 px-1 py-0.5 rounded">kdummy_accounts</code> - Account configurations</li>
                      <li><code className="bg-gray-100 px-1 py-0.5 rounded">kdummy_account_&#123;apiKey&#125;</code> - All data for an account</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">How to Find Data in localStorage:</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                      <li>Open Developer Tools (F12) → Application (Chrome) or Storage (Firefox)</li>
                      <li>Expand Local Storage → your domain</li>
                      <li>Look for keys starting with <code className="bg-gray-100 px-1 py-0.5 rounded">kdummy_</code></li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
