import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useSetActiveWallet } from '@privy-io/wagmi'
import FrameSDK from '@farcaster/frame-sdk'
import { useActiveAccount, useConnect } from "thirdweb/react";

export const useWalletConnection = () => {
    const account = useActiveAccount();
    const { isConnecting } = useConnect()
    // const { user, ready, authenticated, login } = usePrivy()
    const { wallets } = useWallets()
    const { setActiveWallet } = useSetActiveWallet()
    const [isMiniApp, setIsMiniApp] = useState(false)
    const [context, setContext] = useState<any>(null)
    const [isSettingActiveWallet, setIsSettingActiveWallet] = useState(false)
    const [isManuallyReconnecting, setIsManuallyReconnecting] = useState(false)
    
    // Use refs to track timeouts and prevent race conditions
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    // Simplified connecting state - only true when actively connecting
    const isConnectingWallet = isConnecting || isManuallyReconnecting
    
    // Wallet connection state based on Thirdweb
    const isWalletConnected = !!account
    
    // Less strict check for UI purposes
    const isWalletConnectedForUI = !!account

    // Get the active wallet from the list of wallets
    const activeWallet = isWalletConnectedForUI
        ? wallets.find((wallet) => wallet.isConnected)
        : undefined

    const walletAddress = account?.address as `0x${string}`

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
        }
    }, [])

    // Memoized wallet sync function to prevent recreating on every render
    const syncWalletConnection = useCallback(async () => {
        if (!walletAddress || wallets.length === 0 || isSettingActiveWallet) {
            return
        }

        // Find the wallet that matches our address
        const matchingWallet = wallets.find(
            (wallet) => wallet.address?.toLowerCase() === walletAddress.toLowerCase()
        )
        
        // Only attempt to sync if we have a wallet and it's not already connected
        if (matchingWallet && !matchingWallet.isConnected) {
            try {
                setIsSettingActiveWallet(true)
                await setActiveWallet(matchingWallet)
            } catch (error) {
                console.error('❌ Error setting active wallet:', error)
            } finally {
                setIsSettingActiveWallet(false)
            }
        }
    }, [walletAddress, wallets, setActiveWallet, isSettingActiveWallet])

    // Effect to sync wallet connection - runs only when essential dependencies change
    useEffect(() => {
        // Clear any existing timeout
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current)
        }

        // Only sync if we have authenticated user and wallet address
        if (isWalletConnected && walletAddress) {
            // Use a timeout to debounce and avoid rapid successive calls
            syncTimeoutRef.current = setTimeout(() => {
                void syncWalletConnection()
            }, 300)
        }

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
        }
    }, [isWalletConnected, walletAddress, syncWalletConnection])

    const wallet = wallets.find(
        (wallet: any) => wallet.address === walletAddress
    )

    useEffect(() => {
        const load = async () => {
            try {
                const isMiniApp = await FrameSDK.isInMiniApp()
                const context = await FrameSDK.context
                setContext(context)
                setIsMiniApp(isMiniApp)
            } catch (error) {
                console.error('Error loading Farcaster SDK:', error)
            }
        }
        void load()
    }, [])

    async function handleSwitchChain(chain_id: number) {
        try {
            await wallet?.switchChain(Number(chain_id))
        } catch (error) {
            console.error('Error switching chain:', error)
            throw error
        }
    }

    // Manual reconnection function - simplified since we're using Thirdweb
    const reconnectWallet = async () => {
        try {
            setIsManuallyReconnecting(true)
            
            // Wait a bit for any disconnection to complete
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Try to reconnect through Privy
            // await login()
            
        } catch (error) {
            console.error('Error during manual reconnection:', error)
            throw error
        } finally {
            setIsManuallyReconnecting(false)
        }
    }

    // Helper function to check if we can safely make transactions
    // With Thirdweb, this is much simpler - just check if account exists
    const canMakeTransactions = useMemo(() => {
        return !!account && !isConnectingWallet
    }, [account, isConnectingWallet])

    return {
        user: account,
        wallet,
        walletAddress,
        isWalletConnected,
        isWalletConnectedForUI,
        isConnectingWallet,
        canMakeTransactions,
        handleSwitchChain,
        reconnectWallet,
        isMiniApp,
        context,
    }
}