import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useSetActiveWallet } from '@privy-io/wagmi'
import FrameSDK from '@farcaster/frame-sdk'

export const useWalletConnection = () => {
    const { isConnecting: isConnectingWagmi, address: wagmiWalletAddress, isConnected: isWagmiConnected } = useAccount()
    const { disconnect } = useDisconnect()
    const { user, ready, authenticated, login } = usePrivy()
    const { wallets } = useWallets()
    const { setActiveWallet } = useSetActiveWallet()
    const [isMiniApp, setIsMiniApp] = useState(false)
    const [context, setContext] = useState<any>(null)
    const [isSettingActiveWallet, setIsSettingActiveWallet] = useState(false)
    const [isManuallyReconnecting, setIsManuallyReconnecting] = useState(false)
    
    // Use refs to track timeouts and prevent race conditions
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    // Simplified connecting state - only true when actively connecting, not for every state mismatch
    const isConnectingWallet = isConnectingWagmi || !ready || isManuallyReconnecting
    
    // Strict check for transaction safety - requires both Privy and wagmi to be connected
    const isWalletConnected = authenticated && isWagmiConnected && (!!user || !!wagmiWalletAddress)
    
    // Less strict check for UI purposes - only requires Privy authentication and wallet address
    const isWalletConnectedForUI = authenticated && (!!user?.wallet?.address || !!wagmiWalletAddress)

    // Get the active wallet from the list of wallets
    const activeWallet = isWalletConnectedForUI
        ? wallets.find((wallet) => wallet.isConnected)
        : undefined

    const walletAddress = authenticated 
        ? ((activeWallet?.address as `0x${string}`) ||
           (user?.wallet?.address as `0x${string}`) ||
           wagmiWalletAddress)
        : undefined

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
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
        if (authenticated && walletAddress && ready) {
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
    }, [authenticated, walletAddress, ready, syncWalletConnection])

    // Separate effect for handling wagmi reconnection - less aggressive
    useEffect(() => {
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        // Only attempt reconnection if we have all the prerequisites and wagmi is not connected
        if (authenticated && walletAddress && !isWagmiConnected && !isConnectingWallet && wallets.length > 0) {
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('⚠️ Detected wagmi not connected but should be. Attempting sync...')
                const matchingWallet = wallets.find(w => w.address?.toLowerCase() === walletAddress.toLowerCase())
                if (matchingWallet && !isSettingActiveWallet) {
                    setActiveWallet(matchingWallet).catch(console.error)
                }
            }, 2000) // Longer delay for wagmi reconnection

            return () => {
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current)
                }
            }
        }
    }, [authenticated, walletAddress, isWagmiConnected, isConnectingWallet, wallets.length])

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

    // Disconnect wagmi when user logs out of Privy
    useEffect(() => {
        if (!authenticated && wagmiWalletAddress) {
            disconnect()
        }
    }, [authenticated, wagmiWalletAddress, disconnect])

    async function handleSwitchChain(chain_id: number) {
        try {
            await wallet?.switchChain(Number(chain_id))
        } catch (error) {
            console.error('Error switching chain:', error)
            throw error
        }
    }

    // Manual reconnection function
    const reconnectWallet = async () => {
        try {
            setIsManuallyReconnecting(true)
            
            // First disconnect everything
            if (wagmiWalletAddress) {
                disconnect()
            }
            
            // Wait a bit for disconnection to complete
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Try to reconnect through Privy
            await login()
            
        } catch (error) {
            console.error('Error during manual reconnection:', error)
            throw error
        } finally {
            setIsManuallyReconnecting(false)
        }
    }

    // Helper function to check if we can safely make transactions
    // More lenient approach: if we have Privy auth and wallet address, we can try transactions
    const canMakeTransactions = useMemo(() => {
        const hasBasicConnection = authenticated && walletAddress && !isConnectingWallet
        
        // Use basic connection for now - wagmi errors will be caught by transaction components
        return hasBasicConnection
    }, [authenticated, walletAddress, isConnectingWallet])

    return {
        user,
        wallet,
        walletAddress,
        isWalletConnected, // Strict check for transactions
        isWalletConnectedForUI, // Less strict check for UI
        isConnectingWallet,
        canMakeTransactions,
        isWagmiConnected,
        handleSwitchChain,
        disconnect,
        reconnectWallet,
    }
}