import { NextResponse } from 'next/server'
import { getApiKeyFromRequest, getApiKeyDataType, setApiKeyDataType } from '@/lib/serverStorage'

// Profile property templates - these are the original defaults
const originalDefaultPropertyTemplates = {
  gender: {
    name: 'gender',
    type: 'string',
    description: 'Gender of the profile',
    default_value: null,
    options: ['Male', 'female', 'other'],
    required: false,
    object_property_mapping: null,
  },
  birthday: {
    name: 'birthday',
    type: 'date',
    description: 'Birthday of the profile',
    default_value: null,
    required: false,
    object_property_mapping: null,
  },
  marketing_preferences: {
    name: 'marketing_preferences',
    type: 'array',
    description: 'Preferred topics of marketing',
    default_value: null,
    options: ['Newsletter', 'product updates', 'events', 'news', 'offers'],
    required: false,
    object_property_mapping: null,
  },
  product_preferences: {
    name: 'product_preferences',
    type: 'array',
    description: 'Preferred product category',
    default_value: null,
    catalog_source: 'products',
    required: false,
    object_property_mapping: null,
  },
  signup_store: {
    name: 'signup_store',
    type: 'string',
    description: 'Store where profile signed up',
    default_value: null,
    catalog_source: 'stores',
    required: false,
    object_property_mapping: null,
  },
  favourite_store: {
    name: 'favourite_store',
    type: 'string',
    description: 'Favorite store location',
    default_value: null,
    catalog_source: 'stores',
    required: false,
    object_property_mapping: null,
  },
  recent_store: {
    name: 'recent_store',
    type: 'string',
    description: 'Recent store location',
    default_value: null,
    catalog_source: 'stores',
    required: false,
    object_property_mapping: null,
  },
  signup_date: {
    name: 'signup_date',
    type: 'date',
    description: 'Date when profile signed up',
    default_value: null,
    required: false,
    object_property_mapping: null,
  },
  loyalty_member: {
    name: 'loyalty_member',
    type: 'boolean',
    description: 'Whether profile is a loyalty member',
    default_value: false,
    required: false,
    object_property_mapping: null,
  },
  loyalty_signup_date: {
    name: 'loyalty_signup_date',
    type: 'date',
    description: 'Date when profile signed up for loyalty program',
    default_value: null,
    required: false,
    object_property_mapping: null,
  },
  current_loyalty_tier: {
    name: 'current_loyalty_tier',
    type: 'string',
    description: 'Current loyalty tier level',
    default_value: null,
    catalog_source: 'loyalty',
    required: false,
    object_property_mapping: null,
  },
  next_loyalty_tier: {
    name: 'next_loyalty_tier',
    type: 'string',
    description: 'Next loyalty tier to achieve',
    default_value: null,
    catalog_source: 'loyalty',
    required: false,
    object_property_mapping: null,
  },
  loyalty_points: {
    name: 'loyalty_points',
    type: 'integer',
    description: 'Current loyalty points balance',
    default_value: 0,
    catalog_source: 'loyalty',
    required: false,
    object_property_mapping: null,
  },
  loyalty_spend: {
    name: 'loyalty_spend',
    type: 'decimal',
    description: 'Total loyalty program spending',
    default_value: 0,
    catalog_source: 'loyalty',
    required: false,
    object_property_mapping: null,
  },
}

function getDefaultPropertyTemplates(apiKey) {
  // Get stored defaults for this API key, or initialize with originals
  const storedDefaults = getApiKeyDataType(apiKey, 'profile_properties_defaults', null)
  const defaultPropertyTemplates = storedDefaults || JSON.parse(JSON.stringify(originalDefaultPropertyTemplates))
  
  // Merge defaults with any modifications, preserving original_name
  const templates = {}
  Object.keys(defaultPropertyTemplates).forEach(key => {
    const original = originalDefaultPropertyTemplates[key]
    const current = defaultPropertyTemplates[key]
    templates[current.name] = {
      ...current,
      original_name: original.name,
      enabled: current.enabled !== undefined ? current.enabled : true, // Default to enabled
    }
  })
  return templates
}

