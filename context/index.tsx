'use client'

import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { createConfig, WagmiProvider } from '@privy-io/wagmi'
import { base, mainnet, polygon, avalanche, optimism, gnosis, arbitrum, etherlink, bsc, scroll, metis } from 'viem/chains'
import { http } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

const appId = 'cm5o77rga039b99tzkjakb6ji'

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://beta.superlend.xyz.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

export const config = createConfig({
    chains: [mainnet, polygon, base, scroll, avalanche, optimism, bsc, gnosis, arbitrum, etherlink, metis], // Pass your required chains as an array
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [base.id]: http(),
        [metis.id]: http(),
        [scroll.id]: http(),
        [avalanche.id]: http(),
        [optimism.id]: http(),
        [bsc.id]: http(),
        [gnosis.id]: http(),
        [arbitrum.id]: http(),
        [etherlink.id]: http(),
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
                    logo: 'https://beta.superlend.xyz/images/logos/superlend-logo.webp',
                    landingHeader: 'Connect Wallet',
                    loginMessage: 'Select wallet to continue',
                    showWalletLoginFirst: true,
                },
                supportedChains: [mainnet, polygon, base, scroll, avalanche, optimism, bsc, gnosis, arbitrum, etherlink, metis],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>
                    {children}
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}

export default ContextProvider
