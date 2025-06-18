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
import { createWallet, inAppWallet, walletConnect } from "thirdweb/wallets";
import { base } from 'thirdweb/chains'


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
    const { isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const wallet = useActiveWallet();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    // const [showSonicDialog, setShowSonicDialog] = useState(false)
    // const [portfolioValue, setPortfolioValue] = useState('0')

    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
        createWallet("walletConnect"),
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

    // Handle showing dialog when portfolio value is set
    // useEffect(() => {
    //     if (portfolioValue !== '0') {
    //         setShowSonicDialog(true);
    //     }
    // }, [portfolioValue]);

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

    // Portfolio check handler
    // const handlePortfolioCheck = (value: string) => {
    //     setPortfolioValue(value);
    // };

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

            {/* This is a workaround to show the skeleton on the first render */}
            {!isClient && (
                <div className="w-[100px] md:w-[120px] h-[40px] rounded-4 overflow-hidden">
                    <Skeleton className="h-full w-full" />
                </div>
            )}
            {/* This is the actual button */}
            {isClient && (
                <>
                    {walletAddress && (
                        <ProfileMenuDropdown
                            open={isProfileMenuOpen}
                            setOpen={setIsProfileMenuOpen}
                            displayText={displayText}
                            walletAddress={walletAddress}
                            logout={handleLogout}
                        />
                    )}
                    {/* {!walletAddress && (
                        <InfoTooltip
                            size="none"
                            className="px-2"
                            classNameLabel="w-full"
                            label={
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="rounded-4 py-2 capitalize w-full"
                                    onClick={login}
                                    disabled={isDisabled}
                                >
                                    {isDisabled ? 'Connecting...' : 'Connect Wallet'}
                                </Button>
                            }
                            content={
                                <div className="flex flex-col gap-2 bg-blue-50/50 p-3 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 p-1.5 bg-blue-100 rounded-full">
                                            <AlertCircle className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <BodyText level="body2" className="font-semibold text-blue-900">
                                                Temporary Connection Issue
                                            </BodyText>
                                            <BodyText level="body2" className="text-blue-700">
                                                We&apos;re currently experiencing technical difficulties with wallet connections on Superfund.
                                            </BodyText>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600 pl-2">
                                        <div className="shrink-0 p-1 bg-blue-100 rounded-full">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <BodyText level="body2" className="font-medium">
                                            A fix is in progress.
                                        </BodyText>
                                    </div>
                                </div>
                            }
                            side="bottom"
                        />
                    )} */}
                    {!walletAddress &&
                        <ConnectButton
                            client={client}
                            theme="light"
                            connectModal={{
                                title: "Connect Wallet",
                                titleIcon: "https://funds.superlend.xyz/images/logos/favicon-32x32.png"
                            }}
                            walletConnect={{
                                projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
                            }}
                            wallets={wallets}
                            chain={base}
                        />
                    }
                </>
            )}
        </>
    )
}
