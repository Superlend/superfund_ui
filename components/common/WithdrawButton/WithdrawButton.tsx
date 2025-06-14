import {
    useWriteContract,
    useWaitForTransactionReceipt,
    type BaseError,
    useAccount,
} from 'wagmi'
import { useCallback, useEffect } from 'react'
import { parseUnits } from 'ethers/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
import CustomAlert from '@/components/alerts/CustomAlert'
import {
    TWithdrawTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { USDC_DECIMALS, VAULT_ADDRESS_MAP } from '@/lib/constants'
import { parseAbi } from 'viem'
import { useChain } from '@/context/chain-context'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'

const VAULT_ABI = parseAbi([
    'function withdraw(uint256 _assets, address _receiver, address _owner) returns (uint256)',
])

interface IWithdrawButtonProps {
    disabled: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    cta?: {
        text: string
        onClick: () => void
    }
    walletAddress: `0x${string}`
}

const WithdrawButton = ({
    disabled,
    asset,
    amount,
    handleCloseModal,
    cta,
    walletAddress,
}: IWithdrawButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { selectedChain } = useChain()
    const { logEvent } = useAnalytics()
    const { canMakeTransactions, isConnectingWallet } = useWalletConnection()
    const { withdrawTx, setWithdrawTx } = useTxContext() as TTxContext
    const txBtnStatus: Record<string, string> = {
        pending: 'Withdrawing...',
        confirming: 'Confirming...',
        success: 'Close',
        error: 'Close',
        default: 'Start withdrawing',
        connecting: 'Connecting wallet...',
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    useEffect(() => {
        if (withdrawTx.status === 'view') return

        // if (hash) {
        //     setWithdrawTx((prev: TWithdrawTx) => ({
        //         ...prev,
        //         status: 'view',
        //         hash,
        //     }))
        // }

        if (hash && isConfirmed) {
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                status: 'view',
                hash,
                isConfirmed: isConfirmed,
            }))

            logEvent('withdraw_successful', {
                amount: amount,
                chain: selectedChain,
                token: asset.address,
                walletAddress: walletAddress,
            })
            // Dispatch custom event to notify transaction is complete
            if (typeof window !== 'undefined') {
                console.log(
                    'Dispatching transaction-complete event for withdraw'
                )
                const event = new CustomEvent('transaction-complete', {
                    detail: {
                        type: 'withdraw',
                        hash: hash,
                        amount: amount,
                    },
                })
                window.dispatchEvent(event)
            }
        }
    }, [hash, isConfirmed])

    // Update the status(Loading states) of the lendTx based on the isPending and isConfirming states
    useEffect(() => {
        setWithdrawTx((prev: TWithdrawTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    const txBtnText =
        txBtnStatus[
            isConnectingWallet
                ? 'connecting'
                : isConfirming
                  ? 'confirming'
                  : isConfirmed
                    ? withdrawTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
                      ? 'pending'
                      : !isPending &&
                          !isConfirming &&
                          !isConfirmed &&
                          withdrawTx.status === 'view'
                        ? 'error'
                        : 'default'
        ]

    const handleWithdrawSuperVault = useCallback(async () => {
        // Validate connection state before proceeding
        if (!canMakeTransactions) {
            console.error('Cannot make transactions: wallet not properly connected')
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                errorMessage: 'Wallet not properly connected. Please reconnect your wallet.',
                isPending: false,
                isConfirming: false,
            }))
            return
        }

        const amountInWei = parseUnits(amount, USDC_DECIMALS)

        try {
            await writeContractAsync({
                address: VAULT_ADDRESS_MAP[
                    selectedChain as keyof typeof VAULT_ADDRESS_MAP
                ] as `0x${string}`,
                abi: VAULT_ABI,
                functionName: 'withdraw',
                args: [
                    amountInWei.toBigInt(),
                    walletAddress as `0x${string}`,
                    walletAddress as `0x${string}`,
                ],
            })
        } catch (error) {
            console.error('Withdraw error:', error)
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: error instanceof Error ? error.message : 'Transaction failed',
            }))
        }
    }, [canMakeTransactions, amount, selectedChain, walletAddress, writeContractAsync, setWithdrawTx])

    const onWithdraw = async () => {
        await handleWithdrawSuperVault()
        return
    }

    // Add connection status warning
    const showConnectionWarning = !canMakeTransactions && !isConnectingWallet

    return (
        <div className="flex flex-col gap-2">
            {showConnectionWarning && (
                <CustomAlert
                    description="Wallet connection lost. Please reconnect your wallet to continue."
                />
            )}
            {(error || withdrawTx.errorMessage) && (
                <CustomAlert
                    description={
                        error 
                            ? (error as BaseError).shortMessage || error.message
                            : withdrawTx.errorMessage
                    }
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (isPending || isConfirming || disabled || !canMakeTransactions) &&
                    withdrawTx.status !== 'view'
                }
                onClick={() => {
                    if (withdrawTx.status !== 'view') {
                        onWithdraw()
                    } else {
                        handleCloseModal(false)
                    }
                }}
            >
                {txBtnText}
                {withdrawTx.status !== 'view' &&
                    !isPending &&
                    !isConfirming && (
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

export default WithdrawButton
