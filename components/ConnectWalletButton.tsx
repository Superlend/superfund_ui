// components/ConnectWalletButton.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'
import useIsClient from '@/hooks/useIsClient'
import { usePrivy } from '@privy-io/react-auth'
import { ProfileMenuDropdown } from './dropdowns/ProfileMenuDropdown'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

// Create a wrapper component to conditionally use the useUserBalance hook
function PortfolioChecker({
    walletAddress,
    onPortfolioCheck
}: {
    walletAddress: `0x${string}`,
    onPortfolioCheck: (value: string) => void
}) {
    const { userMaxWithdrawAmount, isLoading } = useUserBalance(walletAddress);

    useEffect(() => {
        if (!isLoading && userMaxWithdrawAmount) {
            try {
                const portfolioValue = parseFloat(userMaxWithdrawAmount);

                // Check if portfolio is greater than $1000K ($1M)
                if (!isNaN(portfolioValue) && portfolioValue > 1000)
                    onPortfolioCheck(userMaxWithdrawAmount);
            } catch (error) {
                console.error('Error parsing portfolio value:', error);
            }
        }
    }, [isLoading, userMaxWithdrawAmount, onPortfolioCheck]);

    return null; // This is a non-visual component
}

export default function ConnectWalletButton() {
    const { isClient } = useIsClient()
    const { logEvent } = useAnalytics()
    const { walletAddress, isConnectingWallet } = useWalletConnection()
    const { ready, authenticated, login, logout, user } = usePrivy()
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    // const [showSonicDialog, setShowSonicDialog] = useState(false)
    // const [portfolioValue, setPortfolioValue] = useState('0')
    const disableLogin = !ready || (ready && authenticated)
    const disableLogout = !ready || (ready && !authenticated)
    const isDisabled = walletAddress ? disableLogout : disableLogin
    const displayText =
        isConnectingWallet
            ? 'Connecting...'
            : walletAddress
                ? `${walletAddress?.slice(0, 5)}...${walletAddress?.slice(-5)}`
                : 'Connect Wallet'

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
                walletAddress: walletAddress
            })
        }
    }, [walletAddress])

    // Handle logout with redirection
    const handleLogout = async () => {
        await logout()
        // router.push('/')
    }

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
                    {!walletAddress && (
                        <Button
                            variant="primary"
                            size="lg"
                            className="rounded-4 py-2 capitalize w-full"
                            onClick={login}
                            disabled={isDisabled}
                        >
                            {isDisabled ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    )}
                </>
            )}
        </>
    )
}
