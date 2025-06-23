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
        isFailed: false,
    },
    setDepositTx: () => { },
    withdrawTx: {
        status: 'withdraw',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
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
    isDialogOpen: false,
    setIsDialogOpen: () => { },
    depositTxCompleted: false,
    withdrawTxCompleted: false,
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
    isFailed: boolean
}

export type TWithdrawTx = {
    status: 'withdraw' | 'view'
    hash: string
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
    isFailed: boolean
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
    isDialogOpen: boolean
    setIsDialogOpen: (open: boolean) => void
    depositTxCompleted: boolean
    withdrawTxCompleted: boolean
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
        isFailed: false,
    })

    const [withdrawTx, setWithdrawTx] = useState<TWithdrawTx>({
        status: 'withdraw',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
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
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

    const depositTxCompleted: boolean =
        depositTx.isConfirmed && !!depositTx.hash && depositTx.status === 'view'
    const withdrawTxCompleted: boolean =
        withdrawTx.isConfirmed && !!withdrawTx.hash && withdrawTx.status === 'view'

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
                isDialogOpen,
                setIsDialogOpen,
                depositTxCompleted,
                withdrawTxCompleted,
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
