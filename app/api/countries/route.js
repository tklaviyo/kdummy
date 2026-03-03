import { NextResponse } from 'next/server'

// Standard set of countries with complete metadata
const defaultCountries = [
  {
    id: 'US',
    name: 'United States',
    code: 'US',
    phone_prefix: '+1',
    phone_format: {
      length: 10,
      area_code_length: 3,
      format: 'XXX-XXX-XXXX'
    },
    locale: 'en-US',
    address_format: {
      has_state: true,
      state_label: 'State',
      zip_label: 'ZIP Code',
      zip_format: 'XXXXX',
      zip_required: true
    },
    currency: 'USD',
    timezone: 'America/New_York',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'New York', state: 'NY', region: 'New York', zip: '10001', area_code: '212' },
      { name: 'Los Angeles', state: 'CA', region: 'California', zip: '90001', area_code: '310' },
      { name: 'Chicago', state: 'IL', region: 'Illinois', zip: '60601', area_code: '312' }
    ]
  },
  {
    id: 'UK',
    name: 'United Kingdom',
    code: 'GB',
    phone_prefix: '+44',
    phone_format: {
      length: 10,
      area_code_length: 2,
      format: 'XXXX XXXX XXXX'
    },
    locale: 'en-GB',
    address_format: {
      has_state: false,
      state_label: 'County',
      zip_label: 'Postcode',
      zip_format: 'XX XX',
      zip_required: true
    },
    currency: 'GBP',
    timezone: 'Europe/London',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'London', state: null, region: 'England', zip: 'SW1A 1AA', area_code: '20' },
      { name: 'Manchester', state: null, region: 'England', zip: 'M1 1AA', area_code: '161' },
      { name: 'Birmingham', state: null, region: 'England', zip: 'B1 1AA', area_code: '121' }
    ]
  },
  {
    id: 'CA',
    name: 'Canada',
    code: 'CA',
    phone_prefix: '+1',
    phone_format: {
      length: 10,
      area_code_length: 3,
      format: 'XXX-XXX-XXXX'
    },
    locale: 'en-CA',
    address_format: {
      has_state: true,
      state_label: 'Province',
      zip_label: 'Postal Code',
      zip_format: 'X0X 0X0',
      zip_required: true
    },
    currency: 'CAD',
    timezone: 'America/Toronto',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Toronto', state: 'ON', region: 'Ontario', zip: 'M5H 2N2', area_code: '416' },
      { name: 'Vancouver', state: 'BC', region: 'British Columbia', zip: 'V6B 1A1', area_code: '604' },
      { name: 'Montreal', state: 'QC', region: 'Quebec', zip: 'H3A 0G4', area_code: '514' }
    ]
  },
  {
    id: 'AU',
    name: 'Australia',
    code: 'AU',
    phone_prefix: '+61',
    phone_format: {
      length: 9,
      area_code_length: 1,
      format: 'X XXXX XXXX'
    },
    locale: 'en-AU',
    address_format: {
      has_state: true,
      state_label: 'State',
      zip_label: 'Postcode',
      zip_format: 'XXXX',
      zip_required: true
    },
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Sydney', state: 'NSW', region: 'New South Wales', zip: '2000', area_code: '2' },
      { name: 'Melbourne', state: 'VIC', region: 'Victoria', zip: '3000', area_code: '3' },
      { name: 'Brisbane', state: 'QLD', region: 'Queensland', zip: '4000', area_code: '7' }
    ]
  },
  {
    id: 'DE',
    name: 'Germany',
    code: 'DE',
    phone_prefix: '+49',
    phone_format: {
      length: 11,
      area_code_length: 2,
      format: 'XXXX XXXXXXXXX'
    },
    locale: 'de-DE',
    address_format: {
      has_state: false,
      state_label: 'State',
      zip_label: 'Postleitzahl',
      zip_format: 'XXXXX',
      zip_required: true
    },
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Berlin', state: null, region: 'Berlin', zip: '10115', area_code: '30' },
      { name: 'Munich', state: null, region: 'Bavaria', zip: '80331', area_code: '89' },
      { name: 'Hamburg', state: null, region: 'Hamburg', zip: '20095', area_code: '40' }
    ]
  },
  {
    id: 'FR',
    name: 'France',
    code: 'FR',
    phone_prefix: '+33',
    phone_format: {
      length: 9,
      area_code_length: 1,
      format: 'X XX XX XX XX'
    },
    locale: 'fr-FR',
    address_format: {
      has_state: false,
      state_label: 'Région',
      zip_label: 'Code postal',
      zip_format: 'XXXXX',
      zip_required: true
    },
    currency: 'EUR',
    timezone: 'Europe/Paris',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Paris', state: null, region: 'Île-de-France', zip: '75001', area_code: '1' },
      { name: 'Lyon', state: null, region: 'Auvergne-Rhône-Alpes', zip: '69001', area_code: '4' },
      { name: 'Marseille', state: null, region: "Provence-Alpes-Côte d'Azur", zip: '13001', area_code: '4' }
    ]
  },
  {
    id: 'JP',
    name: 'Japan',
    code: 'JP',
    phone_prefix: '+81',
    phone_format: {
      length: 10,
      area_code_length: 2,
      format: 'XX-XXXX-XXXX'
    },
    locale: 'ja-JP',
    address_format: {
      has_state: false,
      state_label: 'Prefecture',
      zip_label: '郵便番号',
      zip_format: 'XXX-XXXX',
      zip_required: true
    },
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Tokyo', state: null, region: 'Tokyo', zip: '100-0001', area_code: '3' },
      { name: 'Osaka', state: null, region: 'Osaka', zip: '530-0001', area_code: '6' },
      { name: 'Yokohama', state: null, region: 'Kanagawa', zip: '220-0001', area_code: '45' }
    ]
  },
  {
    id: 'MX',
    name: 'Mexico',
    code: 'MX',
    phone_prefix: '+52',
    phone_format: {
      length: 10,
      area_code_length: 2,
      format: 'XX XXXX XXXX'
    },
    locale: 'es-MX',
    address_format: {
      has_state: true,
      state_label: 'Estado',
      zip_label: 'Código postal',
      zip_format: 'XXXXX',
      zip_required: true
    },
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Mexico City', state: 'CDMX', region: 'Mexico City', zip: '01000', area_code: '55' },
      { name: 'Guadalajara', state: 'JAL', region: 'Jalisco', zip: '44100', area_code: '33' },
      { name: 'Monterrey', state: 'NL', region: 'Nuevo León', zip: '64000', area_code: '81' }
    ]
  },
  {
    id: 'BR',
    name: 'Brazil',
    code: 'BR',
    phone_prefix: '+55',
    phone_format: {
      length: 11,
      area_code_length: 2,
      format: 'XX XXXXX-XXXX'
    },
    locale: 'pt-BR',
    address_format: {
      has_state: true,
      state_label: 'Estado',
      zip_label: 'CEP',
      zip_format: 'XXXXX-XXX',
      zip_required: true
    },
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'São Paulo', state: 'SP', region: 'São Paulo', zip: '01000-000', area_code: '11' },
      { name: 'Rio de Janeiro', state: 'RJ', region: 'Rio de Janeiro', zip: '20000-000', area_code: '21' },
      { name: 'Brasília', state: 'DF', region: 'Distrito Federal', zip: '70000-000', area_code: '61' }
    ]
  },
  {
    id: 'IN',
    name: 'India',
    code: 'IN',
    phone_prefix: '+91',
    phone_format: {
      length: 10,
      area_code_length: 2,
      format: 'XXXXX-XXXXX'
    },
    locale: 'en-IN',
    address_format: {
      has_state: true,
      state_label: 'State',
      zip_label: 'PIN Code',
      zip_format: 'XXXXXX',
      zip_required: true
    },
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Mumbai', state: 'MH', region: 'Maharashtra', zip: '400001', area_code: '22' },
      { name: 'Delhi', state: 'DL', region: 'Delhi', zip: '110001', area_code: '11' },
      { name: 'Bangalore', state: 'KA', region: 'Karnataka', zip: '560001', area_code: '80' }
    ]
  },
  {
    id: 'NZ',
    name: 'New Zealand',
    code: 'NZ',
    phone_prefix: '+64',
    phone_format: {
      length: 9,
      area_code_length: 1,
      format: 'XX XXX XXXX'
    },
    locale: 'en-NZ',
    address_format: {
      has_state: false,
      state_label: 'Region',
      zip_label: 'Postcode',
      zip_format: 'XXXX',
      zip_required: true
    },
    currency: 'NZD',
    timezone: 'Pacific/Auckland',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Auckland', state: null, region: 'Auckland', zip: '1010', area_code: '9' },
      { name: 'Wellington', state: null, region: 'Wellington', zip: '6011', area_code: '4' },
      { name: 'Christchurch', state: null, region: 'Canterbury', zip: '8011', area_code: '3' }
    ]
  },
  {
    id: 'CN',
    name: 'China',
    code: 'CN',
    phone_prefix: '+86',
    phone_format: {
      length: 11,
      area_code_length: 2,
      format: 'XXX XXXX XXXX'
    },
    locale: 'zh-CN',
    address_format: {
      has_state: false,
      state_label: 'Province',
      zip_label: 'Postal Code',
      zip_format: 'XXXXXX',
      zip_required: true
    },
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Beijing', state: null, region: 'Beijing', zip: '100000', area_code: '10' },
      { name: 'Shanghai', state: null, region: 'Shanghai', zip: '200000', area_code: '21' },
      { name: 'Guangzhou', state: null, region: 'Guangdong', zip: '510000', area_code: '20' }
    ]
  },
  {
    id: 'SG',
    name: 'Singapore',
    code: 'SG',
    phone_prefix: '+65',
    phone_format: {
      length: 8,
      area_code_length: 0,
      format: 'XXXX XXXX'
    },
    locale: 'en-SG',
    address_format: {
      has_state: false,
      state_label: 'Region',
      zip_label: 'Postal Code',
      zip_format: 'XXXXXX',
      zip_required: true
    },
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Singapore', state: null, region: 'Central Region', zip: '018956', area_code: '' },
      { name: 'Jurong East', state: null, region: 'West Region', zip: '609606', area_code: '' },
      { name: 'Tampines', state: null, region: 'East Region', zip: '529510', area_code: '' }
    ]
  },
  {
    id: 'IT',
    name: 'Italy',
    code: 'IT',
    phone_prefix: '+39',
    phone_format: {
      length: 10,
      area_code_length: 2,
      format: 'XXX XXX XXXX'
    },
    locale: 'it-IT',
    address_format: {
      has_state: false,
      state_label: 'Province',
      zip_label: 'CAP',
      zip_format: 'XXXXX',
      zip_required: true
    },
    currency: 'EUR',
    timezone: 'Europe/Rome',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Rome', state: null, region: 'Lazio', zip: '00118', area_code: '06' },
      { name: 'Milan', state: null, region: 'Lombardy', zip: '20121', area_code: '02' },
      { name: 'Naples', state: null, region: 'Campania', zip: '80100', area_code: '081' }
    ]
  },
  {
    id: 'ES',
    name: 'Spain',
    code: 'ES',
    phone_prefix: '+34',
    phone_format: {
      length: 9,
      area_code_length: 2,
      format: 'XXX XXX XXX'
    },
    locale: 'es-ES',
    address_format: {
      has_state: false,
      state_label: 'Province',
      zip_label: 'CP',
      zip_format: 'XXXXX',
      zip_required: true
    },
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    is_default: true,
    enabled: true,
    cities: [
      { name: 'Madrid', state: null, region: 'Madrid', zip: '28001', area_code: '91' },
      { name: 'Barcelona', state: null, region: 'Catalonia', zip: '08001', area_code: '93' },
      { name: 'Valencia', state: null, region: 'Valencia', zip: '46001', area_code: '96' }
    ]
  }
]

