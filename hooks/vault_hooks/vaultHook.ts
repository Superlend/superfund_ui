'use client'

import {
    TOTAL_ALLOCATION_POINTS,
    USDC_DECIMALS,
    VAULT_ADDRESS,
    VAULT_STRATEGIES,
} from '@/lib/constants'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState, useCallback } from 'react'
import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

const VAULT_ABI = parseAbi([
    'function lastTotalAssets() view returns (uint256)',
    'function getStrategy(address _strategy) view returns (uint120, uint96, uint160, uint8)',
    'function maxWithdraw(address user) view returns (uint256)',
])

// Create public client outside component to prevent recreation
const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
    batch: {
        multicall: true,
    },
})

export function useVaultHook() {
    const [totalAssets, setTotalAssets] = useState<string>('0')
    const [spotApy, setSpotApy] = useState<string>('0')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function fetchVaultData() {
        try {
            setIsLoading(true)
            const [assets] = await Promise.all([
                publicClient.readContract({
                    address: VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: 'lastTotalAssets',
                }),
                // publicClient.readContract({
                //     address: VAULT_ADDRESS,
                //     abi: VAULT_ABI,
                //     functionName: 'getEulerEarnSavingRate',
                // }),
            ])

            // const [timeEnd, timeStart, rewards] = eulerEarnSavingRate

            // const rate =
            //     (((parseFloat(formatUnits(rewards, USDC_DECIMALS)) /
            //         (timeStart - timeEnd)) *
            //         (365 * 24 * 60 * 60)) /
            //         parseFloat(formatUnits(assets, USDC_DECIMALS))) *
            //     100

            const formattedAssets = formatUnits(assets, USDC_DECIMALS)
            setTotalAssets(formattedAssets)
            // setSpotApy(convertAPRtoAPY(rate / 100).toFixed(2))
            setError(null)
        } catch (err) {
            console.error('Error fetching vault data:', err)
            setError('Failed to fetch vault data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Initial fetch
        fetchVaultData()

        // Refresh every 5 seconds
        const interval = setInterval(fetchVaultData, 5000)
        return () => clearInterval(interval)
    }, [])

    return { totalAssets, spotApy, isLoading, error }
}

const SEC_IN_YEAR = 31536000

export const convertAPRtoAPY = (apr: number) => {
    if (!apr) return 0
    const apy = ((1 + apr / SEC_IN_YEAR) ** SEC_IN_YEAR - 1) * 100
    return apy < 0.01 && apy > 0 ? 0.01 : apy
}

export function useVaultAllocationPoints() {
    // allocation points = [ {name}: {value}]
    const [allocationPoints, setAllocationPoints] = useState<
        { name: string; value: number }[]
    >([])

    async function fetchAllocationPoints() {
        let local_allocationPoints: { name: string; value: number }[] = []
        const strategies = VAULT_STRATEGIES
        const keys = Object.keys(strategies)

        let calls = []
        for (const key of keys) {
            const strategies_internal =
                strategies[key as keyof typeof strategies]

            for (const strategy of strategies_internal) {
                calls.push(
                    publicClient
                        .readContract({
                            address: VAULT_ADDRESS,
                            abi: VAULT_ABI,
                            functionName: 'getStrategy',
                            args: [strategy as `0x${string}`],
                        })
                        .then((res) => {
                            local_allocationPoints.push({
                                name: key,
                                value: Number(res[1].toString()),
                            })
                            // setAllocationPoints(prev => [...prev, { name: key, value: res[1].toString() }])
                        })
                )
            }
        }

        await Promise.all(calls)

        local_allocationPoints = local_allocationPoints.map((item) => ({
            name: item.name,
            value:
                item.value != 0
                    ? parseFloat(
                          (
                              (Number(item.value) / TOTAL_ALLOCATION_POINTS) *
                              100
                          ).toFixed(2)
                      )
                    : 0,
        }))

        // if the key same then add the value
        local_allocationPoints = local_allocationPoints.reduce(
            (acc: { name: string; value: number }[], item) => {
                const existing = acc.find((i) => i.name === item.name)
                if (existing) {
                    existing.value = parseFloat(
                        (Number(existing.value) + Number(item.value)).toFixed(2)
                    )
                } else {
                    acc.push(item)
                }
                return acc
            },
            []
        )

        setAllocationPoints(local_allocationPoints)
    }

    useEffect(() => {
        fetchAllocationPoints()
    }, [])

    return { allocationPoints }
}
