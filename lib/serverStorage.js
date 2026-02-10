// Server-side storage utility for API routes
// Uses filesystem to persist data per API key (simulating localStorage per account)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORAGE_DIR = path.join(process.cwd(), '.kdummy-storage')

// Ensure storage directory exists
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

// Get storage file path for an API key (single file per account with nested data)
function getStoragePath(apiKey) {
  ensureStorageDir()
  const safeApiKey = apiKey.replace(/[^a-zA-Z0-9]/g, '_')
  return path.join(STORAGE_DIR, `account_${safeApiKey}.json`)
}

// Get all data for a specific API key
export function getApiKeyData(apiKey) {
  if (!apiKey) return {}
  
  try {
    const filePath = getStoragePath(apiKey)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error(`Error reading storage for API key ${apiKey}:`, error)
  }
  
  return {}
}

// Get specific data type for an API key
export function getApiKeyDataType(apiKey, dataType, defaultValue = null) {
  const accountData = getApiKeyData(apiKey)
  return accountData[dataType] !== undefined ? accountData[dataType] : defaultValue
}

// Set specific data type for an API key
export function setApiKeyDataType(apiKey, dataType, data) {
  if (!apiKey) return
  
  try {
    const accountData = getApiKeyData(apiKey)
    accountData[dataType] = data
    ensureStorageDir()
    const filePath = getStoragePath(apiKey)
    fs.writeFileSync(filePath, JSON.stringify(accountData, null, 2), 'utf8')
  } catch (error) {
    console.error(`Error writing storage for API key ${apiKey}:`, error)
  }
}

// Set all data for an API key (replaces entire account data)
export function setApiKeyData(apiKey, data) {
  if (!apiKey) return
  
  try {
    ensureStorageDir()
    const filePath = getStoragePath(apiKey)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error(`Error writing storage for API key ${apiKey}:`, error)
  }
}

// Append data to an array for a specific API key
export function appendApiKeyData(apiKey, dataType, item) {
  if (!apiKey) return
  
  const current = getApiKeyDataType(apiKey, dataType, [])
  if (Array.isArray(current)) {
    current.push(item)
    setApiKeyDataType(apiKey, dataType, current)
  }
}

// Update an item in an array by ID
export function updateApiKeyDataItem(apiKey, dataType, itemId, updater) {
  if (!apiKey) return
  
  const current = getApiKeyDataType(apiKey, dataType, [])
  if (Array.isArray(current)) {
    const index = current.findIndex(item => item.id === itemId)
    if (index >= 0) {
      current[index] = updater(current[index])
      setApiKeyDataType(apiKey, dataType, current)
    }
  }
}

// Delete an item from an array by ID
export function deleteApiKeyDataItem(apiKey, dataType, itemId) {
  if (!apiKey) return
  
  const current = getApiKeyDataType(apiKey, dataType, [])
  if (Array.isArray(current)) {
    const filtered = current.filter(item => item.id !== itemId)
    setApiKeyDataType(apiKey, dataType, filtered)
  }
}

// Get API key from request headers or query params
export function getApiKeyFromRequest(request) {
  // Try header first
  const apiKeyHeader = request.headers.get('x-api-key') || request.headers.get('api-key')
  if (apiKeyHeader) return apiKeyHeader
  
  // Try query param
  const url = new URL(request.url)
  const apiKeyParam = url.searchParams.get('api_key')
  if (apiKeyParam) return apiKeyParam
  
  return null
}

