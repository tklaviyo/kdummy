// Client-side API utility that automatically includes the active API key

import { getActiveApiKey } from './storage'

// Helper to get API key or throw error
function getApiKey() {
  const apiKey = getActiveApiKey()
  if (!apiKey) {
    throw new Error('No active API key. Please configure an account in Settings.')
  }
  return apiKey
}

// Fetch with API key - returns Response object
export async function fetchWithApiKey(url, options = {}) {
  const apiKey = getApiKey()
  const urlObj = new URL(url, window.location.origin)
  urlObj.searchParams.set('api_key', apiKey)
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  }
  
  const response = await fetch(urlObj.toString(), {
    ...options,
    headers,
  })
  
  return response
}

// API client functions
export const apiClient = {
  // Profiles
  async createProfile(profileData) {
    return fetchWithApiKey('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ data: profileData }),
    })
  },
  
  async getProfiles(page = 1, pageSize = 10) {
    const url = `/api/profiles?page=${page}&page_size=${pageSize}`
    return fetchWithApiKey(url)
  },
  
  // Events
  async createEvent(eventData) {
    return fetchWithApiKey('/api/events', {
      method: 'POST',
      body: JSON.stringify({ data: eventData }),
    })
  },
  
  async getEvents(page = 1, pageSize = 10) {
    const url = `/api/events?page=${page}&page_size=${pageSize}`
    return fetchWithApiKey(url)
  },
  
  // Subscribe
  async subscribe(subscriptionData) {
    return fetchWithApiKey('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ data: subscriptionData }),
    })
  },
  
  // Profile Properties
  async getProfileProperties(includeCustom = false) {
    const url = `/api/profile-properties?include_custom=${includeCustom}`
    return fetchWithApiKey(url)
  },
  
  async createProfileProperty(propertyData) {
    return fetchWithApiKey('/api/profile-properties', {
      method: 'POST',
      body: JSON.stringify({ data: propertyData }),
    })
  },
  
  async updateProfileProperty(propertyId, propertyData) {
    return fetchWithApiKey(`/api/profile-properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify({ data: propertyData }),
    })
  },
  
  async toggleProfilePropertyEnabled(propertyId, enabled) {
    return fetchWithApiKey(`/api/profile-properties/${propertyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },
  
  async deleteProfileProperty(propertyId) {
    return fetchWithApiKey(`/api/profile-properties/${propertyId}`, {
      method: 'DELETE',
    })
  },
  
  // Data Catalog
  async getDataCatalog() {
    return fetchWithApiKey('/api/data-catalog')
  },
  
  async updateDataCatalog(catalogData) {
    return fetchWithApiKey('/api/data-catalog', {
      method: 'PUT',
      body: JSON.stringify(catalogData),
    })
  },
  
  // Countries
  async getCountries(enabledOnly = false) {
    const url = `/api/countries${enabledOnly ? '?enabled_only=true' : ''}`
    return fetchWithApiKey(url)
  },
  
  async createCountry(countryData) {
    return fetchWithApiKey('/api/countries', {
      method: 'POST',
      body: JSON.stringify({ data: countryData }),
    })
  },
  
  async updateCountry(countryCode, countryData) {
    return fetchWithApiKey(`/api/countries/${countryCode}`, {
      method: 'PUT',
      body: JSON.stringify({ data: countryData }),
    })
  },
  
  async toggleCountryEnabled(countryCode, enabled) {
    return fetchWithApiKey(`/api/countries/${countryCode}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },
  
  async deleteCountry(countryCode) {
    return fetchWithApiKey(`/api/countries/${countryCode}`, {
      method: 'DELETE',
    })
  },
  
  // Metrics
  async getMetrics() {
    return fetchWithApiKey('/api/metrics')
  },
}

