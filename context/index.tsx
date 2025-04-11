'use client'

import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { createConfig, WagmiProvider } from '@privy-io/wagmi'
import {
    base,
    mainnet,
    polygon,
    avalanche,
    optimism,
    gnosis,
    arbitrum,
    etherlink,
    bsc,
    scroll,
    metis,
    sonic,
} from 'viem/chains'
import { http } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

const appId = process.env.NEXT_PUBLIC_PRIVY_PROJECT_ID || ''

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
    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['wallet'],
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
                    ]
                },
                supportedChains: [base, sonic],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>{children}</WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}

export default ContextProvider
