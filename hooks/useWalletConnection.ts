import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useSetActiveWallet } from '@privy-io/wagmi'
import FrameSDK from '@farcaster/frame-sdk'

export const useWalletConnection = () => {
    const { isConnecting: isConnectingWagmi } = useAccount()
    const { disconnect } = useDisconnect()
    const { user, ready, authenticated } = usePrivy()
    const { wallets } = useWallets()
    const { setActiveWallet } = useSetActiveWallet()
    const [isMiniApp, setIsMiniApp] = useState(false)
    const [context, setContext] = useState<any>(null)

    const isConnectingWallet = isConnectingWagmi || !ready
    const isWalletConnected = !!user && authenticated

    // Get the active wallet from the list of wallets
    const activeWallet = isWalletConnected
        ? wallets.find((wallet) => wallet.isConnected)
        : undefined
    const walletAddress = authenticated
        ? (activeWallet?.address as `0x${string}`) ||
          (user?.wallet?.address as `0x${string}`)
        : undefined

    // Set the latest connected wallet as active
    useEffect(() => {
        const setLatestWalletActive = async () => {
            if (walletAddress && wallets.length > 0) {
                const latestWallet = wallets.find(
                    (wallet) => wallet.address === walletAddress
                )
                if (latestWallet && !latestWallet.isConnected) {
                    await setActiveWallet(latestWallet)
                }
            }
        }
        void setLatestWalletActive()
    }, [walletAddress, wallets, setActiveWallet])

    const wallet = wallets.find(
        (wallet: any) => wallet.address === walletAddress
    )
    
    useEffect(() => {
        const load = async () => {
            const isMiniApp = await FrameSDK.isInMiniApp()
            const context = await FrameSDK.context
            setContext(context)
            setIsMiniApp(isMiniApp)
        }
        void load()
    }, [])

    async function handleSwitchChain(chain_id: number) {
        await wallet?.switchChain(Number(chain_id))
    }

    return {
        user,
        wallet,
        walletAddress,
        isWalletConnected,
        isConnectingWallet,
        handleSwitchChain,
        disconnect,
    }
}
