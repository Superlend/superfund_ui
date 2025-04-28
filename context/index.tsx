'use client'

import React, { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { createConfig, WagmiProvider } from '@privy-io/wagmi'
import {
    base,
    sonic,
} from 'viem/chains'
import { http } from 'wagmi'
import { AuthProvider } from './auth-provider'

// Set up queryClient
const queryClient = new QueryClient()

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_PROJECT_ID || ''

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://app.superlend.xyz.com',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

export const config = createConfig({
    chains: [base, sonic],
    transports: {
        [base.id]: http(),
        [sonic.id]: http(),
    },
})

function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    const [localConfig, setLocalConfig] = useState<any>(null)
    const [context, setContext] = useState<any>(null)

    // useEffect(() => {
    //     const initializeConfig = async () => {
    //         await FrameSDK.actions.ready()
    //         const context = await FrameSDK.context
    //         setContext(context)
    //         const newConfig = createConfig({
    //             chains: [base],
    //             transports: {
    //                 [base.id]: http(),
    //             },
    //         })
    //         const newConfigForFarcaster = createConfig({
    //             chains: [base],
    //             transports: {
    //                 [base.id]: http(),
    //             },
    //             connectors: [farcasterFrame()],
    //         })

    //         setLocalConfig(context ? newConfigForFarcaster : newConfig)
    //     }

    //     initializeConfig()
    // }, [])

    return (
        <PrivyProvider
            appId={PRIVY_APP_ID}
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
                supportedChains: [base, sonic],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}

export default ContextProvider
