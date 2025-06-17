import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    useAccount,
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
    WALLET_CONNECTION_LOST_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import {
    TDepositTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'
import { USDC_ADDRESS_MAP, USDC_DECIMALS, VAULT_ADDRESS_MAP } from '@/lib/constants'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { parseAbi } from 'viem'
import { useChain } from '@/context/chain-context'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useConnect } from "thirdweb/react"

interface IDepositButtonProps {
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: string
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
    walletAddress: `0x${string}`
    cta?: {
        text: string
        onClick: () => void
    }
}

const USDC_ABI = parseAbi([
    'function approve(address spender, uint256 amount) returns (bool)',
])

const VAULT_ABI = parseAbi([
    'function deposit(uint256 assets, address receiver)',
])

const DepositButton = ({
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
    walletAddress,
    cta,
}: IDepositButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { selectedChain } = useChain()
    const { logEvent } = useAnalytics()
    // const { canMakeTransactions } = useWalletConnection()
    const { isConnecting } = useConnect();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 2,
            hash,
        })

    const { depositTx, setDepositTx } = useTxContext() as TTxContext

    useEffect(() => {
        if (depositTx.status === 'deposit') {
            deposit()
        }
    }, [depositTx.status])

    const amountBN = useMemo(() => {
        return amount
            ? parseUnits(amount ?? '0', USDC_DECIMALS)
            : BigNumber.from(0)
    }, [amount, USDC_DECIMALS])

    const txBtnStatus: Record<string, string> = {
        pending:
            depositTx.status === 'approve'
                ? 'Approving token...'
                : 'Depositing token...',
        confirming: 'Confirming...',
        success: 'Close',
        default: 'Start depositing',
        connecting: 'Connecting wallet...',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isConfirmed: boolean
    ) => {
        if (isConnecting) return txBtnStatus['connecting']

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

    const txBtnText: string = getTxButtonText(isPending, isConfirming, isConfirmed)

    const deposit = useCallback(async () => {
        // Validate connection state before proceeding
        // if (!canMakeTransactions) {
        //     console.error('Cannot make transactions: wallet not properly connected')
        //     setDepositTx((prev: TDepositTx) => ({
        //         ...prev,
        //         errorMessage: WALLET_CONNECTION_LOST_MESSAGE,
        //         isPending: false,
        //         isConfirming: false,
        //     }))
        //     return
        // }

        try {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                status: 'deposit',
                hash: '',
                errorMessage: '',
            }))

            const amountInWei = parseUnits(amount, USDC_DECIMALS)

            writeContractAsync({
                address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
                abi: VAULT_ABI,
                functionName: 'deposit',
                args: [amountInWei.toBigInt(), walletAddress],
            })
                .then((data) => {
                    setDepositTx((prev: TDepositTx) => ({
                        ...prev,
                        status: 'view',
                        errorMessage: '',
                    }))

                    logEvent('deposit_successful', {
                        amount: amount,
                        chain: selectedChain,
                        token: underlyingAssetAdress,
                        walletAddress: walletAddress
                    })

                    // Dispatch custom event to notify transaction is complete
                    if (typeof window !== 'undefined') {
                        console.log('Dispatching transaction-complete event');
                        const event = new CustomEvent('transaction-complete', {
                            detail: {
                                type: 'deposit',
                                hash: hash,
                                amount: amount
                            }
                        });
                        window.dispatchEvent(event);
                    }
                })
                .catch((error) => {
                    console.error('Deposit transaction error:', error)

                    // Check if it's a connector error
                    const isConnectorError = error.message?.includes('Connector not connected') ||
                        error.message?.includes('No connector') ||
                        error.name === 'ConnectorNotConnectedError'

                    setDepositTx((prev: TDepositTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        errorMessage: isConnectorError
                            ? WALLET_CONNECTION_LOST_MESSAGE
                            : getErrorText(error as any),
                    }))
                })
        } catch (error) {
            console.error('Deposit error:', error)

            // Check if it's a connector error
            const isConnectorError = (error as any)?.message?.includes('Connector not connected') ||
                (error as any)?.message?.includes('No connector') ||
                (error as any)?.name === 'ConnectorNotConnectedError'

            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: isConnectorError
                    ? WALLET_CONNECTION_LOST_MESSAGE
                    : getErrorText(error as any),
            }))
        }
    }, [
        amount,
        poolContractAddress,
        underlyingAssetAdress,
        handleCloseModal,
        writeContractAsync,
        decimals,
        // canMakeTransactions,
        selectedChain,
        walletAddress,
        hash,
        logEvent,
        setDepositTx,
    ])

    useEffect(() => {
        setDepositTx((prev: TDepositTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))

        // If approval transaction is confirmed, move to deposit state after a brief delay
        if (isConfirmed && !isPending && !isConfirming && depositTx.status === 'approve') {
            logEvent('approve_successful', {
                amount: amount,
                chain: selectedChain,
                token: underlyingAssetAdress,
                walletAddress: walletAddress,
            })

            // Brief delay to show approval success before moving to deposit
            setTimeout(() => {
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    status: 'deposit',
                    allowanceBN: amountBN, // Set the allowance to the amount we just approved
                    errorMessage: '', // Clear any previous errors
                }))
            }, 1500) // 1.5 second delay to show approval success
        }
    }, [isPending, isConfirming, isConfirmed, depositTx.status, amountBN, amount, selectedChain, underlyingAssetAdress, walletAddress, logEvent, setDepositTx])

    // Separate effect to handle wagmi errors and prevent duplicate error messages
    useEffect(() => {
        if (error && !isPending && !isConfirming) {
            // Only set error if there's no existing error message to prevent duplicates
            if (!depositTx.errorMessage) {
                console.error('Wagmi contract error:', error)

                // Check if it's a connector error
                const isConnectorError = error.message?.includes('Connector not connected') ||
                    error.message?.includes('No connector') ||
                    error.name === 'ConnectorNotConnectedError'

                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: isConnectorError
                        ? WALLET_CONNECTION_LOST_MESSAGE
                        : getErrorText(error as any),
                }))
            }
        }
        // Clear wagmi errors when transaction starts
        else if ((isPending || isConfirming) && error) {
            // Transaction is in progress, wagmi error might be stale
            console.log('Clearing stale wagmi error as transaction is in progress')
        }
    }, [error, isPending, isConfirming, depositTx.errorMessage, setDepositTx])

    useEffect(() => {
        if (
            (depositTx.status === 'approve' ||
                depositTx.status === 'deposit') &&
            hash
        ) {
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
    }, [hash, depositTx.status, setDepositTx])

    const onApproveDeposit = async () => {
        // Validate connection state before proceeding
        // if (!canMakeTransactions) {
        //     console.error('Cannot make transactions: wallet not properly connected')
        //     setDepositTx((prev: TDepositTx) => ({
        //         ...prev,
        //         errorMessage: WALLET_CONNECTION_LOST_MESSAGE,
        //         isPending: false,
        //         isConfirming: false,
        //     }))
        //     return
        // }

        try {
            // Clear any previous errors when starting approval
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            const amountInWei = parseUnits(amount, USDC_DECIMALS)
            writeContractAsync({
                address: USDC_ADDRESS_MAP[selectedChain as keyof typeof USDC_ADDRESS_MAP] as `0x${string}`,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`, amountInWei.toBigInt()],
            }).catch((error) => {
                console.error('Approve transaction error:', error)

                // Check if it's a connector error
                const isConnectorError = error.message?.includes('Connector not connected') ||
                    error.message?.includes('No connector') ||
                    error.name === 'ConnectorNotConnectedError'

                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: isConnectorError
                        ? WALLET_CONNECTION_LOST_MESSAGE
                        : getErrorText(error as any),
                }))
            })
        } catch (error) {
            console.error('Approve error:', error)

            // Check if it's a connector error
            const isConnectorError = (error as any)?.message?.includes('Connector not connected') ||
                (error as any)?.message?.includes('No connector') ||
                (error as any)?.name === 'ConnectorNotConnectedError'

            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: isConnectorError
                    ? WALLET_CONNECTION_LOST_MESSAGE
                    : getErrorText(error as { message: string }),
            }))
        } finally {
            // After approval is completed and confirmed, set the allowanceBN
            if (isConfirmed && !isPending && !isConfirming) {
                // Update the allowanceBN to reflect the new approval amount
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    allowanceBN: amountBN,
                }))
            }
        }
    }

    // Add connection status warning - only show if actively connecting
    // const showConnectionWarning = !canMakeTransactions && isConnecting
    const showConnectionWarning = isConnecting

    return (
        <div className="flex flex-col gap-2">
            {/* {depositTx.status === 'approve' && (
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
                            from your wallet as the first step before depositing
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
            )} */}
            {showConnectionWarning && (
                <CustomAlert
                    description="Connecting wallet... Please wait."
                />
            )}
            {/* Show only one error message at a time - prioritize depositTx.errorMessage over wagmi error */}
            {depositTx.errorMessage.length > 0 ? (
                <CustomAlert description={depositTx.errorMessage} />
            ) : error ? (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            ) : null}
            <Button
                disabled={
                    (isPending || isConfirming || disabled || isConnecting) &&
                    depositTx.status !== 'view'
                }
                onClick={() => {
                    if (cta) {
                        cta.onClick()
                    }
                    if (depositTx.status === 'approve') {
                        onApproveDeposit()
                    } else if (depositTx.status === 'deposit') {
                        deposit()
                    } else {
                        handleCloseModal(false)
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {cta ? cta.text : txBtnText}
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
