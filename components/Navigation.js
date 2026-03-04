'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getAccounts, getActiveApiKey, setActiveApiKey } from '@/lib/storage'

export default function Navigation({ activePage = 'home' }) {
  const [accounts, setAccounts] = useState([])
  const [activeApiKey, setActiveApiKeyState] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadAccounts()
    
    // Listen for storage changes to update when account changes
    const handleStorageChange = () => {
      loadAccounts()
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadAccounts, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const loadAccounts = () => {
    const accountsList = getAccounts()
    setAccounts(accountsList)
    const active = getActiveApiKey()
    setActiveApiKeyState(active)
  }

  const handleAccountChange = (apiKey) => {
    setActiveApiKey(apiKey)
    setActiveApiKeyState(apiKey)
    setShowDropdown(false)
    // Reload the page to refresh all data with new API key
    window.location.reload()
  }

  const activeAccount = accounts.find(a => a.apiKey === activeApiKey)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <img src="/kdummy-logo.png" alt="K:Dummy" className="h-9 w-9 rounded-lg object-contain" />
                <span className="text-2xl font-bold text-gray-900">K:Dummy</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/profiles"
                className={`${
                  activePage === 'profiles'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Profiles
              </Link>
              <Link
                href="/events"
                className={`${
                  activePage === 'events'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Events
              </Link>
              <Link
                href="/catalog"
                className={`${
                  activePage === 'catalog'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Data Catalog
              </Link>
              <Link
                href="/settings"
                className={`${
                  activePage === 'settings'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Settings
              </Link>
            </div>
          </div>
          
          {/* Account Selector */}
          <div className="flex items-center">
            {accounts.length > 0 ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <span className="hidden sm:inline">
                    {activeAccount ? activeAccount.accountName : 'No Account'}
                  </span>
                  <span className="sm:hidden">
                    {activeAccount ? activeAccount.accountName.substring(0, 10) + (activeAccount.accountName.length > 10 ? '...' : '') : 'Account'}
                  </span>
                  {activeAccount && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                      Active
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Klaviyo Accounts
                      </div>
                      {accounts.map((account) => (
                        <button
                          key={account.apiKey}
                          onClick={() => handleAccountChange(account.apiKey)}
                          className={`${
                            account.apiKey === activeApiKey
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          } w-full text-left px-4 py-2 text-sm flex items-center justify-between`}
                          role="menuitem"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{account.accountName}</div>
                            <div className="text-xs text-gray-500 font-mono truncate">{account.apiKey}</div>
                          </div>
                          {account.apiKey === activeApiKey && (
                            <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-200 mt-1">
                        <Link
                          href="/settings"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          role="menuitem"
                        >
                          Manage Accounts...
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 010 2h-5v5a1 1 0 01-2 0v-5H4a1 1 0 010-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Connect account</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

