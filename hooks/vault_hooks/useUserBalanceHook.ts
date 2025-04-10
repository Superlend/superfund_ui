import { SONIC_USDC_ADDRESS, SONIC_VAULT_ADDRESS, USDC_ADDRESS, USDC_DECIMALS, VAULT_ADDRESS } from '@/lib/constants'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState, useRef } from 'react'
import { createPublicClient, formatUnits, http, parseAbi } from 'viem'
import { base, sonic } from 'viem/chains'
import { useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'

const USDC_ABI = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function allowance(address, address) view returns (uint256)',
])

// Chain-specific configuration
const CHAIN_CONFIGS = {
    [ChainId.Base]: {
        chain: base,
        rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || '',
        vaultAddress: VAULT_ADDRESS,
        usdcAddress: USDC_ADDRESS,
    },
    [ChainId.Sonic]: {
        chain: sonic,
        rpcUrl: process.env.NEXT_PUBLIC_SONIC_RPC_URL || 'https://rpc.soniclabs.com',
        vaultAddress: SONIC_VAULT_ADDRESS,
        usdcAddress: SONIC_USDC_ADDRESS,
    }
}

// Create public clients for each chain
const publicClients = {
    [ChainId.Base]: createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ''),
        batch: { multicall: true },
    }),
    [ChainId.Sonic]: createPublicClient({
        chain: sonic,
        transport: http(process.env.NEXT_PUBLIC_SONIC_RPC_URL || 'https://rpc.soniclabs.com'),
        batch: { multicall: true },
    })
}

const VAULT_ABI = parseAbi([
    'function totalAssets() view returns (uint256)',
    // maxWithdraw
    'function maxWithdraw(address user) view returns (uint256)',
])

export async function checkAllowance(walletAddress: `0x${string}`, chainId: ChainId = ChainId.Base) {
    // Get chain-specific config and client
    const config = CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]
    if (!config) {
        throw new Error(`Configuration not found for chain ID ${chainId}`)
    }

    const client = publicClients[chainId as keyof typeof publicClients]
    if (!client) {
        throw new Error(`Public client not found for chain ID ${chainId}`)
    }

    const allowance = await client.readContract({
        address: config.usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [walletAddress, config.vaultAddress as `0x${string}`],
    })

    let allowanceInWei = formatUnits(allowance, USDC_DECIMALS)

    return allowanceInWei
}

export function useUserBalance(walletAddress: `0x${string}`) {
    const [balance, setBalance] = useState<string>('0')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userMaxWithdrawAmount, setUserMaxWithdrawAmount] = useState<string>('0')
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(true)
    const { selectedChain } = useChain()

    async function getUserBalance(walletAddress: string, isFirstTimeCall: boolean) {
        if (!walletAddress) return

        try {
            if (isFirstTimeCall) {
                setIsLoading(true)
            }

            // Get chain-specific config
            const config = CHAIN_CONFIGS[selectedChain as keyof typeof CHAIN_CONFIGS]
            if (!config) {
                throw new Error(`Configuration not found for chain ID ${selectedChain}`)
            }

            const client = publicClients[selectedChain as keyof typeof publicClients]
            if (!client) {
                throw new Error(`Public client not found for chain ID ${selectedChain}`)
            }

            const [balance, maxWithdraw] = await Promise.all([
                client.readContract({
                    address: config.usdcAddress as `0x${string}`,
                    abi: USDC_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress as `0x${string}`],
                }),
                client.readContract({
                    address: config.vaultAddress as `0x${string}`,
                    abi: VAULT_ABI,
                    functionName: 'maxWithdraw',
                    args: [walletAddress as `0x${string}`],
                }),
            ])

            const formattedBalance = formatUnits(balance, USDC_DECIMALS)
            const formattedMaxWithdraw = formatUnits(maxWithdraw, USDC_DECIMALS)

            if (isMountedRef.current) {
                setUserMaxWithdrawAmount(formattedMaxWithdraw)
                setBalance(formattedBalance)
                setError(null)
            }
        } catch (error) {
            console.error('Error fetching user balance:', error)
            if (isMountedRef.current) {
                setError('Failed to fetch user balance')
            }
            setUserMaxWithdrawAmount('0')
            setBalance('0')
        } finally {
            if (isFirstTimeCall && isMountedRef.current) {
                setIsLoading(false)
            }

            // Schedule next update after completion
            if (isMountedRef.current) {
                // Clear any existing timeout before setting a new one
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
                
                timeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                        getUserBalance(walletAddress, false)
                    }
                }, 5000)
            }
        }
    }

    useEffect(() => {
        isMountedRef.current = true
        
        // Clear any existing timeout when dependencies change (chain changes)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        // Reset states when chain changes
        setIsLoading(true)
        
        getUserBalance(walletAddress, true)

        return () => {
            isMountedRef.current = false
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        }
    }, [walletAddress, selectedChain])

    return { balance, userMaxWithdrawAmount, isLoading, error }
}