export async function GET(request) {
  const apiKey = getApiKeyFromRequest(request)
  if (!apiKey) {
    return NextResponse.json(
      { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const includeCustom = searchParams.get('include_custom') === 'true'

  const templates = getDefaultPropertyTemplates(apiKey)
  const customProperties = getApiKeyDataType(apiKey, 'profile_properties_custom', {})
  
  if (includeCustom) {
    // Merge custom properties, ensuring they have the same structure
    Object.keys(customProperties).forEach(key => {
      const customProp = customProperties[key]
      templates[key] = {
        ...customProp,
        // Ensure enabled defaults to true if not set
        enabled: customProp.enabled !== undefined ? customProp.enabled : true,
        // Custom properties don't have original_name (they're not defaults)
        original_name: customProp.original_name || null,
      }
    })
  }

  return NextResponse.json(
    {
      data: Object.values(templates),
      meta: {
        count: Object.keys(templates).length,
        default_count: Object.keys(getDefaultPropertyTemplates(apiKey)).length,
        custom_count: Object.keys(customProperties).length,
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
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data || !data.name || !data.type) {
      return NextResponse.json(
        { errors: [{ detail: 'Property name and type are required' }] },
        { status: 400 }
      )
    }

    const property = {
      name: data.name,
      type: data.type,
      description: data.description || '',
      default_value: data.default_value || null,
      options: data.options || null,
      catalog_source: data.catalog_source || null,
      required: data.required || false,
      object_property_mapping: data.object_property_mapping || null,
      enabled: data.enabled !== undefined ? data.enabled : true, // Default to enabled
    }

    const defaultPropertyTemplates = getDefaultPropertyTemplates(apiKey)
    const customProperties = getApiKeyDataType(apiKey, 'profile_properties_custom', {})

    // Check if it's a default property
    if (originalDefaultPropertyTemplates[data.name] || defaultPropertyTemplates[data.name]) {
      return NextResponse.json(
        { errors: [{ detail: 'Property with this name already exists. Use PUT to update.' }] },
        { status: 400 }
      )
    }

    customProperties[data.name] = property
    setApiKeyDataType(apiKey, 'profile_properties_custom', customProperties)

    return NextResponse.json(
      { data: property },
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
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data } = body
    const { searchParams } = new URL(request.url)
    const oldName = searchParams.get('old_name')

    if (!oldName) {
      return NextResponse.json(
        { errors: [{ detail: 'old_name parameter is required' }] },
        { status: 400 }
      )
    }

    if (!data || !data.name || !data.type) {
      return NextResponse.json(
        { errors: [{ detail: 'Property name and type are required' }] },
        { status: 400 }
      )
    }

    // Check if it's a default property (by original name)
    const originalName = data.original_name || oldName
    const isDefaultProperty = originalDefaultPropertyTemplates[originalName] !== undefined

    if (isDefaultProperty) {
      // Update default property template
      const originalTemplate = originalDefaultPropertyTemplates[originalName]
      const storedDefaults = getApiKeyDataType(apiKey, 'profile_properties_defaults', null)
      const defaultPropertyTemplates = storedDefaults || JSON.parse(JSON.stringify(originalDefaultPropertyTemplates))
      
      // Update the default property
      defaultPropertyTemplates[originalName] = {
        name: data.name,
        type: data.type,
        description: data.description || '',
        default_value: data.default_value || null,
        options: data.options || null,
        catalog_source: data.catalog_source || null,
        required: data.required || false,
        object_property_mapping: data.object_property_mapping || null,
        enabled: data.enabled !== undefined ? data.enabled : (defaultPropertyTemplates[originalName]?.enabled !== undefined ? defaultPropertyTemplates[originalName].enabled : true),
      }

      // Save updated defaults
      setApiKeyDataType(apiKey, 'profile_properties_defaults', defaultPropertyTemplates)

      const updatedProperty = {
        ...defaultPropertyTemplates[originalName],
        original_name: originalTemplate.name,
      }

      return NextResponse.json(
        { data: updatedProperty },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
    } else {
      // Update custom property
      const customProperties = getApiKeyDataType(apiKey, 'profile_properties_custom', {})
      
      if (!customProperties[oldName]) {
        return NextResponse.json(
          { errors: [{ detail: 'Property not found' }] },
          { status: 404 }
        )
      }

      const property = {
        name: data.name,
        type: data.type,
        description: data.description || '',
        default_value: data.default_value || null,
        options: data.options || null,
        catalog_source: data.catalog_source || null,
        required: data.required || false,
        object_property_mapping: data.object_property_mapping || null,
        enabled: data.enabled !== undefined ? data.enabled : (customProperties[oldName]?.enabled !== undefined ? customProperties[oldName].enabled : true),
      }

      // If name changed, delete old and create new
      if (oldName !== data.name) {
        delete customProperties[oldName]
      }

      customProperties[data.name] = property
      setApiKeyDataType(apiKey, 'profile_properties_custom', customProperties)

      return NextResponse.json(
        { data: property },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.api+json',
          },
        }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { errors: [{ detail: error.message || 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  const apiKey = getApiKeyFromRequest(request)
  if (!apiKey) {
    return NextResponse.json(
      { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const propertyName = searchParams.get('name')

  if (!propertyName) {
    return NextResponse.json(
      { errors: [{ detail: 'Property name is required' }] },
      { status: 400 }
    )
  }

  if (originalDefaultPropertyTemplates[propertyName]) {
    return NextResponse.json(
      { errors: [{ detail: 'Cannot delete default property' }] },
      { status: 400 }
    )
  }

  const customProperties = getApiKeyDataType(apiKey, 'profile_properties_custom', {})
  
  if (!customProperties[propertyName]) {
    return NextResponse.json(
      { errors: [{ detail: 'Property not found' }] },
      { status: 404 }
    )
  }

  delete customProperties[propertyName]
  setApiKeyDataType(apiKey, 'profile_properties_custom', customProperties)

  return NextResponse.json(
    { data: { message: 'Property deleted successfully' } },
    { status: 200 }
  )
}

export async function PATCH(request) {
  const apiKey = getApiKeyFromRequest(request)
  if (!apiKey) {
    return NextResponse.json(
      { errors: [{ detail: 'API key is required. Provide via x-api-key header or api_key query parameter.' }] },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const propertyName = searchParams.get('name')
  const body = await request.json().catch(() => ({}))
  const { enabled } = body.data || body

  if (!propertyName) {
    return NextResponse.json(
      { errors: [{ detail: 'Property name is required' }] },
      { status: 400 }
    )
  }

  if (enabled === undefined) {
    return NextResponse.json(
      { errors: [{ detail: 'enabled field is required' }] },
      { status: 400 }
    )
  }

  // Check if it's a default property
  const storedDefaults = getApiKeyDataType(apiKey, 'profile_properties_defaults', null)
  const defaultPropertyTemplates = storedDefaults || JSON.parse(JSON.stringify(originalDefaultPropertyTemplates))
  const isDefaultProperty = originalDefaultPropertyTemplates[propertyName] !== undefined || defaultPropertyTemplates[propertyName] !== undefined

  if (isDefaultProperty) {
    // Update default property enabled status
    if (!defaultPropertyTemplates[propertyName]) {
      // Initialize if it doesn't exist
      defaultPropertyTemplates[propertyName] = { ...originalDefaultPropertyTemplates[propertyName] }
    }
    defaultPropertyTemplates[propertyName].enabled = enabled
    setApiKeyDataType(apiKey, 'profile_properties_defaults', defaultPropertyTemplates)

    const updatedProperty = {
      ...defaultPropertyTemplates[propertyName],
      original_name: originalDefaultPropertyTemplates[propertyName]?.name || propertyName,
    }

    return NextResponse.json(
      { data: updatedProperty },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  } else {
    // Update custom property enabled status
    const customProperties = getApiKeyDataType(apiKey, 'profile_properties_custom', {})
    
    if (!customProperties[propertyName]) {
      return NextResponse.json(
        { errors: [{ detail: 'Property not found' }] },
        { status: 404 }
      )
    }

    customProperties[propertyName].enabled = enabled
    setApiKeyDataType(apiKey, 'profile_properties_custom', customProperties)

    return NextResponse.json(
      { data: customProperties[propertyName] },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )
  }
}
