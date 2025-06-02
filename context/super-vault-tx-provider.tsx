'use client'

import { BigNumber } from 'ethers'
import { createContext, useContext, useState } from 'react'

const TxInitialState: TTxContext = {
    depositTx: {
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    },
    setDepositTx: () => { },
    withdrawTx: {
        status: 'withdraw',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    },
    setWithdrawTx: () => { },
    claimRewardsTx: {
        status: 'claim',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    },
    setClaimRewardsTx: () => { },
    initialPosition: 0,
    setInitialPosition: () => { },
}

export const TxContext = createContext<TTxContext>(TxInitialState)

export type TDepositTx = {
    status: 'approve' | 'deposit' | 'view'
    hash: string
    allowanceBN: BigNumber
    isRefreshingAllowance: boolean
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
}

export type TWithdrawTx = {
    status: 'withdraw' | 'view'
    hash: string
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
}

export type TClaimRewardsTx = {
    status: 'claim' | 'view'
    hash: string
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
}

export type TTxContext = {
    depositTx: TDepositTx
    setDepositTx: any
    withdrawTx: TWithdrawTx
    setWithdrawTx: any
    claimRewardsTx: TClaimRewardsTx
    setClaimRewardsTx: any
    initialPosition: number
    setInitialPosition: (position: number) => void
}

export default function TxProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [depositTx, setDepositTx] = useState<TDepositTx>({
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    })

    const [withdrawTx, setWithdrawTx] = useState<TWithdrawTx>({
        status: 'withdraw',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    })

    const [claimRewardsTx, setClaimRewardsTx] = useState<TClaimRewardsTx>({
        status: 'claim',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    })

    const [initialPosition, setInitialPosition] = useState<number>(0)

    return (
        <TxContext.Provider
            value={{
                depositTx,
                setDepositTx,
                withdrawTx,
                setWithdrawTx,
                claimRewardsTx,
                setClaimRewardsTx,
                initialPosition,
                setInitialPosition,
            }}
        >
            {children}
        </TxContext.Provider>
    )
}

export const useTxContext = () => {
    const context = useContext(TxContext)
    if (!context)
        throw new Error(
            'useTxContext must be used within an SuperVaultTxProvider'
        )
    return context
}
