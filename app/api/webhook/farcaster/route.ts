import { requestIndexer } from '@/queries/request'
import {
    getTransactionHistory,
    TransactionHistoryResponse,
} from '@/queries/transaction-history-api'
import { ChainId } from '@/types/chain'
import { NextRequest, NextResponse } from 'next/server'

export type FarcasterWebhookPayload = {
    created_at: number
    type: string
    data: {
        object: string
        hash: string
        thread_hash: string
        parent_hash: string | null
        parent_url: string
        root_parent_url: string
        parent_author: {
            fid: number | null
        }
        author: {
            object: string
            fid: number
            custody_address: string
            username: string
            display_name: string
            pfp_url: string
            follower_count: number
            following_count: number
            verifications: string[]
            active_status: string
        }
        text: string
        timestamp: string
        embeds: any[]
        reactions: {
            likes: any[]
            recasts: any[]
        }
        replies: {
            count: number
        }
        mentioned_profiles: any[]
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'ok' })
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as FarcasterWebhookPayload
        const {
            data: { author, embeds },
        } = payload

        // Extract transaction hash from embeds URL if it exists
        const embedUrl = embeds?.find(
            (embed) =>
                embed?.includes('funds.superlend.xyz') &&
                embed?.includes('txHash=')
        )
        const txHash = embedUrl
            ? new URL(embedUrl).searchParams.get('txHash')
            : null
        const walletAddress = embedUrl
            ? new URL(embedUrl).searchParams.get('walletAddress')
            : null

        console.log(embedUrl, txHash, walletAddress)

        // Check if user has any transactions with matching hash
        try {
            const txHistory = await getTransactionHistory({
                protocolIdentifier:
                    '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B',
                chainId: ChainId.Base,
                walletAddress: walletAddress as `0x${string}`,
            })
            // Only proceed if user has matching transaction
            const hasMatchingTx = txHistory?.transactions?.some(
                (tx) => tx.transactionHash === txHash
            )

            if (hasMatchingTx) {
                console.log('User has matching transaction')

                // Make request to log the event
                // const response: any = await requestIndexer({
                //     method: 'POST',
                //     path: '/user/new_event_farcaster',
                //     query: {
                //         wallet: author.custody_address,
                //     },
                //     body: {
                //         user_address: author.custody_address,
                //         event_type: 'FARCASTER_CAST',
                //         platform_type: 'farcaster',
                //         protocol_identifier: txHash,
                //         event_data: JSON.stringify({
                //             text: payload.data.text,
                //             username: author.username,
                //             fid: author.fid,
                //         }),
                //     },
                // })

                // if (!response) {
                //     throw new Error('Failed to log event')
                // }

                // return NextResponse.json({ success: true, data: response })
                return NextResponse.json({ success: true, data: 'Ok' })
            }

            // Return success but no points awarded if no matching transaction found
            return NextResponse.json({
                success: true,
                message: 'No matching transaction found',
            })
        } catch (error) {
            console.error('Error processing Farcaster webhook:', error)
            return NextResponse.json(
                { error: 'Failed to process webhook' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Error processing Farcaster webhook:', error)
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        )
    }
}
