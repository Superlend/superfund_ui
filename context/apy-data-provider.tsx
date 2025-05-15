'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { getBoostApy } from '@/lib/utils'

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
    const { totalAssets, isLoading: isLoadingVault } = useVaultHook()
    const [boostApy, setBoostApy] = useState<number>(0)
    const boostApyStartDate = new Date('2025-05-12T00:00:00Z').getTime()

    useEffect(() => {
        if (!isLoadingVault) {
            setBoostApy(getBoostApy(Number(totalAssets)))
        }
    }, [totalAssets, isLoadingVault])

    return (
        <ApyDataContext.Provider
            value={{
                boostApy,
                boostApyStartDate,
                isLoading: isLoadingVault
            }}
        >
            {children}
        </ApyDataContext.Provider>
    )
}

export function useApyData() {
    return useContext(ApyDataContext)
}