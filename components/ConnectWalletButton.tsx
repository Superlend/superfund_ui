// components/ConnectWalletButton.tsx
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'
import useIsClient from '@/hooks/useIsClient'
// import { usePrivy, useLogout } from '@privy-io/react-auth'
import { ProfileMenuDropdown } from './dropdowns/ProfileMenuDropdown'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { BodyText } from './ui/typography'
import { AlertCircle, Clock } from 'lucide-react'
import InfoTooltip from './tooltips/InfoTooltip'
import { client } from "@/app/client";
import { ConnectButton, useActiveWallet, useConnect, useDisconnect } from "thirdweb/react";
import { useActiveAccount } from 'thirdweb/react'
import { createWallet, inAppWallet, EIP1193 } from "thirdweb/wallets";
import { base } from 'thirdweb/chains'
import { AutoConnect } from "thirdweb/react";
import FrameSDK from '@farcaster/frame-sdk'



// Create a wrapper component to conditionally use the useUserBalance hook
function PortfolioChecker({
    walletAddress,
    onPortfolioCheck,
}: {
    walletAddress: `0x${string}`
    onPortfolioCheck: (value: string) => void
}) {
    const { userMaxWithdrawAmount, isLoading } = useUserBalance(walletAddress)

    useEffect(() => {
        if (!isLoading && userMaxWithdrawAmount) {
            try {
                const portfolioValue = parseFloat(userMaxWithdrawAmount)

                // Check if portfolio is greater than $1000K ($1M)
                if (!isNaN(portfolioValue) && portfolioValue > 1000)
                    onPortfolioCheck(userMaxWithdrawAmount)
            } catch (error) {
                console.error('Error parsing portfolio value:', error)
            }
        }
    }, [isLoading, userMaxWithdrawAmount, onPortfolioCheck])

    return null // This is a non-visual component
}

