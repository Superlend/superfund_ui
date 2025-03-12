import { NextResponse } from 'next/server'
import { PrivyClient } from '@privy-io/server-auth'

// Initialize Privy client
const privy = new PrivyClient(
    process.env.PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
)

const MAX_ALLOWLIST_ENTRIES = 20;

export async function POST(request: Request) {
    try {
        const { walletAddress } = await request.json()

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        // Get current allowlist to check the count
        const currentAllowlist = await privy.getAllowlist()
        
        // Check if wallet is already in allowlist
        const isWalletInAllowlist = currentAllowlist.some(
            entry => entry.type === 'wallet' && 
            entry.value.toLowerCase() === walletAddress.toLowerCase()
        )

        // If wallet is already in allowlist, return success
        if (isWalletInAllowlist) {
            return NextResponse.json({ success: true })
        }

        // Check if allowlist limit is reached (only for new entries)
        if (!isWalletInAllowlist && currentAllowlist.length >= MAX_ALLOWLIST_ENTRIES) {
            return NextResponse.json(
                { 
                    error: 'Maximum allowlist capacity reached. The beta is currently limited to 20 participants.',
                    code: 'MAX_LIMIT_REACHED'
                },
                { status: 403 }
            )
        }

        // Add wallet to allowlist if it's not already there
        if (!isWalletInAllowlist) {
            const allowlistEntry = await privy.inviteToAllowlist({
                type: 'wallet',
                value: walletAddress,
            })
            return NextResponse.json(allowlistEntry)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error adding to allowlist:', error)
        return NextResponse.json(
            { error: 'Failed to add to allowlist' },
            { status: 500 }
        )
    }
} 