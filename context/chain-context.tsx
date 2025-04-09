'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ChainId } from '@/types/chain'
import { useWalletConnection } from '@/hooks/useWalletConnection'

// Constants for chain details
export const CHAIN_DETAILS = {
    [ChainId.Base]: {
        name: 'Base',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/base.svg',
        contractAddress: '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B',
        explorerUrl: 'https://basescan.org/address/'
    },
    [ChainId.Sonic]: {
        name: 'Sonic',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/sonic.svg',
        contractAddress: '0x96328cd6fBCc3adC8bee58523Bbc67aBF38f8124',
        explorerUrl: 'https://sonicscan.org/address/'
    }
}

interface ChainContextType {
    selectedChain: ChainId
    setSelectedChain: (chain: ChainId) => Promise<void>
    isChangingChain: boolean
    supportedChains: ChainId[]
    chainDetails: typeof CHAIN_DETAILS
}

const ChainContext = createContext<ChainContextType | undefined>(undefined)

export function ChainProvider({
    children,
    supportedChains = [ChainId.Base, ChainId.Sonic]
}: {
    children: ReactNode,
    supportedChains?: ChainId[]
}) {
    const [selectedChain, setSelectedChainState] = useState<ChainId>(ChainId.Sonic)
    const [isChangingChain, setIsChangingChain] = useState(false)
    const { handleSwitchChain, isWalletConnected } = useWalletConnection()

    const setSelectedChain = async (chain: ChainId) => {
        try {
            setIsChangingChain(true)

            if (isWalletConnected) {
                await handleSwitchChain(chain)
            }

            setSelectedChainState(chain)
        } catch (error) {
            console.error('Error switching chain:', error)
        } finally {
            setIsChangingChain(false)
        }
    }

    useEffect(() => {
        if (isWalletConnected) {
            handleSwitchChain(selectedChain)
        }
    }, [isWalletConnected])

    return (
        <ChainContext.Provider value={{
            selectedChain,
            setSelectedChain,
            isChangingChain,
            supportedChains,
            chainDetails: CHAIN_DETAILS
        }}>
            {children}
        </ChainContext.Provider>
    )
}

export function useChain() {
    const context = useContext(ChainContext)
    if (context === undefined) {
        throw new Error('useChain must be used within a ChainProvider')
    }
    return context
}

// DOCS
/**
 * The implementation follows a scalable architecture that can easily accommodate additional chains in the future by following these steps:
 * 1. Add the new chain to the ChainId enum
 * 2. Add its configuration in CHAIN_CONFIGS
 * 3. Add its public client in publicClients
 * 4. Update the supportedChains array in the ChainProvider
 * 
 * To finalize this implementation, make sure to:
 * 1. Update the actual contract addresses for Sonic
 * 2. Ensure the RPC URLs are configured properly
 * 3. Test the chain-switching functionality thoroughly
 */