import { useCallback, useEffect, useState } from 'react'
import { parseUnits } from 'ethers/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
import CustomAlert from '@/components/alerts/CustomAlert'
import {
    TTransferTx,
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

interface ITransferButtonProps {
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

const TransferButton = ({
    disabled,
    asset,
    amount,
    handleCloseModal,
    cta,
    walletAddress,
}: ITransferButtonProps) => {
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

    const { transferTx, setTransferTx } = useTxContext() as TTxContext

    const txBtnStatus: Record<string, string> = {
        pending: 'Sending...',
        confirming: 'Confirming...',
        success: 'Close',
        error: 'Close',
        default: 'Start sending',
        connecting: 'Connecting wallet...',
    }

    useEffect(() => {
        if (transferTx.status === 'view' && transferTx.hash) return // Only return if both status is 'view' AND hash is already set

        if (hash && isConfirmed) {
            setTransferTx((prev: TTransferTx) => ({
                ...prev,
                status: 'view',
                hash,
                isConfirmed: isConfirmed,
            }))

            logEvent('transfer_successful', {
                amount: amount,
                chain: selectedChain,
                token: asset.asset.address,
                walletAddress: account?.address || walletAddress,
            })
        }
    }, [hash, isConfirmed, transferTx.status, transferTx.hash, amount, selectedChain, asset.asset.address, account?.address, walletAddress, logEvent, setTransferTx])

    // Update the status(Loading states) of the transferTx based on the isPending and isConfirming states
    useEffect(() => {
        setTransferTx((prev: TTransferTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed, setTransferTx])

    const txBtnText =
        txBtnStatus[
        isConnecting
            ? 'connecting'
            : isConfirming
                ? 'confirming'
                : isConfirmed
                    ? transferTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
                        ? 'pending'
                        : !isPending &&
                            !isConfirming &&
                            !isConfirmed &&
                            transferTx.status === 'view'
                            ? 'error'
                            : 'default'
        ]

    const handleTransferSuperVault = useCallback(async () => {
        // Validate connection state before proceeding
        if (!account) {
            console.error('Cannot make transactions: wallet not properly connected')
            setTransferTx((prev: TTransferTx) => ({
                ...prev,
                errorMessage: 'Wallet not properly connected. Please reconnect your wallet.',
                isPending: false,
                isConfirming: false,
            }))
            return
        }

        try {
            setError(null)
            setTransferTx((prev: TTransferTx) => ({
                ...prev,
                isPending: true,
                hash: '',
                errorMessage: '',
            }))

            const vaultContract = getContract({
                client,
                address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
            })

            // Prepare raw transaction for gas estimation
            const rawTransaction = prepareContractCall({
                contract: vaultContract,
                method: "function transfer(address to, uint256 value) returns (bool)",
                params: [
                    asset.asset.toWalletAddress as `0x${string}`,
                    asset.asset.amountInSlUSD,
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
                method: "function transfer(address to, uint256 value) returns (bool)",
                params: [
                    asset.asset.toWalletAddress as `0x${string}`,
                    asset.asset.amountInSlUSD,
                ],
                gas: requiredGas,
            })

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

            // Debug logging to understand receipt structure
            console.log('Transaction receipt:', receipt)
            console.log('Receipt status:', receipt.status)
            console.log('Receipt status type:', typeof receipt.status)

            // Check if transaction succeeded or failed on blockchain
            // More comprehensive status checking
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

            if (isSuccess) {
                setIsConfirmed(true)

                setTransferTx((prev: TTransferTx) => ({
                    ...prev,
                    status: 'view',
                    hash: result.transactionHash,
                    errorMessage: '',
                    isFailed: false,
                    isConfirmed: true,
                }))
            } else if (isFailed) {
                console.log('Transaction detected as failed')

                setTransferTx((prev: TTransferTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: 'Transaction failed on the blockchain. Please try again.',
                    isFailed: true,
                }))
                return // Exit early, don't proceed with success logic
            } else {
                // Unknown status - treat as failure for safety
                console.log('Unknown transaction status, treating as failure')
                // Don't set error state - use transferTx.errorMessage instead

                setTransferTx((prev: TTransferTx) => ({
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

            setTransferTx((prev: TTransferTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: getErrorText(error as any),
            }))
        }
    }, [account, amount, selectedChain, sendAndConfirmTransaction, setTransferTx])

    const onTransfer = async () => {
        await handleTransferSuperVault()
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
            {(error || transferTx.errorMessage) && (
                <CustomAlert
                    description={
                        error
                            ? getErrorText(error)
                            : transferTx.errorMessage
                    }
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (isPending || isConfirming || disabled || !account) &&
                    transferTx.status !== 'view'
                }
                onClick={() => {
                    if (transferTx.status !== 'view') {
                        onTransfer()
                    } else {
                        handleCloseModal(false)
                    }
                }}
            >
                {txBtnText}
                {transferTx.status !== 'view' &&
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

export default TransferButton
