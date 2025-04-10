'use client'

import React, { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { createConfig, WagmiProvider } from '@privy-io/wagmi'
import { base } from 'viem/chains'
import farcasterFrame from '@farcaster/frame-wagmi-connector'
import FrameSDK, { sdk } from '@farcaster/frame-sdk'
import { http } from 'viem'
import { useLoginToFrame } from '@privy-io/react-auth/farcaster'

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
    const { initLoginToFrame, loginToFrame } = useLoginToFrame()
    const { ready, authenticated } = usePrivy()

    useEffect(() => {
        const initializeConfig = async () => {
            await FrameSDK.actions.ready()
            const context = await FrameSDK.context

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

            // Login to Frame with Privy automatically
            if (ready && !authenticated && context) {
                const login = async () => {
                    const { nonce } = await initLoginToFrame()
                    const result = await sdk.actions.signIn({
                        nonce: nonce,
                    })
                    await loginToFrame({
                        message: result.message,
                        signature: result.signature,
                    })
                }
                login()
            }

            setConfig(context ? newConfigForFarcaster : newConfig)
        }

        initializeConfig()
    }, [ready, authenticated])

    if (!config) return null

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['wallet', 'farcaster'],
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