// Custom countries (can be added by users)
let customCountries = []

// Get all countries (default + custom)
function getAllCountries() {
  return [...defaultCountries, ...customCountries]
}

// Get country by code
function getCountryByCode(code) {
  return getAllCountries().find(c => c.code === code || c.id === code)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const include_defaults = searchParams.get('include_defaults') !== 'false'
  const enabled_only = searchParams.get('enabled_only') === 'true'

  if (code) {
    const country = getCountryByCode(code)
    if (!country) {
      return NextResponse.json(
        { errors: [{ detail: 'Country not found' }] },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { data: country },
      {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  }

  let countries = include_defaults ? getAllCountries() : customCountries
  
  // Filter by enabled status if requested
  if (enabled_only) {
    countries = countries.filter(c => c.enabled !== false)
  }

  return NextResponse.json(
    {
      data: countries,
      meta: {
        count: countries.length,
        default_count: defaultCountries.length,
        custom_count: customCountries.length,
      },
    },
    {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    }
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { data } = body

    if (!data || !data.name || !data.code) {
      return NextResponse.json(
        { errors: [{ detail: 'Country name and code are required' }] },
        { status: 400 }
      )
    }

    // Check if country code already exists
    if (getCountryByCode(data.code)) {
      return NextResponse.json(
        { errors: [{ detail: 'Country with this code already exists' }] },
        { status: 400 }
      )
    }

    const newCountry = {
      id: data.code,
      name: data.name,
      code: data.code,
      phone_prefix: data.phone_prefix || '+1',
      phone_format: data.phone_format || {
        length: 10,
        area_code_length: 3,
        format: 'XXX-XXX-XXXX'
      },
      locale: data.locale || 'en-US',
      address_format: data.address_format || {
        has_state: true,
        state_label: 'State',
        zip_label: 'ZIP Code',
        zip_format: 'XXXXX',
        zip_required: true
      },
      currency: data.currency || 'USD',
      timezone: data.timezone || 'UTC',
      is_default: false,
      enabled: data.enabled !== undefined ? data.enabled : true
    }

    customCountries.push(newCountry)

    return NextResponse.json(
      { data: newCountry },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { data } = body
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { errors: [{ detail: 'Country code is required' }] },
        { status: 400 }
      )
    }

    // Check if it's a default country
    const defaultCountry = defaultCountries.find(c => c.code === code || c.id === code)
    if (defaultCountry) {
      return NextResponse.json(
        { errors: [{ detail: 'Cannot modify default countries' }] },
        { status: 400 }
      )
    }

    const countryIndex = customCountries.findIndex(c => c.code === code || c.id === code)
    if (countryIndex === -1) {
      return NextResponse.json(
        { errors: [{ detail: 'Country not found' }] },
        { status: 404 }
      )
    }

    // Update country
    customCountries[countryIndex] = {
      ...customCountries[countryIndex],
      ...data,
      id: code,
      code: code,
      is_default: false,
      enabled: data.enabled !== undefined ? data.enabled : customCountries[countryIndex].enabled !== false
    }

    return NextResponse.json(
      { data: customCountries[countryIndex] },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { errors: [{ detail: 'Country code is required' }] },
      { status: 400 }
    )
  }

  // Check if it's a default country
  const defaultCountry = defaultCountries.find(c => c.code === code || c.id === code)
  if (defaultCountry) {
    return NextResponse.json(
      { errors: [{ detail: 'Cannot delete default countries' }] },
      { status: 400 }
    )
  }

  const countryIndex = customCountries.findIndex(c => c.code === code || c.id === code)
  if (countryIndex === -1) {
    return NextResponse.json(
      { errors: [{ detail: 'Country not found' }] },
      { status: 404 }
    )
  }

  customCountries.splice(countryIndex, 1)

  return NextResponse.json(
    { data: { message: 'Country deleted successfully' } },
    { status: 200 }
  )
}

// PATCH endpoint for toggling enabled status
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const body = await request.json()
    const { enabled } = body

    if (!code) {
      return NextResponse.json(
        { errors: [{ detail: 'Country code is required' }] },
        { status: 400 }
      )
    }

    if (enabled === undefined) {
      return NextResponse.json(
        { errors: [{ detail: 'enabled status is required' }] },
        { status: 400 }
      )
    }

    // Find country (default or custom)
    const defaultCountryIndex = defaultCountries.findIndex(c => c.code === code || c.id === code)
    const customCountryIndex = customCountries.findIndex(c => c.code === code || c.id === code)

    if (defaultCountryIndex !== -1) {
      // Update default country
      defaultCountries[defaultCountryIndex].enabled = enabled
      return NextResponse.json(
        { data: defaultCountries[defaultCountryIndex] },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
    } else if (customCountryIndex !== -1) {
      // Update custom country
      customCountries[customCountryIndex].enabled = enabled
      return NextResponse.json(
        { data: customCountries[customCountryIndex] },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
    } else {
      return NextResponse.json(
        { errors: [{ detail: 'Country not found' }] },
        { status: 404 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

