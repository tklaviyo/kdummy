// Utility for managing localStorage with API key scoping

const STORAGE_PREFIX = 'kdummy_'
const ACTIVE_API_KEY_KEY = 'active_api_key'
const ACCOUNTS_KEY = 'accounts'

// Get the active API key
export function getActiveApiKey() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`${STORAGE_PREFIX}${ACTIVE_API_KEY_KEY}`)
}

// Get the active account object (accountName, apiKey, listId, createdAt)
export function getActiveAccount() {
  if (typeof window === 'undefined') return null
  const apiKey = getActiveApiKey()
  if (!apiKey) return null
  const accounts = getAccounts()
  return accounts.find(a => a.apiKey === apiKey) || null
}

// Set the active API key
export function setActiveApiKey(apiKey) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${STORAGE_PREFIX}${ACTIVE_API_KEY_KEY}`, apiKey)
}

// Get all accounts
export function getAccounts() {
  if (typeof window === 'undefined') return []
  const accountsJson = localStorage.getItem(`${STORAGE_PREFIX}${ACCOUNTS_KEY}`)
  return accountsJson ? JSON.parse(accountsJson) : []
}

// Save an account
export function saveAccount(account) {
  if (typeof window === 'undefined') return
  const accounts = getAccounts()
  const existingIndex = accounts.findIndex(a => a.apiKey === account.apiKey)
  
  if (existingIndex >= 0) {
    accounts[existingIndex] = account
  } else {
    accounts.push(account)
  }
  
  localStorage.setItem(`${STORAGE_PREFIX}${ACCOUNTS_KEY}`, JSON.stringify(accounts))
}

// Delete an account
export function deleteAccount(apiKey) {
  if (typeof window === 'undefined') return
  const accounts = getAccounts().filter(a => a.apiKey !== apiKey)
  localStorage.setItem(`${STORAGE_PREFIX}${ACCOUNTS_KEY}`, JSON.stringify(accounts))
  
  // If deleting the active account, clear active key
  if (getActiveApiKey() === apiKey) {
    localStorage.removeItem(`${STORAGE_PREFIX}${ACTIVE_API_KEY_KEY}`)
  }
  
  // Clear all data for this API key
  clearApiKeyData(apiKey)
}

// Get storage key for a specific API key (single key per account with nested data)
function getStorageKey(apiKey) {
  // Sanitize API key for use as localStorage key (replace special chars with underscore)
  const safeApiKey = apiKey.replace(/[^a-zA-Z0-9]/g, '_')
  return `${STORAGE_PREFIX}account_${safeApiKey}`
}

// Get all data for a specific API key
export function getApiKeyData(apiKey) {
  if (typeof window === 'undefined') return {}
  const key = getStorageKey(apiKey)
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : {}
}

// Get specific data type for an API key
export function getApiKeyDataType(apiKey, dataType, defaultValue = null) {
  const accountData = getApiKeyData(apiKey)
  return accountData[dataType] !== undefined ? accountData[dataType] : defaultValue
}

// Set specific data type for an API key
export function setApiKeyDataType(apiKey, dataType, data) {
  if (typeof window === 'undefined') return
  const accountData = getApiKeyData(apiKey)
  accountData[dataType] = data
  const key = getStorageKey(apiKey)
  localStorage.setItem(key, JSON.stringify(accountData))
}

// Set all data for an API key (replaces entire account data)
export function setApiKeyData(apiKey, data) {
  if (typeof window === 'undefined') return
  const key = getStorageKey(apiKey)
  localStorage.setItem(key, JSON.stringify(data))
}

// Clear all data for a specific API key
export function clearApiKeyData(apiKey) {
  if (typeof window === 'undefined') return
  const key = getStorageKey(apiKey)
  localStorage.removeItem(key)
}

// Get data for the active API key
export function getActiveApiKeyData() {
  const apiKey = getActiveApiKey()
  if (!apiKey) return {}
  return getApiKeyData(apiKey)
}

// Get specific data type for the active API key
export function getActiveApiKeyDataType(dataType, defaultValue = null) {
  const apiKey = getActiveApiKey()
  if (!apiKey) return defaultValue
  return getApiKeyDataType(apiKey, dataType, defaultValue)
}

// Set data for the active API key
export function setActiveApiKeyData(data) {
  const apiKey = getActiveApiKey()
  if (!apiKey) return
  setApiKeyData(apiKey, data)
}

// Set specific data type for the active API key
export function setActiveApiKeyDataType(dataType, data) {
  const apiKey = getActiveApiKey()
  if (!apiKey) return
  setApiKeyDataType(apiKey, dataType, data)
}

