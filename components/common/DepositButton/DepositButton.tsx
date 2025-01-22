import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    useAccount,
    useConnect,
    useWaitForTransactionReceipt,
    useWriteContract,
} from 'wagmi'
import { parseUnits } from 'ethers/lib/utils'
import {
    APPROVE_MESSAGE,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { TDepositTx, TTxContext, useTxContext } from '@/context/super-vault-tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'

interface IDepositButtonProps {
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const DepositButton = ({
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: IDepositButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 2,
            hash,
        })
    const { address: walletAddress } = useAccount()
    // const { createToast } = useCreatePendingToast()
    const { isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { depositTx, setDepositTx } = useTxContext() as TTxContext

    const amountBN = useMemo(() => {
        return amount ? parseUnits(amount, decimals) : BigNumber.from(0)
    }, [amount, decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            depositTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: 'Close',
        default: depositTx.status === 'approve' ? 'Approve token' : 'Deposit token',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isConfirmed: boolean
    ) => {
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isConfirmed
                    ? depositTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
                        ? 'pending'
                        : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    const supply = useCallback(async () => {
        try {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                status: 'deposit',
                hash: '',
                errorMessage: '',
            }))

            writeContractAsync({
                address: poolContractAddress,
                abi: [],
                functionName: 'deposit',
                args: [],
            })
                .then((data) => {
                    setDepositTx((prev: TDepositTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))
                })
                .catch((error) => {
                    setDepositTx((prev: TDepositTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                    }))
                })
        } catch (error) {
            error
        }
    }, [
        amount,
        poolContractAddress,
        underlyingAssetAdress,
        walletAddress,
        handleCloseModal,
        writeContractAsync,
        decimals,
    ])

    useEffect(() => {
        setDepositTx((prev: TDepositTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    useEffect(() => {
        if (depositTx.status === 'view') return

        if (!depositTx.isConfirmed && !depositTx.isPending && !depositTx.isConfirming) {
            if (depositTx.allowanceBN.gte(amountBN)) {
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    status: 'deposit',
                    hash: '',
                    errorMessage: '',
                }))
            } else {
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: '',
                }))
            }
        }
    }, [depositTx.allowanceBN])

    useEffect(() => {
        if ((depositTx.status === 'approve' || depositTx.status === 'deposit') && hash) {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (depositTx.status === 'view' && hash) {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
    }, [hash, depositTx.status])

    const onApproveSupply = async () => {
        // if (!isConnected) {
        //     // If not connected, prompt connection first
        //     try {
        //         const connector = connectors[0] // Usually metamask/injected connector
        //         await connect({ connector })
        //         return
        //     } catch (error) {
        //         console.error('Connection failed:', error)
        //         return
        //     }
        // }

        try {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            writeContractAsync({
                address: underlyingAssetAdress,
                abi: [],
                functionName: 'approve',
                args: [poolContractAddress, parseUnits(amount, decimals)],
            }).catch((error) => {
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                }))
            })
        } catch (error) {
            error
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {depositTx.status === 'approve' && (
                <CustomAlert
                    variant="info"
                    hasPrefixIcon={false}
                    description={
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-secondary-500"
                        >
                            Note: You need to complete an &apos;approval
                            transaction&apos; granting permission to move funds
                            from your wallet as the first step before supplying
                            the asset.
                            <a
                                href="https://eips.ethereum.org/EIPS/eip-2612"
                                target="_blank"
                                className="text-secondary-500 pb-[0.5px] border-b border-secondary-500 hover:border-secondary-200 ml-1"
                            >
                                Learn more
                            </a>
                            .
                        </BodyText>
                    }
                />
            )}
            {error && (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            )}
            {depositTx.errorMessage.length > 0 && (
                <CustomAlert description={depositTx.errorMessage} />
            )}
            <Button
                disabled={
                    (isPending || isConfirming || disabled) &&
                    depositTx.status !== 'view'
                }
                onClick={() => {
                    if (depositTx.status === 'approve') {
                        onApproveSupply()
                    } else if (depositTx.status === 'deposit') {
                        supply()
                    } else {
                        handleCloseModal(false)
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {depositTx.status !== 'view' && !isPending && !isConfirming && (
                    <ArrowRightIcon
                        width={16}
                        height={16}
                        className="stroke-white group-[:disabled]:opacity-50"
                    />
                )}
            </Button>
        </div>
    )
}

export default DepositButton
