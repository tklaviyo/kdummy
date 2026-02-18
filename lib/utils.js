// Utility functions for generating dummy data

/**
 * Generate email in format firstname.lastname@domain.
 * Uses random name for first/last when not provided. If usedEmails Set is passed, appends a random 3-digit suffix on collision to ensure uniqueness.
 * @param {string} firstName - optional
 * @param {string} lastName - optional
 * @param {{ domain?: string, usedEmails?: Set<string> }} [options] - domain defaults to 'klaviyo-demo.com'
 */
export function generateEmail(firstName, lastName, options = {}) {
  const domain = (options.domain || 'klaviyo-demo.com').replace(/^@+/, '').toLowerCase()
  let fname, lname
  if (firstName) {
    fname = String(firstName).toLowerCase().replace(/\s+/g, '')
  } else {
    fname = generateRandomName().first.toLowerCase()
  }
  if (lastName) {
    lname = String(lastName).toLowerCase().replace(/\s+/g, '')
  } else {
    lname = generateRandomName().last.toLowerCase()
  }
  const base = `${fname}.${lname}`
  const usedEmails = options.usedEmails

  if (!usedEmails) {
    return `${base}@${domain}`
  }

  let email = `${base}@${domain}`
  if (usedEmails.has(email)) {
    let suffix
    let attempts = 0
    do {
      suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
      email = `${base}${suffix}@${domain}`
      attempts++
    } while (usedEmails.has(email) && attempts < 1000)
  }
  usedEmails.add(email)
  return email
}

// Generate random phone number (E.164 format)
export function generatePhoneNumber(country = 'US') {
  const countryCodes = {
    US: { code: '+1', length: 10 },
    UK: { code: '+44', length: 10 },
    CA: { code: '+1', length: 10 },
    AU: { code: '+61', length: 9 },
  }
  
  const config = countryCodes[country] || countryCodes.US
  const number = Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, config.length)
  return `${config.code}${number}`
}

// Generate random name
export function generateRandomName() {
  const firstNames = [
    'Sarah', 'John', 'Emily', 'Michael', 'Jessica', 'David', 'Ashley', 'James',
    'Amanda', 'Robert', 'Melissa', 'William', 'Nicole', 'Richard', 'Michelle',
    'Joseph', 'Kimberly', 'Thomas', 'Amy', 'Christopher', 'Angela', 'Daniel',
    'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Karen', 'Mark', 'Betty', 'Donald'
  ]
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
    'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
  ]
  
  return {
    first: firstNames[Math.floor(Math.random() * firstNames.length)],
    last: lastNames[Math.floor(Math.random() * lastNames.length)]
  }
}

// Generate random address
export function generateAddress(country = 'US') {
  const addresses = {
    US: {
      streets: ['Main St', 'Oak Ave', 'Park Blvd', 'Elm St', 'Maple Dr', 'Cedar Ln'],
      cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
      states: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'],
      zips: ['10001', '90001', '60601', '77001', '85001', '19101']
    },
    UK: {
      streets: ['High Street', 'Church Road', 'Park Avenue', 'Queen Street', 'King Street'],
      cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow'],
      states: ['England', 'Scotland', 'Wales'],
      zips: ['SW1A 1AA', 'M1 1AA', 'B1 1AA', 'L1 1AA', 'LS1 1AA', 'G1 1AA']
    }
  }
  
  const config = addresses[country] || addresses.US
  const streetNum = Math.floor(Math.random() * 9999) + 1
  const street = config.streets[Math.floor(Math.random() * config.streets.length)]
  const city = config.cities[Math.floor(Math.random() * config.cities.length)]
  const state = config.states[Math.floor(Math.random() * config.states.length)]
  const zip = config.zips[Math.floor(Math.random() * config.zips.length)]
  
  return {
    address1: `${streetNum} ${street}`,
    address2: Math.random() > 0.7 ? `Apt ${Math.floor(Math.random() * 100)}` : null,
    city,
    region: state,
    country: country === 'US' ? 'United States' : 'United Kingdom',
    zip
  }
}

// Generate random date
export function generateDate(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(2020, 0, 1)
  const end = endDate ? new Date(endDate) : new Date()
  const time = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return new Date(time).toISOString().split('T')[0]
}

// Generate random external ID
export function generateExternalId() {
  return `EXT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
}

// Generate random value for event properties
export function generatePropertyValue(type, propertyName) {
  switch (type) {
    case 'string':
      if (propertyName.toLowerCase().includes('id')) {
        return `ID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      }
      if (propertyName.toLowerCase().includes('url') || propertyName.toLowerCase().includes('image')) {
        return `https://example.com/${Math.random().toString(36).substring(2, 9)}.jpg`
      }
      return `Sample ${propertyName}`
    case 'integer':
      return Math.floor(Math.random() * 100) + 1
    case 'decimal':
      return parseFloat((Math.random() * 1000).toFixed(2))
    case 'boolean':
      return Math.random() > 0.5
    case 'array':
      return ['Item 1', 'Item 2', 'Item 3']
    case 'date':
      return generateDate()
    default:
      return 'value'
  }
}

// Generate profile properties
export function generateProfileProperties(customProperties = {}) {
  const defaults = {
    gender: ['male', 'female', 'other'][Math.floor(Math.random() * 3)],
    birthday: generateDate('1970-01-01', '2000-12-31'),
    marketing_preferences: ['newsletter', 'product updates', 'offers', 'events'][Math.floor(Math.random() * 4)],
    product_preferences: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)],
    signup_store: ['online', 'instore'][Math.floor(Math.random() * 2)],
    favourite_store: ['Store A', 'Store B', 'Store C'][Math.floor(Math.random() * 3)],
    signup_date: generateDate('2020-01-01'),
    member_since: generateDate('2020-01-01'),
    loyalty_member: Math.random() > 0.3,
    loyalty_points: Math.floor(Math.random() * 5000),
    loyalty_spend: parseFloat((Math.random() * 10000).toFixed(2)),
    current_loyalty_tier: ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)],
    next_loyalty_tier: ['Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 3)]
  }
  
  return { ...defaults, ...customProperties }
}

