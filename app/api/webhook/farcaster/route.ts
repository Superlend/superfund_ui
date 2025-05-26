import { requestIndexer } from '@/queries/request'
import { getTransactionHistory } from '@/queries/transaction-history-api'
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
        embeds: Array<{
            url: string
            metadata: {
                content_type: string
                content_length: null | number | string
                farcaster_domain_updated_at: string
                _status: string
                html: {
                    title?: string
                    description?: string
                    image?: string
                    url?: string
                }
                frame: {
                    version: string
                    title: string
                    description?: string
                    image?: string
                    buttons?: Array<{ label: string; action: string }>
                }
            }
        }>
        reactions: {
            likes: { fid: number; username: string }[]
            recasts: { fid: number; username: string }[]
        }
        replies: {
            count: number
        }
        mentioned_profiles: {
            fid: number
            username: string
            display_name: string
        }[]
    }
}

interface EventResponse {
    success: boolean
    message: string
    data?: {
        points?: number
        event_id?: string
    }
}

export async function GET() {
    return NextResponse.json({ status: 200 })
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as FarcasterWebhookPayload
        const {
            data: { embeds, author },
        } = payload

        // Extract transaction hash from embeds URL if it exists
        const embedUrl = embeds[0].url
        const info = new URL(embedUrl).searchParams.get('info')
        const txHash = info?.split(':')[0]
        const walletAddress = info?.split(':')[1] as `0x${string}`

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
                // Make request to log the event
                const response: EventResponse = await requestIndexer({
                    method: 'POST',
                    path: '/user/new_event_farcaster',
                    query: {
                        wallet: author.custody_address,
                    },
                    body: {
                        user_address: author.custody_address,
                        event_type: 'FARCASTER_CAST',
                        platform_type: 'farcaster',
                        protocol_identifier: txHash,
                        event_data: JSON.stringify({
                            text: payload.data.text,
                            username: author.username,
                            fid: author.fid,
                            txHash,
                        }),
                    },
                })

                if (!response) {
                    throw new Error('Failed to log event')
                }

                return NextResponse.json({
                    success: true,
                    data: response,
                    message: 'Points awarded!',
                })
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
