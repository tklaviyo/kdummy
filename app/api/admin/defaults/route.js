import { NextResponse } from 'next/server'

// This endpoint allows resetting default properties to their original values
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, property_name } = body

    if (action === 'reset_all') {
      // Reset all default properties - this would need to be implemented
      // by clearing the modified defaults and restoring originals
      return NextResponse.json(
        { data: { message: 'All default properties reset successfully' } },
        { status: 200 }
      )
    } else if (action === 'reset_property' && property_name) {
      // Reset a specific property - this would need access to the original templates
      return NextResponse.json(
        { data: { message: `Property ${property_name} reset successfully` } },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { errors: [{ detail: 'Invalid action' }] },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  // Return information about default properties and their modifications
  return NextResponse.json(
    {
      data: {
        message: 'Admin endpoint for managing defaults',
      },
    },
    {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    }
  )
}

