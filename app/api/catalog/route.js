import { NextResponse } from 'next/server'

// Mock catalog data
let products = [
  { id: 'PROD-001', name: 'Wireless Headphones', category: 'Electronics', price: 99.99 },
  { id: 'PROD-002', name: 'Smart Watch', category: 'Electronics', price: 249.99 },
  { id: 'PROD-003', name: 'Running Shoes', category: 'Clothing', price: 79.99 },
  { id: 'PROD-004', name: 'Coffee Maker', category: 'Home', price: 129.99 },
]

let locations = [
  { id: 'LOC-001', name: 'Downtown Store', city: 'New York', state: 'NY', country: 'US' },
  { id: 'LOC-002', name: 'Mall Location', city: 'Los Angeles', state: 'CA', country: 'US' },
  { id: 'LOC-003', name: 'Airport Store', city: 'Chicago', state: 'IL', country: 'US' },
  { id: 'LOC-004', name: 'City Center', city: 'London', country: 'UK' },
]

let reservations = [
  { id: 'RES-001', type: 'Hotel', name: 'Grand Hotel', location: 'New York' },
  { id: 'RES-002', type: 'Restaurant', name: 'Fine Dining', location: 'Los Angeles' },
  { id: 'RES-003', type: 'Event', name: 'Concert Hall', location: 'Chicago' },
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // products, locations, reservations

  let data = []
  switch (type) {
    case 'products':
      data = products
      break
    case 'locations':
      data = locations
      break
    case 'reservations':
      data = reservations
      break
    default:
      return NextResponse.json(
        {
          data: {
            products: products,
            locations: locations,
            reservations: reservations,
          },
        },
        {
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
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

export async function POST(request) {
  try {
    const body = await request.json()
    const { data } = body
    const { type, attributes } = data

    if (!type || !attributes) {
      return NextResponse.json(
        { errors: [{ detail: 'Type and attributes are required' }] },
        { status: 400 }
      )
    }

    let newItem
    switch (type) {
      case 'product':
        newItem = {
          id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
          ...attributes,
        }
        products.push(newItem)
        break
      case 'location':
        newItem = {
          id: `LOC-${String(locations.length + 1).padStart(3, '0')}`,
          ...attributes,
        }
        locations.push(newItem)
        break
      case 'reservation':
        newItem = {
          id: `RES-${String(reservations.length + 1).padStart(3, '0')}`,
          ...attributes,
        }
        reservations.push(newItem)
        break
      default:
        return NextResponse.json(
          { errors: [{ detail: 'Invalid type. Must be product, location, or reservation' }] },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { data: newItem },
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

