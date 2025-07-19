import { useCallback, useEffect, useState } from 'react'
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
import { useChain } from '@/context/chain-context'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useActiveAccount, useConnect, useSendAndConfirmTransaction } from "thirdweb/react"
import { estimateGas, getContract, prepareContractCall, waitForReceipt } from "thirdweb"
import { client } from "@/app/client"
import { base, defineChain } from "thirdweb/chains"
import { ChainId } from '@/types/chain'
import { getErrorText } from '@/lib/getErrorText'

// Define custom Sonic chain
const sonic = defineChain({
    id: 146,
    name: "Sonic",
    nativeCurrency: {
        name: "Sonic",
        symbol: "S",
        decimals: 18,
    },
    rpc: process.env.NEXT_PUBLIC_SONIC_RPC_URL || "https://rpc.soniclabs.com",
    blockExplorers: [
        {
            name: "Sonicscan",
            url: "https://sonicscan.org",
        },
    ],
})

// Define chain mapping for Thirdweb
const THIRDWEB_CHAINS = {
    [ChainId.Base]: base,
    [ChainId.Sonic]: sonic,
}

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
    const account = useActiveAccount()
    const { mutateAsync: sendAndConfirmTransaction, isPending } = useSendAndConfirmTransaction()
    const { selectedChain } = useChain()
    const { logEvent } = useAnalytics()
    const { isConnecting } = useConnect()

    // Transaction state
    const [hash, setHash] = useState<string>('')
    const [isConfirming, setIsConfirming] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const { withdrawTx, setWithdrawTx } = useTxContext() as TTxContext

    const txBtnStatus: Record<string, string> = {
        pending: 'Withdrawing...',
        confirming: 'Confirming...',
        success: 'Close',
        error: 'Close',
        default: 'Start withdrawing',
        connecting: 'Connecting wallet...',
    }

    useEffect(() => {
        if (withdrawTx.status === 'view' && withdrawTx.hash) return // Only return if both status is 'view' AND hash is already set

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
                walletAddress: account?.address || walletAddress,
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
    }, [hash, isConfirmed, withdrawTx.status, withdrawTx.hash, amount, selectedChain, asset.address, account?.address, walletAddress, logEvent, setWithdrawTx])

    // Update the status(Loading states) of the withdrawTx based on the isPending and isConfirming states
    useEffect(() => {
        setWithdrawTx((prev: TWithdrawTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed, setWithdrawTx])

    const txBtnText =
        txBtnStatus[
        isConnecting
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
        if (!account) {
            console.error('Cannot make transactions: wallet not properly connected')
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                errorMessage: 'Wallet not properly connected. Please reconnect your wallet.',
                isPending: false,
                isConfirming: false,
            }))
            return
        }

        try {
            setError(null)
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                isPending: true,
                hash: '',
                errorMessage: '',
            }))

            const amountInWei = parseUnits(amount, USDC_DECIMALS)

            const vaultContract = getContract({
                client,
                address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
            })

            // Prepare raw transaction for gas estimation
            const rawTransaction = prepareContractCall({
                contract: vaultContract,
                method: "function withdraw(uint256 _assets, address _receiver, address _owner) returns (uint256)",
                params: [
                    amountInWei.toBigInt(),
                    account.address as `0x${string}`,
                    account.address as `0x${string}`,
                ],
            })

            // Gas estimation with buffer
            const gasCost = await estimateGas({
                transaction: rawTransaction,
                from: account.address as `0x${string}`,
            })
            const requiredGas = (gasCost * BigInt(12)) / BigInt(10) // 20% buffer

            // Prepare final transaction with optimized gas
            const transaction = prepareContractCall({
                contract: vaultContract,
                method: "function withdraw(uint256 _assets, address _receiver, address _owner) returns (uint256)",
                params: [
                    amountInWei.toBigInt(),
                    account.address as `0x${string}`,
                    account.address as `0x${string}`,
                ],
                gas: requiredGas,
            })

            // Send transaction
            const result = await sendAndConfirmTransaction(transaction)
            setHash(result.transactionHash)

            // Wait for confirmation
            setIsConfirming(true)
            const receipt = await waitForReceipt({
                client,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
                transactionHash: result.transactionHash,
            })

            setIsConfirming(false)

            console.log('Withdraw transaction receipt:', receipt)
            console.log('Withdraw receipt status:', receipt.status)
            console.log('Withdraw receipt status type:', typeof receipt.status)

            const statusValue = receipt.status as any
            const isSuccess = statusValue === 'success' || 
                             statusValue === 1 || 
                             statusValue === '0x1' ||
                             statusValue === true

            const isFailed = statusValue === 'reverted' || 
                            statusValue === 'failed' || 
                            statusValue === 0 || 
                            statusValue === '0x0' ||
                            statusValue === false

            console.log('Withdraw isSuccess:', isSuccess, 'isFailed:', isFailed)

            if (isSuccess) {
                setIsConfirmed(true)

                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    status: 'view',
                    hash: result.transactionHash,
                    errorMessage: '',
                    isFailed: false,
                    isConfirmed: true,
                }))
            } else if (isFailed) {
                console.log('Withdraw transaction detected as failed')
                
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: 'Transaction failed on the blockchain. Please try again.',
                    isFailed: true,
                }))
                return // Exit early, don't proceed with success logic
            } else {
                // Unknown status - treat as failure for safety
                console.log('Unknown withdraw transaction status, treating as failure')
                
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: 'Transaction status unclear. Please check the explorer.',
                    isFailed: true,
                }))
                return
            }

        } catch (error) {
            console.error('Withdraw error:', error)
            setIsConfirming(false)
            setError(error as Error)

            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: getErrorText(error as any),
            }))
        }
    }, [account, amount, selectedChain, sendAndConfirmTransaction, setWithdrawTx])

    const onWithdraw = async () => {
        await handleWithdrawSuperVault()
        return
    }

    // Add connection status warning
    const showConnectionWarning = !account && !isConnecting

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
                            ? getErrorText(error)
                            : withdrawTx.errorMessage
                    }
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (withdrawTx.isPending || withdrawTx.isConfirming || disabled || !account) &&
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
