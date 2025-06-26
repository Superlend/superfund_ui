import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Add cache-busting timestamp to prevent any intermediate caching
    const timestamp = Date.now()
    const url = `https://api.liquidity.land/project/cmc8sragi0001rg0ihberoqt2/activities.json?_t=${timestamp}`
    
    const response = await fetch(url, {
      // Ensure fresh request with no caching
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from Liquidity Land API' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        // Prevent caching at all levels
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Timestamp': new Date().toISOString(), // Debug timestamp
        'X-Data-Count': data.length.toString(), // Debug data count
      },
    })
  } catch (error) {
    console.error('Liquidity Land API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 