export default function ConnectWalletButton() {
    const { isClient } = useIsClient()
    const { logEvent } = useAnalytics()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnected = !!account
    const { isConnecting, connect } = useConnect();
    const { disconnect } = useDisconnect();
    const wallet = useActiveWallet();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [isFarcasterFrame, setIsFarcasterFrame] = useState(false)
    const [isSDKLoaded, setIsSDKLoaded] = useState(false)
    const [isLoadingFarcasterWallet, setIsLoadingFarcasterWallet] = useState(false)
    const [isFarcasterDetectionComplete, setIsFarcasterDetectionComplete] = useState(false)

    const wallets = [
        // inAppWallet({
        //     auth: {
        //         mode: "popup",
        //         options: ["farcaster"],
        //         redirectUrl: typeof window !== 'undefined'
        //             ? `${window.location.origin}/super-fund/base`
        //             : "https://funds.superlend.xyz/super-fund/base",
        //     }
        // }),
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
        // createWallet("walletConnect"),
    ];

    const disableLogin = isConnecting
    const disableLogout = isConnecting
    const isDisabled = walletAddress ? disableLogout : disableLogin
    const displayText = useMemo(() => {
        return isConnecting
            ? 'Connecting...'
            : walletAddress
                ? `${walletAddress?.slice(0, 5)}...${walletAddress?.slice(-5)}`
                : 'Connect Wallet'
    }, [isConnecting, walletAddress])

    // Once user connects wallet, log event
    useEffect(() => {
        if (walletAddress) {
            logEvent('connected_wallet', {
                walletAddress: walletAddress,
            })
        }
    }, [walletAddress, logEvent])

    // Handle logout with redirection
    const handleLogout = useCallback(async () => {
        try {
            await disconnect(wallet as any)
        } catch (error) {
            console.error('Logout error:', error)
        }
        // router.push('/')
    }, [disconnect, wallet])

    // Detect if we're in a Farcaster Frame
    useEffect(() => {
        const detectFarcaster = async () => {
            try {
                const isMiniApp = await FrameSDK.isInMiniApp()
                setIsFarcasterFrame(isMiniApp)
            } catch (error) {
                console.error('Error detecting Farcaster:', error)
                setIsFarcasterFrame(false)
            } finally {
                setIsFarcasterDetectionComplete(true)
            }
        }
        detectFarcaster()
    }, [])

    // Farcaster-specific wallet connection
    const connectFarcasterWallet = useCallback(async () => {
        try {
            setIsLoadingFarcasterWallet(true)
            await connect(async () => {
                // Use thirdweb's EIP1193 provider for Farcaster
                const wallet = EIP1193.fromProvider({
                    provider: FrameSDK.wallet.ethProvider
                })
                await wallet.connect({ client })
                return wallet
            })
        } catch (error) {
            console.error('Farcaster wallet connection failed:', error)
        } finally {
            setIsLoadingFarcasterWallet(false)
        }
    }, [connect])

    // Auto-connect when Farcaster SDK loads
    useEffect(() => {
        const load = async () => {
            if (isFarcasterFrame && !isSDKLoaded) {
                setIsSDKLoaded(true)
                await FrameSDK.actions.ready({})

                // Auto-connect if wallet is available
                if (FrameSDK.wallet) {
                    await connectFarcasterWallet()
                }
            }
        }
        load()
    }, [isFarcasterFrame, isSDKLoaded, connectFarcasterWallet])

    // Show loading state while detecting Farcaster environment
    if (!isClient || !isFarcasterDetectionComplete) {
        return (
            <div className="w-[100px] md:w-[120px] h-[40px] rounded-4 overflow-hidden">
                <Skeleton className="h-full w-full" />
            </div>
        )
    }

    // Farcaster Frame UI
    if (isFarcasterFrame) {
        return (
            <>
                {!walletAddress && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size="lg"
                            className="rounded-4 py-2 capitalize w-full"
                            onClick={connectFarcasterWallet}
                            disabled={isLoadingFarcasterWallet}
                        >
                            {isLoadingFarcasterWallet ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </div>)}
                {walletAddress && (
                    <ProfileMenuDropdown
                        open={isProfileMenuOpen}
                        setOpen={setIsProfileMenuOpen}
                        displayText={displayText}
                        walletAddress={walletAddress}
                        logout={handleLogout}
                        showOptions={{
                            disconnect: !isFarcasterFrame,
                            viewTransactions: true,
                        }}
                    />
                )}
            </>
        )
    }

    // Regular ConnectButton for non-Farcaster environments
    return (
        <>
            {/* Conditionally render the PortfolioChecker only when wallet is connected */}
            {/* {walletAddress && (
                <PortfolioChecker
                    walletAddress={walletAddress as `0x${string}`}
                    onPortfolioCheck={handlePortfolioCheck}
                />
            )} */}

            {/* Superfund Sonic Dialog */}
            {/* {walletAddress && (
                <SuperFundSonicDialog
                    open={showSonicDialog}
                    setOpen={setShowSonicDialog}
                    walletAddress={walletAddress as `0x${string}`}
                    portfolioValue={portfolioValue}
                />
            )} */}

            {/* <AutoConnect
                client={client}
                timeout={10000}
                wallets={wallets}
                appMetadata={{
                    name: "SuperFund",
                    description: "Earn smarter with SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.",
                    url: "https://funds.superlend.xyz",
                    logoUrl: "https://funds.superlend.xyz/images/logos/favicon-32x32.png",
                }}
            /> */}

            {walletAddress && (
                <ProfileMenuDropdown
                    open={isProfileMenuOpen}
                    setOpen={setIsProfileMenuOpen}
                    displayText={displayText}
                    walletAddress={walletAddress}
                    logout={handleLogout}
                />
            )}
            {!walletAddress &&
                <ConnectButton
                    client={client}
                    theme="light"
                    connectModal={{
                        title: "Connect Wallet",
                        titleIcon: "https://funds.superlend.xyz/images/logos/favicon-32x32.png",
                        size: "wide"
                    }}
                    walletConnect={{
                        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
                    }}
                    wallets={wallets}
                    chain={base}
                    connectButton={{
                        label: "Connect Wallet",
                        style: {
                            fontSize: "14px",
                            fontWeight: "600",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: "#FF5900",
                            color: "#fff",
                            border: "2px solid #FF5900",
                            minWidth: "130px"
                        }
                    }}
                />
            }
        </>
    )
}