// Utility functions for working with countries

/**
 * Generate phone number based on country
 */
export function generatePhoneFromCountry(country, areaCode = null) {
  if (!country) return null
  
  const format = country.phone_format || { length: 10, area_code_length: 3 }
  const areaCodeLength = areaCode ? areaCode.length : format.area_code_length
  const remainingLength = format.length - areaCodeLength
  
  // Generate remaining digits
  const number = Math.floor(Math.random() * Math.pow(10, remainingLength))
    .toString()
    .padStart(remainingLength, '0')
  
  const finalAreaCode = areaCode || generateAreaCode(country, format.area_code_length)
  
  return `${country.phone_prefix}${finalAreaCode}${number}`
}

/**
 * Generate area code based on country
 */
function generateAreaCode(country, length) {
  // Common area codes by country (can be expanded)
  const areaCodes = {
    'US': ['212', '310', '312', '415', '646', '713', '818', '917'],
    'CA': ['416', '514', '604', '613', '647', '778'],
    'UK': ['20', '161', '141', '121', '113'],
    'AU': ['2', '3', '7', '8'],
    'DE': ['30', '40', '89', '221'],
    'FR': ['1', '2', '3', '4', '5'],
    'JP': ['3', '6', '11', '52'],
    'MX': ['55', '81', '33'],
    'BR': ['11', '21', '31', '41'],
    'IN': ['11', '22', '33', '44', '80']
  }
  
  const codes = areaCodes[country.code] || []
  if (codes.length > 0) {
    return codes[Math.floor(Math.random() * codes.length)]
  }
  
  // Generate random area code
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0')
}

/**
 * Generate zip/postal code based on country format
 */
export function generateZipFromCountry(country) {
  if (!country || !country.address_format) return '00000'
  
  const format = country.address_format.zip_format || 'XXXXX'
  let zip = ''
  
  for (let i = 0; i < format.length; i++) {
    const char = format[i]
    if (char === 'X' || char === '0') {
      zip += Math.floor(Math.random() * 10).toString()
    } else if (char === ' ') {
      zip += ' '
    } else {
      zip += char
    }
  }
  
  return zip
}

/**
 * Get locale from country
 */
export function getLocaleFromCountry(country) {
  return country?.locale || 'en-US'
}

/**
 * Format address based on country format
 */
export function formatAddressForCountry(address, country) {
  if (!country || !country.address_format) return address
  
  const format = country.address_format
  
  return {
    ...address,
    state_label: format.state_label || 'State',
    zip_label: format.zip_label || 'ZIP Code',
    has_state: format.has_state !== false
  }
}

/**
 * Get country-specific street name examples
 */
export function getStreetExamplesForCountry(country) {
  const streetExamples = {
    'US': ['Main St', 'Broadway', '5th Ave', 'Park Ave', 'Oak St', 'Elm St'],
    'UK': ['High Street', 'Church Road', 'Park Avenue', 'Queen Street', 'King Street'],
    'CA': ['Yonge Street', 'Bay Street', 'Queen Street', 'King Street', 'Main Street'],
    'AU': ['George Street', 'Pitt Street', 'Oxford Street', 'King Street', 'Collins Street'],
    'DE': ['Hauptstraße', 'Bahnhofstraße', 'Kirchstraße', 'Dorfstraße'],
    'FR': ['Rue de la Paix', 'Avenue des Champs', 'Boulevard Saint-Germain'],
    'JP': ['銀座', '新宿', '渋谷', '表参道'],
    'MX': ['Avenida Reforma', 'Calle Principal', 'Boulevard'],
    'BR': ['Avenida Paulista', 'Rua Principal', 'Avenida Atlântica'],
    'IN': ['MG Road', 'Park Street', 'Connaught Place']
  }
  
  return streetExamples[country?.code] || ['Main Street', 'High Street', 'Park Avenue']
}

