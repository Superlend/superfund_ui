'use client'

import {
    StrategiesType,
    TOTAL_ALLOCATION_POINTS,
    USDC_DECIMALS,
    VAULT_ADDRESS,
    VAULT_STRATEGIES,
} from '@/lib/constants'
import { TReward, TRewardAsset } from '@/types'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState, useCallback } from 'react'
import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { base } from 'viem/chains'
import { BASE_FLUID_LENDING_RESOLVER_ADDRESS } from '@/lib/constants'
import FLUID_LENDING_RESOLVER_ABI from './abis/FluidLendingResolver.json'
import { BigNumber } from 'ethers'

const VAULT_ABI = parseAbi([
    'function totalAssets() view returns (uint256)',
    // maxWithdraw
    'function maxWithdraw(address user) view returns (uint256)',

    'function getEulerEarnSavingRate() view returns (uint40, uint40, uint168)',

    'function getStrategy(address _strategy) view returns (uint120, uint96, uint160, uint8)',
])

// Create public client outside component to prevent recreation
const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ''),
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
            const [assets, eulerEarnSavingRate] = await Promise.all([
                publicClient.readContract({
                    address: VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: 'totalAssets',
                }),
                publicClient.readContract({
                    address: VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: 'getEulerEarnSavingRate',
                }),
            ])

            const [timeEnd, timeStart, rewards] = eulerEarnSavingRate

            // tokenDisSec = (rewards / (timeStart - timeEnd)) 
            // tokenDisYear = tokenDisSec * 365 * 24 * 60 * 60
            // APR = (tokenDisYear / totalAssets) * 100
            const rate =
                (((parseFloat(formatUnits(rewards, USDC_DECIMALS)) /
                    (timeStart - timeEnd)) *
                    (365 * 24 * 60 * 60)) /
                    parseFloat(formatUnits(assets, USDC_DECIMALS))) *
                100

            const formattedAssets = formatUnits(assets, USDC_DECIMALS)
            setTotalAssets(formattedAssets)
            setSpotApy(convertAPRtoAPY(rate / 100).toFixed(2))
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

            const address = strategies_internal.address

            calls.push(
                publicClient
                    .readContract({
                        address: VAULT_ADDRESS,
                        abi: VAULT_ABI,
                        functionName: 'getStrategy',
                        args: [address as `0x${string}`],
                    })
                    .then((res) => {
                        local_allocationPoints.push({
                            name: key,
                            value: Number(res[1].toString()),
                        })
                    })
            )

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

export function useRewardsHook() {
    const [rewards, setRewards] = useState<TReward[]>([])
    const [totalRewardApy, setTotalRewardApy] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    async function fetchRewards() {
        if (isLoading) return
        try {
            setIsLoading(true)
            const rewards = await fetchRewardApyBasedOnAllocationPoints()
            const totalRewardApy = rewards.reduce((acc, reward) => acc + reward.supply_apy, 0)
            setRewards(rewards)
            setTotalRewardApy(totalRewardApy)
            setIsLoading(false)
        } catch (err) {
            console.error('Error fetching rewards:', err)
            setError('Failed to fetch rewards')
        }
    }

    useEffect(() => {
        fetchRewards()
        const interval = setInterval(fetchRewards, 5000)
        return () => clearInterval(interval)
    }, [])

    return { rewards, totalRewardApy, isLoading, error }
}

