import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useMemo, useState } from 'react'
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

    const isConnectingWallet = isConnectingWagmi || !ready || isSettingActiveWallet || isManuallyReconnecting
    
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

    // Set the latest connected wallet as active with proper error handling
    useEffect(() => {
        const setLatestWalletActive = async () => {
            if (!walletAddress || wallets.length === 0 || isSettingActiveWallet) {
                return
            }

            // Find the wallet that matches our address
            const latestWallet = wallets.find(
                (wallet) => wallet.address?.toLowerCase() === walletAddress.toLowerCase()
            )
            
            // Set active wallet if we found one and it's not connected
            if (latestWallet && !latestWallet.isConnected) {
                try {
                    setIsSettingActiveWallet(true)
                    await setActiveWallet(latestWallet)
                } catch (error) {
                    console.error('❌ Error setting active wallet:', error)
                } finally {
                    setIsSettingActiveWallet(false)
                }
            }
            // If we have a connected wallet but wagmi is not connected, try to reconnect
            else if (latestWallet && !isWagmiConnected) {
                try {
                    setIsSettingActiveWallet(true)
                    await setActiveWallet(latestWallet)
                } catch (error) {
                    console.error('❌ Error syncing wagmi with Privy:', error)
                } finally {
                    setIsSettingActiveWallet(false)
                }
            }
        }
        
        // Add a delay to avoid race conditions and allow Privy to stabilize
        const timeoutId = setTimeout(() => {
            void setLatestWalletActive()
        }, 200)

        return () => clearTimeout(timeoutId)
    }, [walletAddress, wallets, setActiveWallet, isSettingActiveWallet, isWagmiConnected])

    // Additional effect to handle the case where wagmi is not connected but should be
    useEffect(() => {
        if (authenticated && walletAddress && !isWagmiConnected && !isConnectingWallet && wallets.length > 0) {
            const timer = setTimeout(() => {
                console.log('⚠️ Detected wagmi not connected but should be. Attempting sync...')
                const matchingWallet = wallets.find(w => w.address?.toLowerCase() === walletAddress.toLowerCase())
                if (matchingWallet) {
                    setActiveWallet(matchingWallet).catch(console.error)
                }
            }, 1000) // Give it a second to auto-connect

            return () => clearTimeout(timer)
        }
    }, [authenticated, walletAddress, isWagmiConnected, isConnectingWallet, wallets, setActiveWallet])

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
    // The actual transaction will fail safely if wagmi isn't ready
    const canMakeTransactions = useMemo(() => {
        const hasBasicConnection = authenticated && walletAddress && !isConnectingWallet
        const hasFullConnection = isWalletConnected && isWagmiConnected && walletAddress && !isConnectingWallet
        
        // Debug logging to help troubleshoot
        // if (hasBasicConnection && !hasFullConnection) {
        //     console.log('🔍 Wallet Connection Debug:', {
        //         authenticated,
        //         isWagmiConnected,
        //         walletAddress: !!walletAddress,
        //         isConnectingWallet,
        //         user: !!user,
        //         wagmiWalletAddress: !!wagmiWalletAddress,
        //         hasBasicConnection,
        //         hasFullConnection
        //     })
        // }
        
        // Use basic connection for now - wagmi errors will be caught by transaction components
        return hasBasicConnection
    }, [authenticated, isWalletConnected, isWagmiConnected, walletAddress, isConnectingWallet, user, wagmiWalletAddress])

    // Debug helper function - can be called from browser console
    // const debugConnectionState = () => {
    //     console.log('🔍 Full Wallet Connection State:', {
    //         authenticated,
    //         ready,
    //         isWagmiConnected,
    //         isConnectingWagmi,
    //         walletAddress,
    //         wagmiWalletAddress,
    //         user: !!user,
    //         userWalletAddress: user?.wallet?.address,
    //         isConnectingWallet,
    //         canMakeTransactions,
    //         isWalletConnected,
    //         isWalletConnectedForUI,
    //         wallets: wallets.length,
    //         activeWallet: !!activeWallet,
    //     })
    // }

    // Expose debug function globally for console access
    // useEffect(() => {
    //     if (typeof window !== 'undefined') {
    //         (window as any).debugWalletConnection = debugConnectionState
    //     }
    // }, [authenticated, isWagmiConnected, walletAddress, canMakeTransactions])

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
