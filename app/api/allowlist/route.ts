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

        // Add wallet to allowlist
        const allowlistEntry = await privy.inviteToAllowlist({
            type: 'wallet',
            value: walletAddress,
        })

        return NextResponse.json(allowlistEntry)
    } catch (error) {
        console.error('Error adding to allowlist:', error)
        return NextResponse.json(
            { error: 'Failed to add to allowlist' },
            { status: 500 }
        )
    }
} 