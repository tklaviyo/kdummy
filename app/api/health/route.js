import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'K:Dummy API',
      version: '0.1.0',
      endpoints: {
        profiles: '/api/profiles',
        events: '/api/events',
        subscribe: '/api/subscribe',
        metrics: '/api/metrics',
      },
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

