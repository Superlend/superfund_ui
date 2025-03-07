import { USDC_ADDRESS, USDC_DECIMALS, VAULT_ADDRESS } from '@/lib/constants'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState, useRef } from 'react'
import { createPublicClient, formatUnits, http, parseAbi } from 'viem'
import { base } from 'viem/chains'

const USDC_ABI = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function allowance(address, address) view returns (uint256)',
])

// Create public client outside component to prevent recreation
const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ''),
    batch: {
        multicall: true,
    },
})

const VAULT_ABI = parseAbi([
    'function totalAssets() view returns (uint256)',
    // maxWithdraw
    'function maxWithdraw(address user) view returns (uint256)',
])

export async function checkAllowance(walletAddress: `0x${string}`) {
    const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [walletAddress as `0x${string}`, VAULT_ADDRESS as `0x${string}`],
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

    async function getUserBalance(walletAddress: string, isFirstTimeCall: boolean) {
        if (!walletAddress) return

        try {
            if (isFirstTimeCall) {
                setIsLoading(true)
            }
            const [balance, maxWithdraw] = await Promise.all([
                publicClient.readContract({
                    address: USDC_ADDRESS,
                    abi: USDC_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress as `0x${string}`],
                }),
                publicClient.readContract({
                    address: VAULT_ADDRESS as `0x${string}`,
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
        } finally {
            if (isFirstTimeCall && isMountedRef.current) {
                setIsLoading(false)
            }

            // Schedule next update after completion
            if (isMountedRef.current) {
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

        // Initial fetch
        getUserBalance(walletAddress, true)

        return () => {
            isMountedRef.current = false
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [walletAddress])

    return { balance, userMaxWithdrawAmount, isLoading, error }
}
