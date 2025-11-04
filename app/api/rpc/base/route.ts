import { NextRequest, NextResponse } from 'next/server'

/**
 * RPC Provider Configuration
 *
 * Required environment variables:
 * - BASE_RPC_URL_PUBLIC: Public RPC endpoint (e.g., https://base.llamarpc.com/)
 * - BASE_RPC_URL_PRIVATE_1: First private RPC endpoint (e.g., Ankr)
 * - BASE_RPC_URL_PRIVATE_2: Second private RPC endpoint (e.g., Alchemy)
 *
 * Fallback priority: Public → Private 1 → Private 2
 */

const REQUEST_TIMEOUT_MS = 5000 // 5 seconds

interface RpcProvider {
    name: string
    url: string
}

/**
 * Attempts to make an RPC request to a specific provider with timeout
 */
async function tryProvider(
    providerUrl: string,
    body: any,
    timeoutMs: number
): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(providerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Check for JSON-RPC errors (even if HTTP status is 200)
        if (data.error) {
            throw new Error(
                `JSON-RPC error ${data.error.code}: ${data.error.message}`
            )
        }

        return data
    } catch (error) {
        clearTimeout(timeoutId)

        if ((error as Error).name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs}ms`)
        }

        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        // Define RPC providers in priority order
        const providers: RpcProvider[] = [
            {
                name: 'Private RPC 1',
                url: process.env.BASE_RPC_URL_PRIVATE_1 || '',
            },
            {
                name: 'Private RPC 2',
                url: process.env.BASE_RPC_URL_PRIVATE_2 || '',
            },
            {
                name: 'Public RPC',
                url: process.env.BASE_RPC_URL_PUBLIC || '',
            },
        ].filter((provider) => provider.url) // Only include configured providers

        if (providers.length === 0) {
            return NextResponse.json(
                {
                    error: 'No RPC providers configured. Please set BASE_RPC_URL_PUBLIC, BASE_RPC_URL_PRIVATE_1, or BASE_RPC_URL_PRIVATE_2',
                },
                { status: 500 }
            )
        }

        // Get the request body (RPC request)
        let body
        try {
            body = await request.json()
        } catch (error) {
            console.error(
                'Invalid request body - not valid JSON:',
                (error as Error).message
            )
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            )
        }

        // Try each provider in sequence until one succeeds
        const errors: string[] = []

        for (const provider of providers) {
            try {
                console.log(`Attempting RPC request via ${provider.name}...`)

                const data = await tryProvider(
                    provider.url,
                    body,
                    REQUEST_TIMEOUT_MS
                )

                console.log(`✓ ${provider.name} succeeded`)
                return NextResponse.json(data)
            } catch (error) {
                const errorMessage = `✗ ${provider.name} failed: ${(error as Error).message}`
                console.error(errorMessage)
                errors.push(errorMessage)
                // Continue to next provider
            }
        }

        // All providers failed
        console.error('All RPC providers failed')
        return NextResponse.json(
            {
                error: 'All RPC providers unavailable',
                details: errors,
            },
            { status: 503 }
        )
    } catch (error) {
        console.error('Base RPC proxy error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
