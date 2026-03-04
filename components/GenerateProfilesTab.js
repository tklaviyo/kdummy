'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateEmail, generateExternalId, generateDate, generatePropertyValue, getDateRangeFromPreset } from '@/lib/utils'
import { getNameByGender, getConsistentLocation, generatePhoneFromLocation, generateAddressFromLocation } from '@/lib/consistentData'
import { getLocationsForCountries, getRandomLocationFromCountries } from '@/lib/locationGenerator'
import { generatePhoneFromCountry } from '@/lib/countryUtils'
import { getActiveApiKey, getActiveAccount } from '@/lib/storage'
import { useConfirm } from '@/context/ConfirmContext'
import { buildKlaviyoProfilePayload, buildKlaviyoSubscriptionPayload, channelsToConsent } from '@/lib/klaviyoPayloads'
import { groupProperties } from '@/lib/profilePropertyGroups'
import { getCatalogItemsForSource } from '@/lib/defaultCatalogTemplates'
import useRepeatOnHold from '@/lib/useRepeatOnHold'

export default function GenerateProfilesTab({ onAddCustomProperty, onEditCustomProperty }) {
  const router = useRouter()
  const { alert, confirm } = useConfirm()
  const [generating, setGenerating] = useState(false)
  const [availableProperties, setAvailableProperties] = useState([])
  const [catalogData, setCatalogData] = useState({ products: [], locations: [], reservations: [], loyalty: null })
  const [selectedProperties, setSelectedProperties] = useState({})
  const [propertyValues, setPropertyValues] = useState({})
  
  // Generation settings
  const [profileModeSingle, setProfileModeSingle] = useState(true) // true = single profile, false = multiple
  const [count, setCount] = useState(1)
  const [emailDomain, setEmailDomain] = useState('klaviyo-demo.com')
  const [includeEmail, setIncludeEmail] = useState(true)
  const [includePhone, setIncludePhone] = useState(false)
  const [includeExternalId, setIncludeExternalId] = useState(false)
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customExternalId, setCustomExternalId] = useState('')
  const [includeName, setIncludeName] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationRegion, setLocationRegion] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationZip, setLocationZip] = useState('')
  const [locale, setLocale] = useState('')
  const [includeLocation, setIncludeLocation] = useState(true)
  const [selectedCountries, setSelectedCountries] = useState(['US'])
  const [subscribeChannels, setSubscribeChannels] = useState([])
  
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableCountries, setAvailableCountries] = useState([])
  const [openMultiSelects, setOpenMultiSelects] = useState({})
  const [activePropertyGroupId, setActivePropertyGroupId] = useState('all')

  useEffect(() => {
    fetchProperties()
    fetchCatalogData()
    fetchCountries()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-multiselect]')) {
        setOpenMultiSelects({})
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

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
      const countriesToUse = selectedCountries.length > 0
        ? availableCountries.filter(c => selectedCountries.includes(c.code))
        : [availableCountries.find(c => c.code === 'US') || availableCountries[0]].filter(Boolean)
      if (countriesToUse.length > 0) {
        setAvailableLocations(getLocationsForCountries(countriesToUse))
      } else {
        setAvailableLocations([])
      }
    }
  }, [selectedCountries, availableCountries])

  useEffect(() => {
    if (profileModeSingle) {
      if (count !== 1) setCount(1)
    }
  }, [profileModeSingle])

  // Phone cannot be used when generating multiple profiles; uncheck when switching to multiple
  useEffect(() => {
    if (count > 1) setIncludePhone(false)
  }, [count])

  // Clear picked location when switching to multiple (multiple uses random location per profile)
  useEffect(() => {
    if (count > 1) setSelectedLocationId('')
  }, [count])

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

  useEffect(() => {
    if (availableProperties.length === 0) return
    const grouped = groupProperties(availableProperties)
    const hasActive = activePropertyGroupId === 'all' || grouped.some((g) => g.groupId === activePropertyGroupId)
    if (!hasActive && grouped.length > 0) setActivePropertyGroupId('all')
  }, [availableProperties, activePropertyGroupId])

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
        initialSelection[prop.name] = false
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
        services: data.data.services || [],
        subscriptions: data.data.subscriptions || [],
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
    const source = property.catalog_source === 'stores' ? 'locations' : property.catalog_source
    if (source === 'products' || source === 'services' || source === 'subscriptions') return null
    const items = getCatalogItemsForSource(source, catalogData, true)
    if (!items.length) return null
    const randomItem = items[Math.floor(Math.random() * items.length)]
    const field = property.object_property_mapping === 'id' || property.object_property_mapping === 'name' ? property.object_property_mapping : 'name'
    if (randomItem[field] !== undefined) return randomItem[field]
    switch (source) {
      case 'locations':
        return property.name === 'favorite_store' || property.name === 'last_purchase_location' ? randomItem.name : randomItem.id
      case 'reservations':
        return randomItem.name || randomItem.id
      default:
        return randomItem.name || randomItem.id
    }
  }

  /** Returns one generated value for a single property (used for "Generate" button on single profile). */
  const getOneGeneratedPropertyValue = (prop, profileGender = null, profileLocation = null) => {
    if (prop.catalog_source === 'locations' && profileLocation) {
      if (prop.name === 'favorite_store' || prop.name === 'last_purchase_location') return profileLocation.city
      return profileLocation.name || profileLocation.city
    }
    if (prop.catalog_source) {
      const source = prop.catalog_source === 'stores' ? 'locations' : prop.catalog_source
      if (source === 'products' || source === 'services' || source === 'subscriptions') return null
      if (prop.type === 'array') {
        const items = getCatalogItemsForSource(source, catalogData, true)
        const field = prop.object_property_mapping === 'id' || prop.object_property_mapping === 'name' ? prop.object_property_mapping : 'name'
        const minN = prop.array_min_items != null ? Math.max(0, parseInt(prop.array_min_items, 10)) : 0
        const maxN = prop.array_max_items != null ? Math.max(minN, parseInt(prop.array_max_items, 10)) : 3
        const n = Math.min(minN + Math.floor(Math.random() * (Math.max(maxN - minN, 0) + 1)), items.length)
        const selected = []
        const available = [...items]
        for (let i = 0; i < n && available.length > 0; i++) {
          const idx = Math.floor(Math.random() * available.length)
          const item = available.splice(idx, 1)[0]
          const v = item[field] !== undefined ? item[field] : item.name || item.id
          if (v != null && v !== '') selected.push(v)
        }
        return selected.length ? selected : null
      }
      return getCatalogValue(prop)
    }
    if (prop.default_value !== null && prop.default_value !== undefined && prop.default_value !== '') {
      return prop.default_value
    }
    switch (prop.type) {
      case 'string':
        if (prop.options && prop.options.length > 0) return prop.options[Math.floor(Math.random() * prop.options.length)]
        return generatePropertyValue('string', prop.name)
      case 'integer': {
        const min = prop.integer_min ? parseInt(prop.integer_min) : 0
        const max = prop.integer_max ? parseInt(prop.integer_max) : 1000
        return Math.floor(Math.random() * (max - min + 1)) + min
      }
      case 'decimal':
        return parseFloat((Math.random() * 1000).toFixed(2))
      case 'boolean':
        return generatePropertyValue('boolean', prop.name)
      case 'date': {
        const range = getDateRangeFromPreset(prop.date_range_preset)
        const dateMin = range ? range.startDate : (prop.date_min || '1970-01-01')
        const dateMax = range ? range.endDate : (prop.date_max || new Date().toISOString().split('T')[0])
        return generateDate(dateMin, dateMax)
      }
      case 'array':
        if (prop.options && prop.options.length > 0 && !prop.catalog_source) {
          const minN = prop.array_min_items != null ? Math.max(0, parseInt(prop.array_min_items, 10)) : 0
          const maxN = prop.array_max_items != null ? Math.max(minN, parseInt(prop.array_max_items, 10)) : 3
          const numItems = Math.min(minN + Math.floor(Math.random() * (maxN - minN + 1)), prop.options.length)
          const selected = []
          const available = [...prop.options]
          for (let i = 0; i < numItems && available.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * available.length)
            selected.push(available.splice(randomIndex, 1)[0])
          }
          return selected
        }
        return generatePropertyValue('array', prop.name)
      default:
        return generatePropertyValue('string', prop.name)
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
          if (prop.name === 'favorite_store' || prop.name === 'last_purchase_location') {
            value = profileLocation.city
          } else {
            value = profileLocation.name || profileLocation.city
          }
        } else if (prop.type === 'array') {
          const source = prop.catalog_source === 'stores' ? 'locations' : prop.catalog_source
          if (source === 'products' || source === 'services' || source === 'subscriptions') value = null
          else {
            const items = getCatalogItemsForSource(source, catalogData, true)
            const field = prop.object_property_mapping === 'id' || prop.object_property_mapping === 'name' ? prop.object_property_mapping : 'name'
            const minN = prop.array_min_items != null ? Math.max(0, parseInt(prop.array_min_items, 10)) : 0
            const maxN = prop.array_max_items != null ? Math.max(minN, parseInt(prop.array_max_items, 10)) : 3
            const n = Math.min(minN + Math.floor(Math.random() * (Math.max(maxN - minN, 0) + 1)), items.length)
            const selected = []
            const available = [...items]
            for (let i = 0; i < n && available.length > 0; i++) {
              const idx = Math.floor(Math.random() * available.length)
              const item = available.splice(idx, 1)[0]
              const v = item[field] !== undefined ? item[field] : item.name || item.id
              if (v != null && v !== '') selected.push(v)
            }
            value = selected.length ? selected : null
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
          case 'date': {
            const range = getDateRangeFromPreset(prop.date_range_preset)
            const dateMin = range ? range.startDate : (prop.date_min || '1970-01-01')
            const dateMax = range ? range.endDate : (prop.date_max || new Date().toISOString().split('T')[0])
            value = generateDate(dateMin, dateMax)
            break
          }
          case 'array':
            if (prop.options && prop.options.length > 0 && !prop.catalog_source) {
              const minN = prop.array_min_items != null ? Math.max(0, parseInt(prop.array_min_items, 10)) : 0
              const maxN = prop.array_max_items != null ? Math.max(minN, parseInt(prop.array_max_items, 10)) : 3
              const numItems = Math.min(minN + Math.floor(Math.random() * (maxN - minN + 1)), prop.options.length)
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

  const generateProfile = (overrides = {}) => {
    const includeNameForThis = overrides.includeNameOverride !== undefined ? overrides.includeNameOverride : includeName
    const domain = overrides.emailDomain != null ? overrides.emailDomain : emailDomain
    const usedEmails = overrides.usedEmails || null

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
    if (includeNameForThis) {
      if (count === 1) {
        if (firstName || lastName) {
          name = {
            first: firstName || null,
            last: lastName || null,
            gender: profileGender
          }
        } else {
          name = getNameByGender(profileGender)
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
        const countriesToUse = selectedCountries.length > 0
          ? availableCountries.filter(c => selectedCountries.includes(c.code))
          : [availableCountries.find(c => c.code === 'US') || availableCountries[0]].filter(Boolean)
        
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
      const custom = overrides.customEmail
      profile.attributes.email = (custom !== undefined && custom !== null && String(custom).trim() !== '')
        ? String(custom).trim()
        : generateEmail(name?.first || '', name?.last || '', { domain: domain || (count > 1 ? 'klaviyo-dummy.com' : 'klaviyo-demo.com'), usedEmails })
    }
    // Phone: only for single profile, and only from user input (no random generation)
    if (includePhone && count === 1) {
      const custom = overrides.customPhone
      const value = (custom !== undefined && custom !== null && String(custom).trim() !== '') ? String(custom).trim() : null
      if (value) profile.attributes.phone_number = value
    }
    if (includeExternalId) {
      const custom = overrides.customExternalId
      profile.attributes.external_id = (custom !== undefined && custom !== null && String(custom).trim() !== '')
        ? String(custom).trim()
        : generateExternalId()
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

    if (count === 1 && includePhone && (!customPhone || String(customPhone).trim() === '')) {
      await alert('Please enter a phone number or uncheck Phone. Phone cannot be auto-generated.')
      return
    }

    const ok = await confirm(`Generate ${count} profile(s)?`)
    if (!ok) return

    setGenerating(true)
    const createdProfiles = []
    const errors = []
    const usedEmails = new Set()

    try {
      for (let i = 0; i < count; i++) {
        const profileData = generateProfile({
          includeNameOverride: includeName,
          emailDomain: count > 1 ? 'klaviyo-dummy.com' : (emailDomain || 'klaviyo-demo.com'),
          usedEmails: includeEmail ? usedEmails : null,
          ...(count === 1 && {
            customEmail,
            customPhone,
            customExternalId,
          }),
        })
        
        try {
          const profilePayload = buildKlaviyoProfilePayload(profileData.attributes)
          const resData = await fetchWithApiKey('/api/profiles', {
            method: 'POST',
            body: JSON.stringify(profilePayload),
          })
          const created = resData?.data
          if (!created) throw new Error(resData?.errors?.[0]?.detail || 'Failed to create profile')
          createdProfiles.push(created)
          
          if (subscribeChannels.length > 0) {
            const activeAccount = getActiveAccount()
            const listId = activeAccount?.listId || null
            if (!listId) {
              errors.push({ index: i + 1, error: 'List ID not set. Set it in Settings → Klaviyo Accounts to subscribe profiles to email/SMS/WhatsApp.' })
            } else {
              const subscriptionPayload = buildKlaviyoSubscriptionPayload({
                profile: {
                  email: created.attributes?.email ?? profileData.attributes.email,
                  phone_number: created.attributes?.phone_number ?? profileData.attributes.phone_number,
                  external_id: created.attributes?.external_id ?? profileData.attributes.external_id,
                },
                listId,
                consent: channelsToConsent(subscribeChannels),
              })
              const subRes = await fetchWithApiKey('/api/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscriptionPayload),
              })
              if (subRes?.errors?.length) {
                errors.push({ index: i + 1, error: subRes.errors[0]?.detail || 'Subscribe failed' })
              }
            }
          }
        } catch (error) {
          errors.push({ index: i + 1, error: error.message })
        }
      }

      if (createdProfiles.length > 0) {
        const errorSummary = errors.length > 0
          ? `\n\n${errors.length} error(s):\n${errors.slice(0, 5).map(e => `• Profile ${e.index}: ${e.error}`).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
          : ''
        await alert(`Successfully created ${createdProfiles.length} profile(s).${errors.length > 0 ? `\n${errors.length} error(s) occurred (e.g. subscribe failed).${errorSummary}` : ''}`)
        router.push('/profiles?tab=list')
      } else {
        const errorList = errors.length > 0
          ? errors.map(e => `Profile ${e.index}: ${e.error}`).join('\n')
          : 'Unknown error'
        await alert(`Failed to create profiles.\n\n${errorList}`)
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

  const handleSelectAllProperties = () => {
    const allSelected = availableProperties.length > 0 && availableProperties.every((p) => selectedProperties[p.name])
    const next = {}
    availableProperties.forEach((p) => {
      next[p.name] = !allSelected
    })
    setSelectedProperties(next)
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

  const propertyGroups = groupProperties(availableProperties)
  const currentProperties =
    activePropertyGroupId === 'all'
      ? availableProperties
      : (propertyGroups.find((g) => g.groupId === activePropertyGroupId) || { properties: [] }).properties
  const propertyNavItems = [{ id: 'all', label: 'All properties' }, ...propertyGroups.map((g) => ({ id: g.groupId, label: g.label }))]
  const midIndex = Math.ceil(currentProperties.length / 2)
  const leftPropertyList = currentProperties.slice(0, midIndex)
  const rightPropertyList = currentProperties.slice(midIndex)

  const renderMultiProfileHint = (property) => {
    const src = property.catalog_source && (property.catalog_source === 'stores' ? 'locations' : property.catalog_source)
    if (src) {
      return <p className="text-xs text-gray-500">Random value from {src} data in your Data Catalog.</p>
    }
    if (property.type === 'date') {
      if (property.date_range_preset === 'last_12_months') {
        return <p className="text-xs text-gray-500">Random date in the last 12 months.</p>
      }
      if (property.date_range_preset === 'last_24_months') {
        return <p className="text-xs text-gray-500">Random date in the last 24 months.</p>
      }
      if (property.date_min || property.date_max) {
        const from = property.date_min || 'start'
        const to = property.date_max || 'today'
        return <p className="text-xs text-gray-500">Random date between {from} and {to}.</p>
      }
      return <p className="text-xs text-gray-500">Random date based on this property's date settings.</p>
    }
    if ((property.type === 'integer' || property.type === 'decimal') && (property.integer_min != null || property.integer_max != null)) {
      const min = property.integer_min != null ? property.integer_min : 0
      const max = property.integer_max != null ? property.integer_max : '∞'
      const label = property.type === 'integer' ? 'integer' : 'number'
      return <p className="text-xs text-gray-500">Random {label} between {min} and {max}.</p>
    }
    if (property.type === 'array') {
      if (property.array_min_items != null || property.array_max_items != null) {
        const min = property.array_min_items != null ? property.array_min_items : 0
        const max = property.array_max_items != null ? property.array_max_items : min
        const rangeText = min === max ? String(min) : `${min}–${max}`
        const optionsText =
          property.options && property.options.length > 0 ? ` from options: ${property.options.join(', ')}` : ''
        return (
          <p className="text-xs text-gray-500">
            Random list with {rangeText} value{min === 1 && max === 1 ? '' : 's'}
            {optionsText}.
          </p>
        )
      }
      if (property.options && property.options.length > 0) {
        const optionsText = property.options.join(', ')
        return <p className="text-xs text-gray-500">Random subset of options: {optionsText}.</p>
      }
      return <p className="text-xs text-gray-500">Random list of values for this property.</p>
    }
    if (property.type === 'boolean') {
      return <p className="text-xs text-gray-500">Random true/false based on this property's default.</p>
    }
    if (property.options && property.options.length > 0) {
      const optionsText = property.options.join(', ')
      return <p className="text-xs text-gray-500">Random value from options: {optionsText}.</p>
    }
    return <p className="text-xs text-gray-500">Random value based on this property's default.</p>
  }

  const renderSingleProfileControl = (property) => {
    if (property.catalog_source) {
      const source = property.catalog_source === 'stores' ? 'locations' : property.catalog_source

      if (source === 'products' || source === 'services' || source === 'subscriptions') {
        return (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Enter value manually:</label>
            <input
              type="text"
              value={propertyValues[property.name] || ''}
              onChange={(e) => updatePropertyValue(property.name, e.target.value)}
              placeholder="Enter value"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )
      }

      const catalogItems = getCatalogItemsForSource(source, catalogData, true)
      const displayField = property.object_property_mapping || 'name'

      if (catalogItems.length > 0) {
        if (property.type === 'array') {
          const selectedValues = Array.isArray(propertyValues[property.name]) ? propertyValues[property.name] : []
          const isOpen = openMultiSelects[property.name] || false

          return (
            <div className="relative" data-multiselect>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select values (multiple):</label>
              <button
                type="button"
                onClick={() => toggleMultiSelect(property.name)}
                className="w-full px-2 py-1.5 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex justify-between items-center text-sm"
              >
                <span className="text-sm text-gray-700">
                  {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Select options...'}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-y-auto">
                  <div className="p-1.5">
                    {catalogItems.map((item) => {
                      const value = item[displayField] || item.id || item.name
                      const label = item[displayField] || item.name || item.id
                      const isChecked = selectedValues.includes(value)

                      return (
                        <label
                          key={item.id || value}
                          className="flex items-center p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleMultiSelectChange(property.name, value, e.target.checked)}
                            className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-900">{label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {selectedValues.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedValues.map((selected) => (
                    <span
                      key={selected}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {selected}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = selectedValues.filter((v) => v !== selected)
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
        }

        const catalogValues = catalogItems.map((item) => item[displayField] || item.id || item.name)
        const currentVal = propertyValues[property.name] || ''
        const fromCatalog = catalogValues.includes(currentVal)

        return (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select from catalog or enter manually:
              </label>
              <select
                value={fromCatalog ? currentVal : ''}
                onChange={(e) => updatePropertyValue(property.name, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select (optional)</option>
                {catalogItems.map((item) => {
                  const value = item[displayField] || item.id || item.name
                  const label = item[displayField] || item.name || item.id
                  return (
                    <option key={item.id || value} value={value}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Or enter value manually:</label>
              <input
                type="text"
                value={!fromCatalog ? currentVal : ''}
                onChange={(e) => updatePropertyValue(property.name, e.target.value)}
                placeholder="Type a value"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )
      }

      return (
        <p className="text-sm text-gray-500">
          No {property.catalog_source} data available. Add items in Data Catalog or use default template in Configure.
        </p>
      )
    }

    if (property.type === 'array' && property.options && property.options.length > 0) {
      const selectedValues = Array.isArray(propertyValues[property.name]) ? propertyValues[property.name] : []
      const isOpen = openMultiSelects[property.name] || false

      return (
        <div className="relative" data-multiselect>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select values (multiple):</label>
          <button
            type="button"
            onClick={() => toggleMultiSelect(property.name)}
            className="w-full px-2 py-1.5 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex justify-between items-center text-sm"
          >
            <span className="text-sm text-gray-700">
              {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Select options...'}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-y-auto">
              <div className="p-1.5">
                {property.options.map((option) => {
                  const isChecked = selectedValues.includes(option)

                  return (
                    <label
                      key={option}
                      className="flex items-center p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleMultiSelectChange(property.name, option, e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{option}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
          {selectedValues.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedValues.map((selected) => (
                <span
                  key={selected}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {selected}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = selectedValues.filter((v) => v !== selected)
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
    }

    if (property.options && property.options.length > 0) {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select value:</label>
          <select
            value={propertyValues[property.name] || ''}
            onChange={(e) => updatePropertyValue(property.name, e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select {property.name} (optional - will generate if empty)</option>
            {property.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (property.type === 'date') {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select date:</label>
          <input
            type="date"
            value={propertyValues[property.name] || ''}
            onChange={(e) => updatePropertyValue(property.name, e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )
    }

    if (property.type === 'boolean') {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select value:</label>
          <select
            value={propertyValues[property.name] !== undefined ? String(propertyValues[property.name]) : ''}
            onChange={(e) => updatePropertyValue(property.name, e.target.value === 'true')}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select (optional - will generate if empty)</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      )
    }

    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Enter value:</label>
        <input
          type={property.type === 'integer' || property.type === 'decimal' ? 'number' : 'text'}
          step={property.type === 'decimal' ? '0.01' : undefined}
          value={propertyValues[property.name] || ''}
          onChange={(e) => updatePropertyValue(property.name, e.target.value)}
          placeholder={`Enter ${property.name} (optional - will generate if empty)`}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    )
  }

  const renderPropertyCard = (property) => {
    const isSelected = !!selectedProperties[property.name]

    return (
      <div key={property.name} className="border border-gray-200 rounded-lg p-4 min-h-[120px] flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900">{property.name}</span>
              <span className="text-xs text-gray-500">({property.type})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {property.catalog_source && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {property.catalog_source}
                </span>
              )}
              {property.required && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">Required</span>
              )}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isSelected}
            onClick={() => toggleProperty(property.name)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isSelected ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isSelected ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="min-w-0">
          {isSelected && (
            <div className="mt-2">
              {count > 1 ? renderMultiProfileHint(property) : renderSingleProfileControl(property)}
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            {count === 1 && isSelected && (
              <button
                type="button"
                onClick={() => {
                  const v = getOneGeneratedPropertyValue(property, null, null)
                  if (v !== null && v !== undefined) updatePropertyValue(property.name, v)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path fillRule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" clipRule="evenodd" />
                </svg>
                Generate
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (onEditCustomProperty) {
                onEditCustomProperty(property.name)
              } else {
                router.push(
                  `/profiles?tab=configure&action=edit&property=${encodeURIComponent(property.name)}`
                )
              }
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Profile count */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-visible">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">1</span>
            Profile count
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-11">Single profile or multiple (2–100). Country and location are set in Name &amp; location below.</p>
        </div>
        <div className="p-6">
          <div className="max-w-xl">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Number of profiles</h3>
            <div className="flex gap-3 items-stretch w-full">
              <button
                type="button"
                onClick={() => {
                  setProfileModeSingle(true)
                  setCount(1)
                  setSelectedCountries((prev) => (prev.length ? [prev[0]] : ['US']))
                }}
                className={`w-1/2 min-h-[88px] flex flex-col justify-start p-4 rounded-lg border-2 text-left transition-colors ${
                  profileModeSingle
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium block">Single</span>
                <span className="text-xs text-gray-500 mt-0.5 block">1 profile</span>
              </button>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setProfileModeSingle(false)
                  if (count < 2) setCount(2)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setProfileModeSingle(false)
                    if (count < 2) setCount(2)
                  }
                }}
                className={`w-1/2 min-h-[88px] flex flex-row items-start justify-between gap-2 p-4 rounded-lg border-2 text-left transition-colors cursor-pointer ${
                  !profileModeSingle
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium block">Multiple</span>
                  <span className="text-xs text-gray-500 mt-0.5 block">2–100 profiles</span>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCount((prev) => Math.max(2, prev - 1))
                      const id = setInterval(() => {
                        setCount((prev) => {
                          if (prev <= 2) {
                            clearInterval(id)
                            return 2
                          }
                          return prev - 1
                        })
                      }, 120)
                      const stop = () => {
                        clearInterval(id)
                        document.removeEventListener('mouseup', stop)
                        document.removeEventListener('mouseleave', stop)
                      }
                      document.addEventListener('mouseup', stop)
                      document.addEventListener('mouseleave', stop)
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-label="Decrease profile count"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={count}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!Number.isNaN(val)) setCount(Math.min(Math.max(val, 2), 100))
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-14 h-9 px-2 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCount((prev) => Math.min(100, prev + 1))
                      const id = setInterval(() => {
                        setCount((prev) => {
                          if (prev >= 100) {
                            clearInterval(id)
                            return 100
                          }
                          return prev + 1
                        })
                      }, 120)
                      const stop = () => {
                        clearInterval(id)
                        document.removeEventListener('mouseup', stop)
                        document.removeEventListener('mouseleave', stop)
                      }
                      document.addEventListener('mouseup', stop)
                      document.addEventListener('mouseleave', stop)
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-label="Increase profile count"
                  >
                    +
                  </button>
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            {/* Column 1 (1/3): Identifiers */}
            <div className="md:col-span-1 space-y-4 min-w-0">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identifiers</h3>
              <div>
                <div className="flex items-center gap-3">
                  <Toggle checked={includeEmail} onChange={setIncludeEmail} />
                  <span className="text-sm font-medium text-gray-700">Email</span>
                </div>
                {count === 1 && includeEmail && (
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Email (leave blank to auto generate)"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={includePhone}
                    onChange={setIncludePhone}
                    disabled={count > 1}
                  />
                  <span className={`text-sm font-medium ${count > 1 ? 'text-gray-400' : 'text-gray-700'}`}>Phone</span>
                </div>
                {count > 1 && (
                  <p className="text-xs text-amber-600 mt-1">Not available when generating multiple profiles (to avoid accidental real SMS).</p>
                )}
                {count === 1 && includePhone && (
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Phone (enter to enable SMS/WhatsApp)"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Toggle checked={includeExternalId} onChange={setIncludeExternalId} />
                  <span className="text-sm font-medium text-gray-700">External ID</span>
                </div>
                {count === 1 && includeExternalId && (
                  <input
                    type="text"
                    value={customExternalId}
                    onChange={(e) => setCustomExternalId(e.target.value)}
                    placeholder="External ID (leave blank to auto generate)"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Column 2 (1/3): Consent — all in one column */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Consent</h3>
              <label className={`flex items-center ${!includeEmail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
              <label className={`flex items-center ${!includePhone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
              <label className={`flex items-center ${!includePhone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
              <label className={`flex items-center ${!includePhone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
              <label className={`flex items-center ${!includePhone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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

      {/* 3. Name & location */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-visible">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">3</span>
            Name & location
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-11">Optional. Choose a country; for a single profile you can pick a specific location or leave it to auto-generate. For multiple profiles, each gets a random location from the selected country.</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-3">
                <Toggle checked={includeName} onChange={setIncludeName} />
                <span className="text-sm font-medium text-gray-700">Include name</span>
              </div>
            </div>
            {includeName && (
              count === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name (leave blank to auto generate)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name (leave blank to auto generate)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Names will be randomly generated.</p>
              )
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Toggle checked={includeLocation} onChange={setIncludeLocation} />
              <h3 className="text-sm font-medium text-gray-700">Include location</h3>
            </div>
            {includeLocation && (
              <>
                {count === 1 ? (
                  <p className="text-xs text-gray-500 mb-3">
                    Country and location determine address and locale. Pick a specific location or leave it blank to
                    auto-generate from the selected country.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">
                    For multiple profiles, each profile receives a random location from the selected country.
                  </p>
                )}

                {count === 1 ? (
                  <div className="mt-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={selectedCountries[0] || ''}
                          onChange={(e) => setSelectedCountries(e.target.value ? [e.target.value] : ['US'])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                          {availableCountries.length === 0 ? (
                            <option value="">Loading...</option>
                          ) : (
                            availableCountries.map((country) => (
                              <option key={country.code} value={country.code}>{country.name} ({country.code})</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pick a location (optional)</label>
                        <select
                          value={selectedLocationId}
                          onChange={(e) => setSelectedLocationId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Auto-generate from selected country</option>
                          {availableLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.city}, {loc.state || loc.region}, {loc.country}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Address fields are filled from the chosen location or can be edited manually. Leave location
                        blank to generate an address from the selected country.
                      </p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => set(e.target.value)}
                              placeholder={placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        value={selectedCountries[0] || ''}
                        onChange={(e) => setSelectedCountries(e.target.value ? [e.target.value] : ['US'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        {availableCountries.length === 0 ? (
                          <option value="">Loading...</option>
                        ) : (
                          availableCountries.map((country) => (
                            <option key={country.code} value={country.code}>{country.name} ({country.code})</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Custom Properties */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold mr-3">
              4
            </span>
            Custom properties
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Optional properties to include on profiles. Define them in the Configure tab; toggle which to include here.
          </p>
        </div>
        <div className="p-6 border border-t-0 border-gray-200 rounded-b-lg">
          <div className="flex flex-wrap justify-end mb-4">
            <button
              type="button"
              onClick={() => {
                if (onAddCustomProperty) {
                  onAddCustomProperty()
                } else {
                  router.push('/profiles?tab=configure&action=add')
                }
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Add property
            </button>
          </div>
          {availableProperties.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              No properties available. Configure properties first.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <select
                  value={activePropertyGroupId}
                  onChange={(e) => setActivePropertyGroupId(e.target.value)}
                  aria-label="Property category"
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {propertyNavItems.map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSelectAllProperties}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 shrink-0"
                >
                  {availableProperties.every((p) => selectedProperties[p.name])
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">{leftPropertyList.map(renderPropertyCard)}</div>
                <div className="space-y-3">{rightPropertyList.map(renderPropertyCard)}</div>
              </div>
            </>
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
