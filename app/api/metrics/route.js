import { NextResponse } from 'next/server'

// In-memory storage for metrics (for reference)
let metrics = []

export async function GET(request) {
  // Return list of available metric templates
  const metricTemplates = [
    {
      name: 'TEST Viewed Product',
      category: 'ecommerce',
      default_properties: {
        ProductName: 'string',
        ProductID: 'string',
        SKU: 'string',
        Categories: 'array',
        ImageURL: 'string',
        URL: 'string',
        Price: 'decimal',
      },
    },
    {
      name: 'TEST Added to Cart',
      category: 'ecommerce',
      default_properties: {
        ProductName: 'string',
        ProductID: 'string',
        SKU: 'string',
        Quantity: 'integer',
        Price: 'decimal',
        AddedItemPrice: 'decimal',
      },
    },
    {
      name: 'TEST Started Checkout',
      category: 'ecommerce',
      default_properties: {
        CheckoutID: 'string',
        ItemNames: 'array',
        ItemCount: 'integer',
        Value: 'decimal',
      },
    },
    {
      name: 'TEST Placed Order',
      category: 'ecommerce',
      default_properties: {
        OrderID: 'string',
        ItemNames: 'array',
        ItemCount: 'integer',
        DiscountCode: 'string',
        DiscountValue: 'decimal',
      },
    },
    {
      name: 'TEST Ordered Product',
      category: 'ecommerce',
      default_properties: {
        ProductName: 'string',
        ProductID: 'string',
        SKU: 'string',
        Quantity: 'integer',
        Price: 'decimal',
        OrderID: 'string',
      },
    },
    {
      name: 'TEST Placed Order Instore',
      category: 'instore',
      default_properties: {
        OrderID: 'string',
        StoreLocation: 'string',
        ItemNames: 'array',
        ItemCount: 'integer',
        Value: 'decimal',
      },
    },
    {
      name: 'TEST Ordered Product Instore',
      category: 'instore',
      default_properties: {
        ProductName: 'string',
        ProductID: 'string',
        SKU: 'string',
        Quantity: 'integer',
        Price: 'decimal',
        OrderID: 'string',
        StoreLocation: 'string',
      },
    },
  ]

  return NextResponse.json(
    {
      data: metricTemplates,
      meta: {
        count: metricTemplates.length,
      },
    },
    {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    }
  )
}