export async function fetchRewardApyBasedOnAllocationPoints(): Promise<TReward[]> {
    try {
        let localAllocations: { name: string; address: string; strategy_type: StrategiesType; value: number }[] = []
        const strategies = VAULT_STRATEGIES
        const keys = Object.keys(strategies)

        let calls = []
        for (const key of keys) {
            const strategiesInternal = strategies[key as keyof typeof strategies]

            const address = strategiesInternal.address
            const strategy_type = strategiesInternal.strategy_type

            calls.push(
                publicClient
                    .readContract({
                        address: VAULT_ADDRESS,
                        abi: VAULT_ABI,
                        functionName: 'getStrategy',
                        args: [address as `0x${string}`],
                    })
                    .then((res) => {
                        localAllocations.push({
                            name: key,
                            address: address,
                            strategy_type: strategy_type,
                            value: Number(res[1].toString()),
                        })
                    })
            )
        }

        // push cash reserve to calls
        calls.push(
            publicClient
                .readContract({
                    address: VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: 'getStrategy',
                    args: ['0x0000000000000000000000000000000000000000' as `0x${string}`],
                })
                .then((res) => {
                    localAllocations.push({
                        name: 'CASH_RESERVE',
                        address: '0x0000000000000000000000000000000000000000',
                        strategy_type: StrategiesType.CASH_RESERVE,
                        value: Number(res[1].toString()),
                    })
                })
        )

        await Promise.all(calls)

        localAllocations = localAllocations.map((item) => ({
            name: item.name,
            address: item.address,
            strategy_type: item.strategy_type,
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

        // console.log(localAllocations)

        let rewards: TReward[] = []

        for (const item of localAllocations) {
            if (item.strategy_type === StrategiesType.CASH_RESERVE || item.value === 0) {
                continue
            }

            let [rewardApyCurrent, asset] = await fetchRewardApyStrategy(item.address, item.strategy_type)
            let rewardApy = rewardApyCurrent * (item.value / 100)

            if (asset) {
                rewards.push({
                    supply_apy: rewardApy,
                    asset: {
                        symbol: asset.symbol,
                        name: asset.name,
                        address: asset.address,
                        decimals: 0,
                        logo: asset.logo,
                        price_usd: 0,
                    },
                })
            }
        }

        return rewards
    } catch (err) {
        console.error('Error fetching allocation points:', err)
        throw err
    }
}

const FLUID_ASSET = {
    symbol: 'Fluid',
    name: 'Fluid',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/fluid_logo.png',
}

const MORPHO_ASSET = {
    symbol: 'MORPHO',
    name: 'Morpho Token',
    address: '0x58D97B57BB95320F9a05dC918Aef65434969c2B2',
    decimals: 18,
    logo: 'https://cdn.morpho.org/assets/logos/morpho.svg',
}

const EULER_BASE_USDC_ASSET = {
    symbol: 'rEUL',
    name: 'rEUL',
    address: '0x0A1a3b5f2041F33522C4efc754a7D096f880eE16',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/AngleProtocol/angle-token-list/main/src/assets/tokens/EUL.svg',
}

async function fetchRewardApyStrategy(address: string, strategy_type: StrategiesType): Promise<[number, TRewardAsset | null]> {
    let rewardApyCurrent = 0

    if (strategy_type === StrategiesType.Fluid) {
        let rewardApy = await fetchRewardApyFluid(address)
        // console.log("Fluid rewardApy", rewardApy)
        rewardApyCurrent = rewardApy

        return [rewardApyCurrent, FLUID_ASSET as TRewardAsset]

    } else if (strategy_type === StrategiesType.Morpho) {
        let rewardApy = await fetchRewardApyMorpho(address)
        // console.log("Morpho rewardApy", rewardApy)
        rewardApyCurrent = rewardApy

        return [rewardApyCurrent, MORPHO_ASSET as TRewardAsset]
    } else if (strategy_type === StrategiesType.EulerBaseUSDC) {
        let rewardApy = await fetchRewardApyEulerBaseUSDC(address)
        // console.log("EulerBaseUSDC rewardApy", rewardApy)
        rewardApyCurrent = rewardApy

        return [rewardApyCurrent, EULER_BASE_USDC_ASSET as TRewardAsset]
    }
    else {
        return [0, null]
    }
}


async function fetchRewardApyFluid(address: string): Promise<number> {
    let rewardApy = await publicClient.readContract({
        address: BASE_FLUID_LENDING_RESOLVER_ADDRESS,
        abi: FLUID_LENDING_RESOLVER_ABI,
        functionName: 'getFTokenRewards',
        args: [address as `0x${string}`],
    }) as [string, bigint]

    return parseFloat(formatUnits(rewardApy[1], 12))
}

const MORPHO_API_URL = 'https://blue-api.morpho.org/graphql'

// This will use graphql morpho apis to fetch the netApy and netApyWithoutRewards
async function fetchRewardApyMorpho(address: string): Promise<number> {
    let vault_address = address;

    let query = `
    query GetVaultsMetrics {
        vaults (where: {address_in:["${vault_address}"]}){
            items {
                state {
                    netApy
                    netApyWithoutRewards
                }
            }
        }
    }
    `;

    let response = await fetch(MORPHO_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    })

    let data = await response.json()

    if (data.errors) {
        console.error('GraphQL Errors:', data.errors)
        return 0
    }

    let netApy = data.data.vaults.items[0].state.netApy
    let netApyWithoutRewards = data.data.vaults.items[0].state.netApyWithoutRewards

    // netApy comes as a percentage string like "4.5", convert to number
    return (parseFloat(netApy) - parseFloat(netApyWithoutRewards)) * 100
}


const EULER_REWARDS_API_URL = "/api/euler/rewards"; // Local API endpoint

async function fetchRewardApyEulerBaseUSDC(address: string): Promise<number> {
    try {
        let response = await fetch(`${EULER_REWARDS_API_URL}?address=${address}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        let data = await response.json();

        const rewards = data[address];
        if (!rewards || !Array.isArray(rewards)) {
            return 0;
        }

        const currentTimestamp = Math.floor(Date.now() / 1000); // Current UTC timestamp in seconds
        let totalApy = 0;

        for (const reward of rewards) {
            const endTimestamp = reward.endTimestamp;

            // Skip if reward period has ended
            if (endTimestamp < currentTimestamp) {
                continue;
            }

            totalApy += reward.apr;
        }

        return totalApy; // Convert to percentage
    } catch (error) {
        console.error("Error fetching Euler rewards:", error);
        return 0;
    }
}