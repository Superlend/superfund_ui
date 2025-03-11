import { NextResponse } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'

// Initialize Privy client
const privy = new PrivyClient(
    process.env.PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
)

export async function POST(request: Request) {
    try {
        const { walletAddress } = await request.json()

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        // Get the current allowlist
        const allowlist = await privy.getAllowlist()
        
        // Check if the wallet address exists in the allowlist
        const hasAccess = allowlist.some(
            entry => entry.type === 'wallet' && 
            entry.value.toLowerCase() === walletAddress.toLowerCase()
        )

        return NextResponse.json({ hasAccess })
    } catch (error) {
        console.error('Error checking allowlist:', error)
        return NextResponse.json(
            { error: 'Failed to check allowlist' },
            { status: 500 }
        )
    }
} 