// Consistent data structures for profile generation
// Ensures names match gender, locations match phone numbers, etc.

export const namesByGender = {
  female: {
    first: [
      'Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda', 'Melissa', 'Nicole', 'Michelle',
      'Kimberly', 'Amy', 'Angela', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Jennifer',
      'Elizabeth', 'Maria', 'Patricia', 'Linda', 'Barbara', 'Susan', 'Margaret'
    ],
    last: [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
    ]
  },
  male: {
    first: [
      'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph',
      'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
      'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George'
    ],
    last: [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
    ]
  },
  other: {
    first: [
      'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
      'Sage', 'River', 'Phoenix', 'Skylar', 'Blake', 'Cameron', 'Dakota', 'Hayden'
    ],
    last: [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
    ]
  }
}

// Complete location data with all related fields
export const locationData = [
  {
    id: 'loc-ny',
    city: 'New York',
    state: 'NY',
    region: 'New York',
    country: 'United States',
    country_code: 'US',
    zip: '10001',
    phone_prefix: '+1',
    locale: 'en-US',
    streets: ['Main St', 'Broadway', '5th Ave', 'Park Ave', 'Lexington Ave'],
    area_code: '212'
  },
  {
    id: 'loc-la',
    city: 'Los Angeles',
    state: 'CA',
    region: 'California',
    country: 'United States',
    country_code: 'US',
    zip: '90001',
    phone_prefix: '+1',
    locale: 'en-US',
    streets: ['Sunset Blvd', 'Hollywood Blvd', 'Wilshire Blvd', 'Santa Monica Blvd'],
    area_code: '310'
  },
  {
    id: 'loc-chicago',
    city: 'Chicago',
    state: 'IL',
    region: 'Illinois',
    country: 'United States',
    country_code: 'US',
    zip: '60601',
    phone_prefix: '+1',
    locale: 'en-US',
    streets: ['Michigan Ave', 'State St', 'Wacker Dr', 'Lake Shore Dr'],
    area_code: '312'
  },
  {
    id: 'loc-london',
    city: 'London',
    state: null,
    region: 'England',
    country: 'United Kingdom',
    country_code: 'UK',
    zip: 'SW1A 1AA',
    phone_prefix: '+44',
    locale: 'en-GB',
    streets: ['High Street', 'Oxford Street', 'Regent Street', 'Baker Street'],
    area_code: '20'
  },
  {
    id: 'loc-manchester',
    city: 'Manchester',
    state: null,
    region: 'England',
    country: 'United Kingdom',
    country_code: 'UK',
    zip: 'M1 1AA',
    phone_prefix: '+44',
    locale: 'en-GB',
    streets: ['Market Street', 'Deansgate', 'Oxford Road', 'Princess Street'],
    area_code: '161'
  },
  {
    id: 'loc-toronto',
    city: 'Toronto',
    state: 'ON',
    region: 'Ontario',
    country: 'Canada',
    country_code: 'CA',
    zip: 'M5H 2N2',
    phone_prefix: '+1',
    locale: 'en-CA',
    streets: ['Yonge Street', 'Bay Street', 'Queen Street', 'King Street'],
    area_code: '416'
  },
  {
    id: 'loc-sydney',
    city: 'Sydney',
    state: 'NSW',
    region: 'New South Wales',
    country: 'Australia',
    country_code: 'AU',
    zip: '2000',
    phone_prefix: '+61',
    locale: 'en-AU',
    streets: ['George Street', 'Pitt Street', 'Oxford Street', 'King Street'],
    area_code: '2'
  }
]

// Get consistent location data
export function getConsistentLocation(locationId = null) {
  if (locationId) {
    return locationData.find(loc => loc.id === locationId) || locationData[Math.floor(Math.random() * locationData.length)]
  }
  return locationData[Math.floor(Math.random() * locationData.length)]
}

// Get name based on gender
export function getNameByGender(gender = null) {
  const genderKey = gender || ['female', 'male', 'other'][Math.floor(Math.random() * 3)]
  const names = namesByGender[genderKey] || namesByGender.female
  
  return {
    first: names.first[Math.floor(Math.random() * names.first.length)],
    last: names.last[Math.floor(Math.random() * names.last.length)],
    gender: genderKey
  }
}

// Generate phone number from location
export function generatePhoneFromLocation(location) {
  if (!location) return null
  
  // Calculate remaining digits needed (total length minus prefix and area code)
  const areaCodeLength = location.area_code ? location.area_code.length : 0
  const totalLength = location.country_code === 'AU' ? 9 : 10
  const remainingLength = totalLength - areaCodeLength
  
  // Generate remaining digits
  const number = Math.floor(Math.random() * Math.pow(10, remainingLength))
    .toString()
    .padStart(remainingLength, '0')
  
  return `${location.phone_prefix}${location.area_code || ''}${number}`
}

// Generate address from location
export function generateAddressFromLocation(location) {
  if (!location) return null
  
  const streetNum = Math.floor(Math.random() * 9999) + 1
  const street = location.streets[Math.floor(Math.random() * location.streets.length)]
  
  return {
    address1: `${streetNum} ${street}`,
    address2: Math.random() > 0.7 ? `Apt ${Math.floor(Math.random() * 100)}` : null,
    city: location.city,
    region: location.state || location.region,
    country: location.country,
    zip: location.zip
  }
}

// Get all first names for a gender
export function getFirstNamesByGender(gender) {
  const names = namesByGender[gender] || namesByGender.female
  return names.first
}

// Get all last names
export function getAllLastNames() {
  return namesByGender.female.last // All genders share last names
}

// Get all locations
export function getAllLocations() {
  return locationData
}

