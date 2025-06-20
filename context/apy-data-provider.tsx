'use client'

import React, { createContext, useContext } from 'react'
import { useChain } from '@/context/chain-context'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import { VAULT_ADDRESS_MAP } from '@/lib/constants'

interface ApyDataContextType {
    boostApy: number
    boostApyStartDate: number
    isLoading: boolean
}

const ApyDataContext = createContext<ApyDataContextType>({
    boostApy: 0,
    boostApyStartDate: new Date('2025-05-12T00:00:00Z').getTime(),
    isLoading: true
})

export function ApyDataProvider({ children }: { children: React.ReactNode }) {
    const { selectedChain } = useChain()
    const boostApyStartDate = new Date('2025-05-12T00:00:00Z').getTime()

    const { data: boostRewardsData, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
        vaultAddress: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chainId: selectedChain,
        userAddress: undefined // Not required for global boost APY
    })

    const boostApy = boostRewardsData?.filter((item) => item.description?.includes('A global boost for all users') ?? false)
        .reduce((acc, curr) => acc + (curr.boost_apy / 100), 0) ?? 0

    return (
        <ApyDataContext.Provider
            value={{
                boostApy,
                boostApyStartDate,
                isLoading: isLoadingBoostRewards
            }}
        >
            {children}
        </ApyDataContext.Provider>
    )
}

export function useApyData() {
    return useContext(ApyDataContext)
}