import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://api.liquidity.land/project/cmc8sragi0001rg0ihberoqt2/activities.json')
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from Liquidity Land API' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache', // Always fetch fresh data
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