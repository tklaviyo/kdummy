// Generate locations from country data
import { getStreetExamplesForCountry, generateZipFromCountry } from './countryUtils'

/**
 * Generate a location from a country and city
 */
export function generateLocationFromCountry(country, city) {
  if (!country || !city) return null

  const streets = getStreetExamplesForCountry(country)
  const streetNum = Math.floor(Math.random() * 9999) + 1
  const street = streets[Math.floor(Math.random() * streets.length)]

  return {
    id: `loc-${country.code.toLowerCase()}-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${city.name} Store`,
    city: city.name,
    state: city.state,
    region: city.region || city.state,
    country: country.name,
    country_code: country.code,
    phone_prefix: country.phone_prefix,
    area_code: city.area_code,
    zip: city.zip || generateZipFromCountry(country),
    locale: country.locale,
    streets: streets
  }
}

/**
 * Get all locations for selected countries
 */
export function getLocationsForCountries(countries) {
  if (!countries || countries.length === 0) return []

  const locations = []
  
  countries.forEach(country => {
    if (!country || !country.code) return // Skip invalid countries
    
    if (country.cities && country.cities.length > 0) {
      country.cities.forEach(city => {
        const location = generateLocationFromCountry(country, city)
        if (location) {
          locations.push(location)
        }
      })
    } else {
      // If country has no cities defined, create a default location
      const countryName = country.name || country.code || 'Unknown'
      const defaultCity = {
        name: countryName.split(' ')[0], // Use first word of country name
        state: null,
        region: countryName,
        zip: '00000',
        area_code: country.phone_format?.area_code_length ? '0'.repeat(country.phone_format.area_code_length) : '0'
      }
      const location = generateLocationFromCountry(country, defaultCity)
      if (location) {
        locations.push(location)
      }
    }
  })

  return locations
}

/**
 * Get a random location from selected countries
 */
export function getRandomLocationFromCountries(countries) {
  const locations = getLocationsForCountries(countries)
  if (locations.length === 0) return null
  
  return locations[Math.floor(Math.random() * locations.length)]
}

