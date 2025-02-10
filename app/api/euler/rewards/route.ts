import { NextResponse } from 'next/server'

const EULER_API = "https://app.euler.finance/api/v1/rewards/merkl"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    try {
        const response = await fetch(
            `${EULER_API}?chainId=8453&vaults=${address}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Origin': 'https://app.safe.global'  // Use the allowed origin
                }
            }
        )

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching Euler data:', error)
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }
} 