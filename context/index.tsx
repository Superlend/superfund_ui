'use client'

import React, { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { createConfig, WagmiProvider } from '@privy-io/wagmi'
import { base } from 'viem/chains'
import farcasterFrame from '@farcaster/frame-wagmi-connector'
import FrameSDK, { sdk } from '@farcaster/frame-sdk'
import { http } from 'viem'

// Set up queryClient
const queryClient = new QueryClient()

const appId = process.env.NEXT_PUBLIC_PRIVY_PROJECT_ID || ''

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://app.superlend.xyz.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// export const config = createConfig({
//     chains: [base], // Pass your required chains as an array
//     transports: {
//         [base.id]: http(),
//     },
//     connectors,
// })

function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    const [config, setConfig] = useState<any>(null)
    const [context, setContext] = useState<any>(null)

    useEffect(() => {
        const initializeConfig = async () => {
            await FrameSDK.actions.ready()
            const context = await FrameSDK.context
            setContext(context)
            const newConfig = createConfig({
                chains: [base],
                transports: {
                    [base.id]: http(),
                },
            })
            const newConfigForFarcaster = createConfig({
                chains: [base],
                transports: {
                    [base.id]: http(),
                },
                connectors: [farcasterFrame()],
            })

            setConfig(context ? newConfigForFarcaster : newConfig)
        }

        initializeConfig()
    }, [])

    if (!config) return null

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['wallet', context && 'farcaster'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                    logo: 'https://app.superlend.xyz/images/logos/superlend-logo.webp',
                    landingHeader: 'Connect Wallet',
                    loginMessage: 'Select wallet to continue',
                    showWalletLoginFirst: true,
                    walletList: [
                        'metamask',
                        'coinbase_wallet',
                        'okx_wallet',
                        'rainbow',
                        'rabby_wallet',
                        'phantom',
                        'wallet_connect',
                    ],
                },
                supportedChains: [base],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>{children}</WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}

export default ContextProvider
