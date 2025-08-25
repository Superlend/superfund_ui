'use client'

import MainContainer from '@/components/MainContainer'
import React, { useState, useEffect, useRef } from 'react'
import DepositAndWithdrawAssets from '../deposit-and-withdraw'
import VaultStats from '../vault-stats'
import PageHeader from '../page-header'
import useIsClient from '@/hooks/useIsClient'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import FlatTabs from '@/components/tabs/flat-tabs'
import PositionDetails from '../position-details'
import FundOverview from '../fund-overview'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useRouter, notFound, useSearchParams } from 'next/navigation'
// import { ChainProvider, useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import TransactionHistory from '@/components/transaction-history'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
// import { usePrivy } from '@privy-io/react-auth'
// import { useLoginToFrame } from '@privy-io/react-auth/farcaster'
import sdk from '@farcaster/frame-sdk'
import YourApiJourney from '@/components/your-api-journey'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useActiveAccount, useConnect } from "thirdweb/react"
import useDimensions from '@/hooks/useDimensions'
import LiquidityLandBanner from '@/components/LiquidityLandBanner'

interface ChainPageProps {
    params: {
        chain: string
    }
}

export default function SuperVaultChainPage({ params }: ChainPageProps) {
    const { isClient } = useIsClient()
    // const { isWalletConnected, isConnectingWallet, walletAddress } =
    //     useWalletConnection()
    const { connect, isConnecting, error } = useConnect();
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnected = !!account
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialized = useRef(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const [scrollState, setScrollState] = useState({
        canScrollUp: false,
        canScrollDown: false,
    })
    const { width } = useDimensions()
    const isDesktop = width > 1024
    const { logEvent } = useAnalytics()
    // const { initLoginToFrame, loginToFrame } = useLoginToFrame()
    // const { ready, authenticated } = usePrivy()
    const { userMaxWithdrawAmount, isLoading: isLoadingUserMaxWithdrawAmount, error: errorUserMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )

    // Log user in to Farcaster Frame
    // useEffect(() => {
    //     const login = async () => {
    //         const frameContext = await sdk.context
    //         if (ready && !authenticated && frameContext) {
    //             const { nonce } = await initLoginToFrame()
    //             const result = await sdk.actions.signIn({
    //                 nonce: nonce,
    //             })
    //             await loginToFrame({
    //                 message: result.message,
    //                 signature: result.signature,
    //             })
    //         }
    //     }
    //     login()
    // }, [ready, authenticated, initLoginToFrame, loginToFrame])

    // Handle scroll events to show/hide blur effects
    // useEffect(() => {
    //     const scrollArea = scrollAreaRef.current
    //     if (!scrollArea) return

    //     const handleScroll = () => {
    //         const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
    //         if (!viewport) return

    //         const { scrollTop, scrollHeight, clientHeight } = viewport
    //         const canScrollUp = scrollTop > 10
    //         const canScrollDown = scrollTop < scrollHeight - clientHeight - 10

    //         setScrollState({ canScrollUp, canScrollDown })
    //     }

    //     // Initial check
    //     handleScroll()

    //     const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
    //     if (viewport) {
    //         viewport.addEventListener('scroll', handleScroll)
    //         return () => viewport.removeEventListener('scroll', handleScroll)
    //     }
    // }, [isWalletConnected]) 
    // Re-run when wallet connection changes

    // Validate chain parameter only once
    useEffect(() => {
        if (!isClient || initialized.current) return
        initialized.current = true

        // Log chain parameter for debugging
        console.log(`Chain page initialized with param: ${params.chain}`)
    }, [isClient, params.chain])

    // Determine chain ID directly from the URL without side effects
    let chainId: ChainId
    if (params.chain.toLowerCase() === 'base') {
        chainId = ChainId.Base
    } else if (params.chain.toLowerCase() === 'sonic') {
        chainId = ChainId.Sonic
    } else {
        // This will be caught and redirected to the not-found page
        notFound()
        // TypeScript needs a value, but this line is never executed
        chainId = ChainId.Sonic
    }

    // Initialize selectedTab based on URL parameter
    const getInitialTab = () => {
        const tabParam = searchParams.get('tab')
        const validTabs = ['fund-overview', 'position-details']
        return validTabs.includes(tabParam || '') ? (tabParam as string) : 'fund-overview'
    }

    const [selectedTab, setSelectedTab] = useState(getInitialTab)

    const tabs = [
        {
            label: 'Fund Overview',
            value: 'fund-overview',
            content: <FundOverview />,
            show: true,
        },
        {
            label: 'Position Details',
            value: 'position-details',
            content: <PositionDetails />,
            show: isWalletConnected,
        },
    ]

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab)

        // Update URL with new tab parameter while preserving existing query params
        const currentParams = new URLSearchParams(searchParams.toString())
        currentParams.set('tab', tab)
        router.replace(`?${currentParams.toString()}`, { scroll: false })

        logEvent('selected_tab', {
            tab: tab,
            chain: params.chain,
        })
    }

    // Handle URL parameters and scroll focus on initial load
    useEffect(() => {
        if (!isClient) return

        // Update selectedTab if URL param changes
        const tabParam = searchParams.get('tab')
        const validTabs = ['fund-overview', 'position-details']
        const newTab = validTabs.includes(tabParam || '') ? (tabParam as string) : 'fund-overview'

        if (newTab !== selectedTab) {
            setSelectedTab(newTab)
        }
    }, [isClient, searchParams]) // Removed selectedTab from dependency array

    // Handle scroll focus only when hash is present on initial navigation
    useEffect(() => {
        if (!isClient) return

        const hash = window.location.hash
        if (hash === '#start') {
            const scrollToTabsSection = () => {
                // Wait for layout to settle and content to render
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        // Find the tabs section element
                        const tabsSection = document.getElementById('tabs-section')
                        const tabsContent = document.querySelector('[data-radix-tabs-content]')

                        // Use the actual tabs content if available, otherwise fall back to tabs section
                        const targetElement = tabsContent || tabsSection

                        if (targetElement) {
                            const isMobile = window.innerWidth <= 768
                            const headerOffset = isMobile ? 120 : 100 // Account for headers and spacing

                            const elementTop = targetElement.getBoundingClientRect().top + window.pageYOffset
                            const targetScrollPosition = elementTop - headerOffset

                            // Use smooth scroll to calculated position
                            window.scrollTo({
                                top: Math.max(0, targetScrollPosition),
                                behavior: 'smooth'
                            })

                            // Clear the hash after scrolling
                            setTimeout(() => {
                                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                            }, 1000) // Longer delay to ensure scroll completes
                        }
                    }, 100) // Small delay for rendering
                })
            }

            // Wait for all content to be rendered, including position details if that's the target tab
            setTimeout(scrollToTabsSection, 800) // Longer delay for complex content
        }
    }, [isClient, selectedTab]) // Add selectedTab to ensure we wait for tab change

    if (!isClient) {
        return <LoadingPageSkeleton />
    }

    // Get protocol identifier for the selected chain
    const getProtocolIdentifier = (chain: ChainId) => {
        if (chain === ChainId.Base) {
            return '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B'
        } else if (chain === ChainId.Sonic) {
            return '0x96328cd6fBCc3adC8bee58523Bbc67aBF38f8124'
        }
        return ''
    }

    // Wrap content in a chain provider with forced chain ID from URL
    return (
        <MainContainer className="flex flex-col flex-wrap gap-[40px] w-full mx-auto md:my-14">
            <PageHeader />
            <LiquidityLandBanner />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[16px]">
                <div className="flex flex-col gap-10">
                    <VaultStats />
                    {!isDesktop &&
                        <div className="flex flex-col gap-4">
                            <DepositAndWithdrawAssets />
                            {/* {(isWalletConnected && !!Number(userMaxWithdrawAmount)) && <YourApiJourney />} */}
                            {isWalletConnected && (
                                <TransactionHistory
                                    protocolIdentifier={getProtocolIdentifier(
                                        chainId
                                    )}
                                />
                            )}
                        </div>
                    }
                    {isConnecting && <LoadingTabs />}
                    {!isConnecting && (
                        <div id="tabs-section">
                            <FlatTabs
                                tabs={tabs}
                                activeTab={selectedTab}
                                onTabChange={handleTabChange}
                            />
                        </div>
                    )}
                </div>
                {isDesktop && (
                    <div className="">
                        <div className="sticky top-20 h-[calc(100vh-5rem)] relative">
                            <div
                                className={`absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none transition-opacity duration-300 ${scrollState.canScrollUp ? 'opacity-100' : 'opacity-0'
                                    }`}
                                style={{
                                    background: 'linear-gradient(to bottom, hsl(var(--background-light-blue)) 0%, hsl(var(--background-light-blue) / 0.95) 25%, hsl(var(--background-light-blue) / 0.8) 50%, hsl(var(--background-light-blue) / 0.4) 75%, transparent 100%)'
                                }}
                            />

                            <ScrollArea className="h-full" ref={scrollAreaRef}>
                                <div className="flex flex-col gap-2 pr-4">
                                    <DepositAndWithdrawAssets />
                                    {/* {(isWalletConnected && !!Number(userMaxWithdrawAmount)) && <YourApiJourney />} */}
                                    {isWalletConnected && (
                                        <TransactionHistory
                                            protocolIdentifier={getProtocolIdentifier(
                                                chainId
                                            )}
                                        />
                                    )}
                                </div>
                            </ScrollArea>

                            <div
                                className={`absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none transition-opacity duration-300 ${scrollState.canScrollDown ? 'opacity-100' : 'opacity-0'
                                    }`}
                                style={{
                                    background: 'linear-gradient(to top, hsl(var(--background-light-blue)) 0%, hsl(var(--background-light-blue) / 0.95) 25%, hsl(var(--background-light-blue) / 0.8) 50%, hsl(var(--background-light-blue) / 0.4) 75%, transparent 100%)'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </MainContainer>
    )
}

function LoadingTabs() {
    return (
        <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
    )
}

function LoadingPageSkeleton() {
    return (
        <MainContainer>
            <div className="flex flex-col gap-12">
                <Skeleton className="h-12 w-[80%] md:w-80 rounded-2xl" />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-start justify-between gap-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    className="flex flex-col items-start w-full max-w-[250px] gap-2"
                                    key={item}
                                >
                                    <Skeleton className="h-8 w-full rounded-2xl" />
                                    <Skeleton className="h-6 w-[80%] rounded-2xl" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-start w-full gap-4">
                            <Skeleton className="h-8 w-full md:w-48 rounded-2xl" />
                            <Skeleton className="h-40 w-full rounded-2xl" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-[50px] w-full rounded-2xl" />
                        <Skeleton className="h-[240px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </MainContainer>
    )
}
