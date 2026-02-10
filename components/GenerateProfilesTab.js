'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateEmail, generatePhoneNumber, generateExternalId, generateDate, generatePropertyValue } from '@/lib/utils'
import { getNameByGender, getConsistentLocation, generatePhoneFromLocation, generateAddressFromLocation } from '@/lib/consistentData'
import { getLocationsForCountries, getRandomLocationFromCountries } from '@/lib/locationGenerator'
import { generatePhoneFromCountry } from '@/lib/countryUtils'
import { getActiveApiKey } from '@/lib/storage'
import { useConfirm } from '@/context/ConfirmContext'

export default function GenerateProfilesTab() {
  const router = useRouter()
  const { alert, confirm } = useConfirm()
  const [generating, setGenerating] = useState(false)
  const [availableProperties, setAvailableProperties] = useState([])
  const [catalogData, setCatalogData] = useState({ products: [], locations: [], reservations: [], loyalty: null })
  const [selectedProperties, setSelectedProperties] = useState({})
  const [propertyValues, setPropertyValues] = useState({})
  
  // Generation settings
  const [count, setCount] = useState(1)
  const [includeEmail, setIncludeEmail] = useState(true)
  const [includePhone, setIncludePhone] = useState(false)
  const [includeExternalId, setIncludeExternalId] = useState(false)
  const [includeName, setIncludeName] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstNameEnabled, setFirstNameEnabled] = useState(true)
  const [lastNameEnabled, setLastNameEnabled] = useState(true)
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationRegion, setLocationRegion] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationZip, setLocationZip] = useState('')
  const [locale, setLocale] = useState('')
  const [includeLocation, setIncludeLocation] = useState(true)
  const [selectedCountries, setSelectedCountries] = useState(['US'])
  const [selectAllCountries, setSelectAllCountries] = useState(false)
  const [subscribeChannels, setSubscribeChannels] = useState([])
  
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableCountries, setAvailableCountries] = useState([])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [openMultiSelects, setOpenMultiSelects] = useState({})

  useEffect(() => {
    fetchProperties()
    fetchCatalogData()
    fetchCountries()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#country-dropdown-container')) {
        setShowCountryDropdown(false)
      }
      if (!event.target.closest('[data-multiselect]')) {
        setOpenMultiSelects({})
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showCountryDropdown])

  useEffect(() => {
    if (selectedLocationId) {
      const location = availableLocations.find(loc => loc.id === selectedLocationId)
      if (location) {
        setLocationCity(location.city)
        setLocationRegion(location.state || location.region)
        setLocationCountry(location.country)
        setLocationZip(location.zip)
        setLocale(location.locale)
        if (!locationAddress) {
          const streetNum = Math.floor(Math.random() * 9999) + 1
          const street = location.streets[Math.floor(Math.random() * location.streets.length)]
          setLocationAddress(`${streetNum} ${street}`)
        }
      }
    }
  }, [selectedLocationId, availableLocations])

  useEffect(() => {
    if (availableCountries.length > 0) {
      let countriesToUse = []
      if (selectAllCountries || selectedCountries.length === 0) {
        // Use all countries if "Select All" is checked or no countries selected
        countriesToUse = availableCountries
      } else {
        // Filter to only selected countries
        countriesToUse = availableCountries.filter(c => selectedCountries.includes(c.code))
      }
      
      if (countriesToUse.length > 0) {
        const filtered = getLocationsForCountries(countriesToUse)
        setAvailableLocations(filtered)
      } else {
        setAvailableLocations([])
      }
    }
  }, [selectedCountries, availableCountries, selectAllCountries])

  useEffect(() => {
    if (count === 1) {
      const initialValues = {}
      availableProperties.forEach(prop => {
        if (selectedProperties[prop.name]) {
          if (prop.type === 'array') {
            initialValues[prop.name] = []
          } else {
            initialValues[prop.name] = ''
          }
        }
      })
      setPropertyValues(prev => {
        const merged = { ...initialValues }
        Object.keys(prev).forEach(key => {
          if (selectedProperties[key]) {
            merged[key] = prev[key]
          }
        })
        return merged
      })
    } else {
      setPropertyValues({})
    }
  }, [count, selectedProperties, availableProperties])

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
    try {
      const data = await fetchWithApiKey('/api/profile-properties?include_custom=true')
      const enabledProperties = (data.data || []).filter(prop => prop.enabled !== false)
      setAvailableProperties(enabledProperties)
      
      const initialSelection = {}
      enabledProperties.forEach(prop => {
        initialSelection[prop.name] = true
      })
      setSelectedProperties(initialSelection)
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchCatalogData = async () => {
    try {
      const data = await fetchWithApiKey('/api/data-catalog')
      setCatalogData({
        products: data.data.products || [],
        locations: data.data.locations || [],
        reservations: data.data.reservations || [],
        loyalty: data.data.loyalty || null,
      })
    } catch (error) {
      console.error('Error fetching catalog data:', error)
    }
  }

  const fetchCountries = async () => {
    try {
      const data = await fetchWithApiKey('/api/countries?enabled_only=true')
      setAvailableCountries(data.data || [])
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const getCatalogValue = (property) => {
    if (!property.catalog_source) return null

    if (property.catalog_source === 'loyalty' || property.catalog_source === 'loyalty_tiers') {
      if (catalogData.loyalty && catalogData.loyalty.tiers) {
        const tiers = catalogData.loyalty.tiers || []
        if (tiers.length === 0) return null
        const randomTier = tiers[Math.floor(Math.random() * tiers.length)]
        return property.object_property_mapping 
          ? randomTier[property.object_property_mapping] 
          : randomTier.name
      }
      return null
    }

    if (property.catalog_source === 'stores') {
      const catalog = catalogData.locations || []
      if (catalog.length === 0) return null
      const randomItem = catalog[Math.floor(Math.random() * catalog.length)]
      return property.object_property_mapping 
        ? randomItem[property.object_property_mapping] 
        : randomItem.name || randomItem.id
    }

    const catalog = catalogData[property.catalog_source]
    if (!catalog || catalog.length === 0) return null

    const randomItem = catalog[Math.floor(Math.random() * catalog.length)]
    
    if (property.object_property_mapping && randomItem[property.object_property_mapping] !== undefined) {
      return randomItem[property.object_property_mapping]
    }
    
    switch (property.catalog_source) {
      case 'products':
        return property.name === 'favorite_product' ? randomItem.name : randomItem.id
      case 'locations':
        return property.name === 'favourite_store' || property.name === 'last_purchase_location' 
          ? randomItem.name 
          : randomItem.id
      case 'reservations':
        return randomItem.name || randomItem.id
      default:
        return randomItem.name || randomItem.id
    }
  }

  const generateProfileProperties = (profileGender = null, profileLocation = null) => {
    const properties = {}
    
    availableProperties.forEach(prop => {
      if (!selectedProperties[prop.name]) return

      let value = null

      if (count === 1 && propertyValues[prop.name] !== undefined && propertyValues[prop.name] !== '') {
        value = propertyValues[prop.name]
        if (prop.type === 'array' && Array.isArray(value)) {
          value = value.length > 0 ? value : null
        }
        if (prop.type === 'boolean' && typeof value === 'string') {
          value = value === 'true'
        }
        if (prop.type === 'integer' && value !== '') {
          value = parseInt(value) || null
        }
        if (prop.type === 'decimal' && value !== '') {
          value = parseFloat(value) || null
        }
      }
      else if (prop.catalog_source) {
        if (prop.catalog_source === 'locations' && profileLocation) {
          if (prop.name === 'favourite_store' || prop.name === 'last_purchase_location') {
            value = profileLocation.city
          } else {
            value = profileLocation.name || profileLocation.city
          }
        } else {
          value = getCatalogValue(prop)
        }
      } else if (prop.default_value !== null && prop.default_value !== undefined && prop.default_value !== '') {
        value = prop.default_value
      } else {
        switch (prop.type) {
          case 'string':
            if (prop.options && prop.options.length > 0) {
              value = prop.options[Math.floor(Math.random() * prop.options.length)]
            } else {
              value = generatePropertyValue('string', prop.name)
            }
            break
          case 'integer':
            const min = prop.integer_min ? parseInt(prop.integer_min) : 0
            const max = prop.integer_max ? parseInt(prop.integer_max) : 1000
            value = Math.floor(Math.random() * (max - min + 1)) + min
            break
          case 'decimal':
            value = parseFloat((Math.random() * 1000).toFixed(2))
            break
          case 'boolean':
            value = generatePropertyValue('boolean', prop.name)
            break
          case 'date':
            const dateMin = prop.date_min || '1970-01-01'
            const dateMax = prop.date_max || new Date().toISOString().split('T')[0]
            value = generateDate(dateMin, dateMax)
            break
          case 'array':
            if (prop.options && prop.options.length > 0 && !prop.catalog_source) {
              const numItems = Math.floor(Math.random() * 3) + 1
              const selected = []
              const available = [...prop.options]
              for (let i = 0; i < numItems && available.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * available.length)
                selected.push(available.splice(randomIndex, 1)[0])
              }
              value = selected
            } else {
              value = generatePropertyValue('array', prop.name)
            }
            break
          default:
            value = generatePropertyValue('string', prop.name)
        }
      }

      if (prop.name === 'gender' && profileGender) {
        value = profileGender
      }

      if (value !== null && value !== '') {
        properties[prop.name] = value
      }
    })

    return properties
  }

  const generateProfile = () => {
    // Determine gender - check if it's set in custom properties, otherwise random
    let profileGender = null
    if (count === 1) {
      const genderProp = availableProperties.find(p => p.name === 'gender')
      if (genderProp && propertyValues[genderProp.name]) {
        profileGender = propertyValues[genderProp.name]
      }
    }
    if (!profileGender) {
      profileGender = ['female', 'male', 'other'][Math.floor(Math.random() * 3)]
    }

    let name = null
    if (includeName) {
      if (count === 1) {
        if (firstNameEnabled && firstName) {
          name = {
            first: firstName,
            last: lastNameEnabled && lastName ? lastName : null,
            gender: profileGender
          }
        } else if (lastNameEnabled && lastName) {
          name = {
            first: null,
            last: lastName,
            gender: profileGender
          }
        }
      } else {
        if (Math.random() > 0.1) {
          name = getNameByGender(profileGender)
        }
      }
    }
    
    let location = null
    let address = null
    let phoneNumber = null
    let profileLocale = locale || 'en-US'
    
    if (includeLocation) {
      if (count === 1 && selectedLocationId) {
        location = availableLocations.find(loc => loc.id === selectedLocationId)
        if (location) {
          address = {
            address1: locationAddress || generateAddressFromLocation(location).address1,
            address2: Math.random() > 0.7 ? `Apt ${Math.floor(Math.random() * 100)}` : null,
            city: locationCity || location.city,
            region: locationRegion || (location.state || location.region),
            country: locationCountry || location.country,
            zip: locationZip || location.zip,
          }
          profileLocale = locale || location.locale
          
          if (includePhone) {
            phoneNumber = generatePhoneFromLocation(location)
          }
        }
      } else {
        let countriesToUse = []
        if (selectAllCountries || selectedCountries.length === 0) {
          countriesToUse = availableCountries
        } else {
          countriesToUse = availableCountries.filter(c => selectedCountries.includes(c.code))
        }
        
        if (countriesToUse.length > 0) {
          location = getRandomLocationFromCountries(countriesToUse)
        }
        
        if (!location) {
          if (catalogData.locations && catalogData.locations.length > 0) {
            const randomCatalogLocation = catalogData.locations[Math.floor(Math.random() * catalogData.locations.length)]
            location = {
              id: randomCatalogLocation.id,
              city: randomCatalogLocation.city,
              state: randomCatalogLocation.state,
              region: randomCatalogLocation.region || randomCatalogLocation.state,
              country: randomCatalogLocation.country,
              country_code: randomCatalogLocation.country_code,
              phone_prefix: randomCatalogLocation.phone_prefix,
              area_code: randomCatalogLocation.area_code,
              zip: randomCatalogLocation.zip,
              locale: randomCatalogLocation.locale || 'en-US',
              streets: randomCatalogLocation.streets || ['Main St'],
              name: randomCatalogLocation.name
            }
          } else {
            location = getConsistentLocation()
          }
        }
        
        if (location) {
          const addressData = generateAddressFromLocation(location)
          address = addressData
          profileLocale = location.locale
          
          if (includePhone) {
            const country = availableCountries.find(c => c.code === location.country_code)
            if (country) {
              phoneNumber = generatePhoneFromCountry(country, location.area_code)
            } else {
              phoneNumber = generatePhoneFromLocation(location)
            }
          }
        }
      }
    }
    
    const properties = generateProfileProperties(name?.gender || profileGender, location)
    
    const profile = {
      type: 'profile',
      attributes: {
        locale: profileLocale,
        location: address,
        properties: properties
      }
    }

    if (name) {
      if (name.first) {
        profile.attributes.first_name = name.first
      }
      if (name.last) {
        profile.attributes.last_name = name.last
      }
    }

    if (includeEmail) {
      profile.attributes.email = generateEmail(name?.first || '', name?.last || '')
    }
    if (includePhone) {
      profile.attributes.phone_number = phoneNumber || generatePhoneNumber()
    }
    if (includeExternalId) {
      profile.attributes.external_id = generateExternalId()
    }

    return profile
  }

  const handleGenerate = async () => {
    if (count < 1 || count > 100) {
      await alert('Count must be between 1 and 100')
      return
    }

    if (!includeEmail && !includePhone && !includeExternalId) {
      await alert('At least one identifier (email, phone, or external_id) must be selected')
      return
    }

    const ok = await confirm(`Generate ${count} profile(s)?`)
    if (!ok) return

    setGenerating(true)
    const createdProfiles = []
    const errors = []

    try {
      for (let i = 0; i < count; i++) {
        const profileData = generateProfile()
        
        try {
          const result = await fetchWithApiKey('/api/profiles', {
            method: 'POST',
            body: JSON.stringify({ data: profileData }),
          })
          
          createdProfiles.push(result.data)
          
          if (subscribeChannels.length > 0) {
            const profile = result.data
            const subscribeData = {
              data: {
                type: 'subscription',
                attributes: {
                  channels: subscribeChannels,
                  profile_id: profile.id,
                  email: profile.attributes.email,
                  phone_number: profile.attributes.phone_number,
                }
              }
            }
            
            await fetchWithApiKey('/api/subscribe', {
              method: 'POST',
              body: JSON.stringify(subscribeData),
            })
          }
        } catch (error) {
          errors.push({ index: i + 1, error: error.message })
        }
      }

      if (createdProfiles.length > 0) {
        await alert(`Successfully created ${createdProfiles.length} profile(s)${errors.length > 0 ? `\n${errors.length} error(s) occurred` : ''}`)
        router.push('/profiles?tab=list')
      } else {
        await alert(`Failed to create profiles. Errors: ${errors.map(e => `\nProfile ${e.index}: ${e.error}`).join('')}`)
      }
    } catch (error) {
      await alert(`Error: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const toggleProperty = (propertyName) => {
    setSelectedProperties(prev => ({
      ...prev,
      [propertyName]: !prev[propertyName]
    }))
  }

  const toggleAllProperties = () => {
    const allSelected = Object.values(selectedProperties).every(v => v)
    const newSelection = {}
    availableProperties.forEach(prop => {
      newSelection[prop.name] = !allSelected
    })
    setSelectedProperties(newSelection)
  }

  const updatePropertyValue = (propertyName, value) => {
    setPropertyValues(prev => ({
      ...prev,
      [propertyName]: value
    }))
  }

  const toggleMultiSelect = (propertyName) => {
    setOpenMultiSelects(prev => ({
      ...prev,
      [propertyName]: !prev[propertyName]
    }))
  }

  const handleMultiSelectChange = (propertyName, value, checked) => {
    const currentValues = Array.isArray(propertyValues[propertyName]) ? propertyValues[propertyName] : []
    if (checked) {
      updatePropertyValue(propertyName, [...currentValues, value])
    } else {
      updatePropertyValue(propertyName, currentValues.filter(v => v !== value))
    }
  }

  const Toggle = ({ checked, onChange, disabled }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span
        className={`pointer-events-none absolute top-1/2 left-0.5 inline-block h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow ring-0 transition ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* 1. Profile count */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">1</span>
            Profile count
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-11">How many profiles to generate (1–100).</p>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Profile count</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <input
              type="range"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              className="w-full sm:w-72 h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCount((prev) => Math.max(1, prev - 1))}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                aria-label="Decrease profile count"
              >
                –
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!Number.isNaN(val)) setCount(Math.min(Math.max(val, 1), 100))
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setCount((prev) => Math.min(100, prev + 1))}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                aria-label="Increase profile count"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Identifiers & consent — legacy layout (hidden, replaced by new grid below) */}
      <div className="hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-base font-semibold text-gray-900">2. Identifiers & consent</h2>
          <p className="text-sm text-gray-500 mt-0.5">At least one identifier required. Optionally set subscription channels.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,200px)_1fr] gap-8 md:gap-12">
            <div className="space-y-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Identifiers</p>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEmail}
                  onChange={(e) => setIncludeEmail(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Email</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhone}
                  onChange={(e) => setIncludePhone(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Phone</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExternalId}
                  onChange={(e) => setIncludeExternalId(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">External ID</span>
              </label>
            </div>
            <div className="space-y-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Consent (optional)</p>
              {includeEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Email</p>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subscribeChannels.includes('email_marketing')}
                      onChange={(e) => {
                        if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'email_marketing'])
                        else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'email_marketing'))
                      }}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-600">Email marketing</span>
                  </label>
                </div>
              )}
              {includePhone && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">SMS</p>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subscribeChannels.includes('sms_marketing')}
                          onChange={(e) => {
                            if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'sms_marketing'])
                            else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'sms_marketing'))
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">SMS marketing</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subscribeChannels.includes('sms_transactional')}
                          onChange={(e) => {
                            if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'sms_transactional'])
                            else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'sms_transactional'))
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">SMS transactional</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">WhatsApp</p>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subscribeChannels.includes('whatsapp_marketing')}
                          onChange={(e) => {
                            if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'whatsapp_marketing'])
                            else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'whatsapp_marketing'))
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">WhatsApp marketing</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subscribeChannels.includes('whatsapp_transactional')}
                          onChange={(e) => {
                            if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'whatsapp_transactional'])
                            else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'whatsapp_transactional'))
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">WhatsApp transactional</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {!includeEmail && !includePhone && (
                <p className="text-sm text-gray-400">Enable Email or Phone above to set consent.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Identifiers & consent */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">2</span>
            Identifiers & consent
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Choose which identifiers you set on profiles and which channels to opt profiles into.
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {/* Column 1: Identifiers (toggles) */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identifiers</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Toggle checked={includeEmail} onChange={setIncludeEmail} />
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={includePhone} onChange={setIncludePhone} />
                  <span className="text-sm font-medium text-gray-700">Phone</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={includeExternalId} onChange={setIncludeExternalId} />
                  <span className="text-sm font-medium text-gray-700">External ID</span>
                </div>
              </div>
            </div>

            {/* Column 2: Email consent */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email consent</h3>
              <p className="text-xs text-gray-500">
                {includeEmail
                  ? 'Opt profiles into email marketing.'
                  : 'Turn on Email identifier to enable.'}
              </p>
              <div className="space-y-2">
                <label
                  className={`flex items-center ${!includeEmail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    disabled={!includeEmail}
                    checked={subscribeChannels.includes('email_marketing')}
                    onChange={(e) => {
                      if (!includeEmail) return
                      if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'email_marketing'])
                      else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'email_marketing'))
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email marketing</span>
                </label>
              </div>
            </div>

            {/* Column 3: SMS consent */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SMS consent</h3>
              <p className="text-xs text-gray-500">
                {includePhone
                  ? 'Opt profiles into SMS channels.'
                  : 'Turn on Phone to use SMS consent.'}
              </p>
              <div className={`${!includePhone ? 'opacity-50' : ''} space-y-2`}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!includePhone}
                    checked={subscribeChannels.includes('sms_marketing')}
                    onChange={(e) => {
                      if (!includePhone) return
                      if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'sms_marketing'])
                      else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'sms_marketing'))
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">SMS marketing</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!includePhone}
                    checked={subscribeChannels.includes('sms_transactional')}
                    onChange={(e) => {
                      if (!includePhone) return
                      if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'sms_transactional'])
                      else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'sms_transactional'))
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">SMS transactional</span>
                </label>
              </div>
            </div>

            {/* Column 4: WhatsApp consent */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp consent</h3>
              <p className="text-xs text-gray-500">
                {includePhone
                  ? 'Opt profiles into WhatsApp (uses phone).'
                  : 'Turn on Phone to use WhatsApp consent.'}
              </p>
              <div className={`${!includePhone ? 'opacity-50' : ''} space-y-2`}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!includePhone}
                    checked={subscribeChannels.includes('whatsapp_marketing')}
                    onChange={(e) => {
                      if (!includePhone) return
                      if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'whatsapp_marketing'])
                      else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'whatsapp_marketing'))
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">WhatsApp marketing</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!includePhone}
                    checked={subscribeChannels.includes('whatsapp_transactional')}
                    onChange={(e) => {
                      if (!includePhone) return
                      if (e.target.checked) setSubscribeChannels([...subscribeChannels, 'whatsapp_transactional'])
                      else setSubscribeChannels(subscribeChannels.filter((c) => c !== 'whatsapp_transactional'))
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">WhatsApp transactional</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Name & location */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-visible">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">3</span>
            Name & location
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-11">Optional. Single profile can use a specific location from selected countries.</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Toggle checked={includeName} onChange={setIncludeName} />
              <span className="text-sm font-medium text-gray-700">Include name</span>
            </div>
            {includeName && (
              count === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={firstNameEnabled} onChange={(e) => setFirstNameEnabled(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">First name</span>
                    </label>
                    {firstNameEnabled && (
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Optional"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={lastNameEnabled} onChange={(e) => setLastNameEnabled(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">Last name</span>
                    </label>
                    {lastNameEnabled && (
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Optional"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 pl-6 border-l-2 border-gray-200">Names will be randomly generated.</p>
              )
            )}
          </div>
          {/* Countries inside Name & location, above Location section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Countries</h3>
            <p className="text-xs text-gray-500 mb-2">
              Required. Affects phone numbers, locations, and other profile properties.
            </p>
            <div className="relative max-w-md" id="country-dropdown-container">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCountryDropdown(!showCountryDropdown)
                }}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white flex justify-between items-center text-sm"
              >
                <span className="text-gray-700">
                  {selectAllCountries
                    ? `All countries (${availableCountries.length})`
                    : selectedCountries.length > 0
                      ? `${selectedCountries.length} selected`
                      : 'Select countries...'}
                </span>
                <svg
                  className={`h-5 w-5 text-gray-400 shrink-0 ${showCountryDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCountryDropdown && (
                <div
                  className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-gray-100">
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAllCountries}
                        onChange={(e) => {
                          setSelectAllCountries(e.target.checked)
                          if (e.target.checked) setSelectedCountries([])
                          else setSelectedCountries(['US'])
                        }}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">Select all</span>
                    </label>
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {availableCountries.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2 text-center">Loading...</p>
                    ) : (
                      availableCountries.map((country) => (
                        <label
                          key={country.code}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectAllCountries || selectedCountries.includes(country.code)}
                            onChange={(e) => {
                              if (selectAllCountries) return
                              if (e.target.checked) setSelectedCountries([...selectedCountries, country.code])
                              else setSelectedCountries(selectedCountries.filter((c) => c !== country.code))
                            }}
                            disabled={selectAllCountries}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-900">{country.name}</span>
                          <span className="ml-1 text-xs text-gray-500">({country.code})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {selectAllCountries ? 'All countries' : `${selectedCountries.length} selected`}
                {!selectAllCountries && selectedCountries.length > 0 && ` · ${availableLocations.length} locations`}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Toggle checked={includeLocation} onChange={setIncludeLocation} />
              <h3 className="text-sm font-medium text-gray-700">Include location</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Include address & locale on generated profiles.</p>
            {includeLocation && (
              count === 1 ? (
                <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pick a location (optional)</label>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Auto from selected countries</option>
                      {availableLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.city}, {loc.state || loc.region}, {loc.country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Address', value: locationAddress, set: setLocationAddress, placeholder: 'Street' },
                      { label: 'City', value: locationCity, set: setLocationCity, placeholder: 'City' },
                      { label: 'Region / State', value: locationRegion, set: setLocationRegion, placeholder: 'State' },
                      { label: 'Country', value: locationCountry, set: setLocationCountry, placeholder: 'Country' },
                      { label: 'Zip', value: locationZip, set: setLocationZip, placeholder: 'Zip' },
                      { label: 'Locale', value: locale, set: setLocale, placeholder: 'en-US' },
                    ].map(({ label, value, set, placeholder }) => (
                      <div key={label}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                        <input type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Locations will be randomly chosen from selected countries (address, phone, locale kept consistent).</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Future: catalog-linked properties & locations per use case — note for product */}
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <p className="text-sm text-indigo-800">
          <span className="font-medium">Planned:</span> Profile properties linked to Data Catalog (products, services, subscriptions, favourite store). Locations configurable per use case and by countries from the app&apos;s countries section.
        </p>
      </div>

      {/* 4. Custom Properties */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">4</span>
              Custom properties
            </h2>
            <p className="text-sm text-gray-500 mt-1 ml-11">Include and optionally set values for profile properties.</p>
          </div>
          <button type="button" onClick={toggleAllProperties} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            {Object.values(selectedProperties).every((v) => v) ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="p-6 border border-t-0 border-gray-200 rounded-b-lg bg-gray-50/30">
          {availableProperties.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No properties available. Configure properties first.</p>
          ) : (
            <div className="space-y-4">
              {availableProperties.map((property) => (
                <div key={property.name} className="bg-white p-4 rounded border">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProperties[property.name] || false}
                      onChange={() => toggleProperty(property.name)}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-base font-medium text-gray-900">{property.name}</span>
                        <span className="text-sm text-gray-500">({property.type})</span>
                        {property.catalog_source && (
                          <span className="px-2 py-1 text-sm font-medium bg-green-100 text-green-800 rounded">
                            {property.catalog_source}
                          </span>
                        )}
                        {property.required && (
                          <span className="px-2 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      {property.description && (
                        <p className="text-sm text-gray-500 mb-3">{property.description}</p>
                      )}
                      {selectedProperties[property.name] && (
                        <div className="mt-2">
                          {property.catalog_source ? (
                            (() => {
                              let catalogItems = []
                              let displayField = 'name'
                              
                              if (property.catalog_source === 'products') {
                                catalogItems = catalogData.products || []
                                displayField = property.object_property_mapping || 'name'
                              } else if (property.catalog_source === 'stores' || property.catalog_source === 'locations') {
                                catalogItems = catalogData.locations || []
                                displayField = property.object_property_mapping || 'name'
                              } else if (property.catalog_source === 'loyalty') {
                                if (catalogData.loyalty && catalogData.loyalty.tiers) {
                                  catalogItems = catalogData.loyalty.tiers
                                  displayField = property.object_property_mapping || 'name'
                                }
                              } else if (property.catalog_source === 'reservations') {
                                catalogItems = catalogData.reservations || []
                                displayField = property.object_property_mapping || 'name'
                              }
                              
                              if (catalogItems.length > 0) {
                                if (property.type === 'array') {
                                  const selectedValues = Array.isArray(propertyValues[property.name]) ? propertyValues[property.name] : []
                                  const isOpen = openMultiSelects[property.name] || false
                                  
                                  return (
                                    <div className="relative" data-multiselect>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Select values (multiple):</label>
                                      <button
                                        type="button"
                                        onClick={() => toggleMultiSelect(property.name)}
                                        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex justify-between items-center"
                                      >
                                        <span className="text-base text-gray-700">
                                          {selectedValues.length > 0 
                                            ? `${selectedValues.length} selected` 
                                            : 'Select options...'}
                                        </span>
                                        <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                      {isOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                                          <div className="p-2">
                                            {catalogItems.map((item) => {
                                              const value = item[displayField] || item.id || item.name
                                              const label = item[displayField] || item.name || item.id
                                              const isChecked = selectedValues.includes(value)
                                              
                                              return (
                                                <label
                                                  key={item.id || value}
                                                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => handleMultiSelectChange(property.name, value, e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                  />
                                                  <span className="ml-3 text-base text-gray-900">{label}</span>
                                                </label>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      {selectedValues.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {selectedValues.map((selected) => (
                                            <span
                                              key={selected}
                                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                                            >
                                              {selected}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = selectedValues.filter(v => v !== selected)
                                                  updatePropertyValue(property.name, updated)
                                                }}
                                                className="ml-2 text-indigo-600 hover:text-indigo-900"
                                              >
                                                ×
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                } else {
                                  return (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Select value:</label>
                                      <select
                                        value={propertyValues[property.name] || ''}
                                        onChange={(e) => updatePropertyValue(property.name, e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                      >
                                        <option value="">Select {property.name} (optional - will generate if empty)</option>
                                        {catalogItems.map((item) => {
                                          const value = item[displayField] || item.id || item.name
                                          const label = item[displayField] || item.name || item.id
                                          return (
                                            <option key={item.id || value} value={value}>{label}</option>
                                          )
                                        })}
                                      </select>
                                    </div>
                                  )
                                }
                              }
                              return <p className="text-sm text-gray-500">No {property.catalog_source} data available</p>
                            })()
                          ) : property.type === 'array' && property.options && property.options.length > 0 ? (
                            (() => {
                              const selectedValues = Array.isArray(propertyValues[property.name]) ? propertyValues[property.name] : []
                              const isOpen = openMultiSelects[property.name] || false
                              
                              return (
                                <div className="relative" data-multiselect>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Select values (multiple):</label>
                                  <button
                                    type="button"
                                    onClick={() => toggleMultiSelect(property.name)}
                                    className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex justify-between items-center"
                                  >
                                    <span className="text-base text-gray-700">
                                      {selectedValues.length > 0 
                                        ? `${selectedValues.length} selected` 
                                        : 'Select options...'}
                                    </span>
                                    <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {isOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                                      <div className="p-2">
                                        {property.options.map((option) => {
                                          const isChecked = selectedValues.includes(option)
                                          
                                          return (
                                            <label
                                              key={option}
                                              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => handleMultiSelectChange(property.name, option, e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                              />
                                              <span className="ml-3 text-base text-gray-900">{option}</span>
                                            </label>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {selectedValues.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {selectedValues.map((selected) => (
                                        <span
                                          key={selected}
                                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                                        >
                                          {selected}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = selectedValues.filter(v => v !== selected)
                                              updatePropertyValue(property.name, updated)
                                            }}
                                            className="ml-2 text-indigo-600 hover:text-indigo-900"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })()
                          ) : property.options && property.options.length > 0 ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select value:</label>
                              <select
                                value={propertyValues[property.name] || ''}
                                onChange={(e) => updatePropertyValue(property.name, e.target.value)}
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Select {property.name} (optional - will generate if empty)</option>
                                {property.options.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          ) : property.type === 'date' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select date:</label>
                              <input
                                type="date"
                                value={propertyValues[property.name] || ''}
                                onChange={(e) => updatePropertyValue(property.name, e.target.value)}
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          ) : property.type === 'boolean' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select value:</label>
                              <select
                                value={propertyValues[property.name] !== undefined ? String(propertyValues[property.name]) : ''}
                                onChange={(e) => updatePropertyValue(property.name, e.target.value === 'true')}
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Select (optional - will generate if empty)</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </select>
                            </div>
                          ) : count === 1 ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Enter value:</label>
                              <input
                                type={property.type === 'integer' || property.type === 'decimal' ? 'number' : 'text'}
                                step={property.type === 'decimal' ? '0.01' : undefined}
                                value={propertyValues[property.name] || ''}
                                onChange={(e) => updatePropertyValue(property.name, e.target.value)}
                                placeholder={`Enter ${property.name} (optional - will generate if empty)`}
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate profiles'}
        </button>
      </div>
    </div>
  )
}
