'use client'

import React, { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { PrivyProvider } from '@privy-io/react-auth'
// import { createConfig, WagmiProvider } from '@privy-io/wagmi'
// import { base, sonic } from 'viem/chains'
// import { http } from 'wagmi'
import { AuthProvider } from './auth-provider'
import FrameSDK from '@farcaster/frame-sdk'
import { farcasterFrame } from '@farcaster/frame-wagmi-connector'
import { AnalyticsProvider } from './analytics-provider'
import { ApyDataProvider } from './apy-data-provider'
import { ChainProvider } from './chain-context'
import { ThirdwebProvider } from "thirdweb/react";
import { base } from 'thirdweb/chains'


// Set up queryClient
const queryClient = new QueryClient()

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Set up metadata
const metadata = {
    name: 'superlend',
    description: 'superlend',
    url: 'https://funds.superlend.xyz',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Create a default config for initial render
// const defaultConfig = createConfig({
//     chains: [base],
//     transports: {
//         [base.id]: http(),
//         // [sonic.id]: http(),
//     },
// })

function ContextProvider({
    children,
    cookies,
}: {
    children: ReactNode
    cookies: string | null
}) {
    // const [localConfig, setLocalConfig] = useState(defaultConfig)
    // const [context, setContext] = useState<any>(null)
    const [isClient, setIsClient] = useState(false)
    // const [isMiniApp, setIsMiniApp] = useState(false)

    // Check if we're on the client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    // useEffect(() => {
    //     // Only run Farcaster initialization on the client side
    //     if (!isClient) return

    //     const initializeConfig = async () => {
    //         try {
    //             await FrameSDK.actions.ready()
    //             const isMiniApp = await FrameSDK.isInMiniApp()
    //             const context = await FrameSDK.context
    //             setContext(context)
    //             setIsMiniApp(isMiniApp)

    //             if (isMiniApp) {
    //                 const newConfigForFarcaster = createConfig({
    //                     chains: [base, sonic],
    //                     transports: {
    //                         [base.id]: http(),
    //                         [sonic.id]: http(),
    //                     },
    //                     connectors: [farcasterFrame()],
    //                 })
    //                 setLocalConfig(newConfigForFarcaster)
    //             }
    //         } catch (error) {
    //             console.error('Error initializing Farcaster SDK:', error)
    //             // Keep using default config in case of errors
    //         }
    //     }

    //     initializeConfig()
    // }, [isClient])

    return (
        <AnalyticsProvider>
            <ThirdwebProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <ChainProvider>
                            <ApyDataProvider>
                                {children}
                            </ApyDataProvider>
                        </ChainProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </ThirdwebProvider>
        </AnalyticsProvider>
    )
}

export default ContextProvider
