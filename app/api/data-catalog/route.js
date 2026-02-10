import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, getApiKeyDataType, setApiKeyDataType } from '@/lib/serverStorage'

// Default Data Catalog structure
const defaultDataCatalog = {
  loyalty: {
    tiers: [
      { name: 'Bronze', points_threshold: 0, spend_threshold: 0 },
      { name: 'Silver', points_threshold: 1000, spend_threshold: 500 },
      { name: 'Gold', points_threshold: 5000, spend_threshold: 2500 },
      { name: 'Platinum', points_threshold: 10000, spend_threshold: 5000 },
    ],
    points_per_dollar: 1,
    reward_thresholds: [
      { points: 100, reward: '$5 off' },
      { points: 500, reward: '$25 off' },
      { points: 1000, reward: '$50 off' },
    ],
  },
  // Locations start empty; templates are applied explicitly from the UI when the user chooses to generate them.
  locations: [],
  products: [
    { id: 'PROD-001', name: 'Wireless Headphones', category: 'Electronics', price: 99.99 },
    { id: 'PROD-002', name: 'Smart Watch', category: 'Electronics', price: 249.99 },
    { id: 'PROD-003', name: 'Running Shoes', category: 'Clothing', price: 79.99 },
    { id: 'PROD-004', name: 'Coffee Maker', category: 'Home', price: 129.99 },
  ],
  reservations: [
    { id: 'RES-001', type: 'Hotel', name: 'Grand Hotel', location: 'New York' },
    { id: 'RES-002', type: 'Restaurant', name: 'Fine Dining', location: 'Los Angeles' },
    { id: 'RES-003', type: 'Event', name: 'Concert Hall', location: 'Chicago' },
  ],
}

export async function GET(request) {
  const apiKey = getApiKeyFromRequest(request)
  if (!apiKey) {
    return NextResponse.json(
      { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
      { status: 400 }
    )
  }

  // Get data catalog for this API key, or use defaults
  const dataCatalog = getApiKeyDataType(apiKey, 'data_catalog', defaultDataCatalog)

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // loyalty, locations, products, reservations

  if (type) {
    let data = []
    switch (type) {
      case 'loyalty':
        return NextResponse.json(
          { data: dataCatalog.loyalty },
          {
            headers: {
              'Content-Type': 'application/vnd.api+json',
            },
          }
        )
      case 'locations':
        data = dataCatalog.locations || []
        break
      case 'products':
        data = dataCatalog.products
        break
      case 'reservations':
        data = dataCatalog.reservations
        break
      default:
        return NextResponse.json(
          { errors: [{ detail: 'Invalid type' }] },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  }

  // Return all data
  return NextResponse.json(
    { data: dataCatalog },
    {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    }
  )
}

export async function POST(request) {
  try {
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, items, item } = body

    if (!type) {
      return NextResponse.json(
        { errors: [{ detail: 'Type is required' }] },
        { status: 400 }
      )
    }

    const dataCatalog = getApiKeyDataType(apiKey, 'data_catalog', defaultDataCatalog)

    // Support bulk insert (items array) or single insert (item object)
    if (items && Array.isArray(items)) {
      if (!dataCatalog[type]) {
        dataCatalog[type] = []
      }
      
      items.forEach(item => {
        if (!item.id) {
          // Generate ID if not provided - use item_type to determine prefix
          let prefix = 'ITEM'
          if (type === 'locations') {
            prefix = 'LOC'
          } else if (item.item_type === 'product') {
            prefix = 'PROD'
          } else if (item.item_type === 'service') {
            prefix = 'SERV'
          } else if (item.item_type === 'subscription') {
            prefix = 'SUB'
          }
          const currentCount = dataCatalog[type].length
          item.id = `${prefix}-${String(currentCount + 1).padStart(3, '0')}`
        }
        dataCatalog[type].push(item)
      })

      setApiKeyDataType(apiKey, 'data_catalog', dataCatalog)
      return NextResponse.json(
        { data: items },
        {
          status: 201,
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
    } else if (item) {
      // Single insert
      if (!dataCatalog[type]) {
        dataCatalog[type] = []
      }

      // Generate ID if not provided - use item_type to determine prefix
      let prefix = 'ITEM'
      if (type === 'locations') {
        prefix = 'LOC'
      } else if (item.item_type === 'product') {
        prefix = 'PROD'
      } else if (item.item_type === 'service') {
        prefix = 'SERV'
      } else if (item.item_type === 'subscription') {
        prefix = 'SUB'
      }
      const newItem = {
        id: item.id || `${prefix}-${String(dataCatalog[type].length + 1).padStart(3, '0')}`,
        ...item,
      }
      dataCatalog[type].push(newItem)

      setApiKeyDataType(apiKey, 'data_catalog', dataCatalog)
      return NextResponse.json(
        { data: newItem },
        {
          status: 201,
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
    } else {
      return NextResponse.json(
        { errors: [{ detail: 'Either items array or item object is required' }] },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, item, id } = body

    if (!type || !item) {
      return NextResponse.json(
        { errors: [{ detail: 'Type and item are required' }] },
        { status: 400 }
      )
    }

    const itemId = id || item.id
    if (!itemId) {
      return NextResponse.json(
        { errors: [{ detail: 'Item id is required' }] },
        { status: 400 }
      )
    }

    const dataCatalog = getApiKeyDataType(apiKey, 'data_catalog', defaultDataCatalog)

    if (!dataCatalog[type] || !Array.isArray(dataCatalog[type])) {
      return NextResponse.json(
        { errors: [{ detail: 'Invalid type or type is not an array' }] },
        { status: 400 }
      )
    }

    const index = dataCatalog[type].findIndex(i => i.id === itemId)
    if (index === -1) {
      return NextResponse.json(
        { errors: [{ detail: 'Item not found' }] },
        { status: 404 }
      )
    }

    // Update the item, preserving the id
    dataCatalog[type][index] = { ...item, id: itemId }

    setApiKeyDataType(apiKey, 'data_catalog', dataCatalog)

    return NextResponse.json(
      { data: dataCatalog[type][index] },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { errors: [{ detail: 'Type and id are required' }] },
        { status: 400 }
      )
    }

    const dataCatalog = getApiKeyDataType(apiKey, 'data_catalog', defaultDataCatalog)

    if (!dataCatalog[type] || !Array.isArray(dataCatalog[type])) {
      return NextResponse.json(
        { errors: [{ detail: 'Invalid type or type is not an array' }] },
        { status: 400 }
      )
    }

    const index = dataCatalog[type].findIndex(i => i.id === id)
    if (index === -1) {
      return NextResponse.json(
        { errors: [{ detail: 'Item not found' }] },
        { status: 404 }
      )
    }

    dataCatalog[type].splice(index, 1)
    setApiKeyDataType(apiKey, 'data_catalog', dataCatalog)

    return NextResponse.json(
      { data: { message: 'Deleted successfully' } },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

