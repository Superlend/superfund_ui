import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useChain } from '@/context/chain-context'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useActiveAccount, useConnect, useSendTransaction } from "thirdweb/react"
import { getContract, prepareContractCall, waitForReceipt } from "thirdweb"
import { client } from "@/app/client"
import { base, defineChain } from "thirdweb/chains"
import { ChainId } from '@/types/chain'

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
    const account = useActiveAccount()
    const { mutateAsync: sendTransaction, isPending } = useSendTransaction()
    const { selectedChain } = useChain()
    const { logEvent } = useAnalytics()
    const { isConnecting } = useConnect()
    
    // Transaction state
    const [hash, setHash] = useState<string>('')
    const [isConfirming, setIsConfirming] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [error, setError] = useState<Error | null>(null)

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
        if (!account) {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                errorMessage: WALLET_CONNECTION_LOST_MESSAGE,
                isPending: false,
                isConfirming: false,
            }))
            return
        }

        try {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                status: 'deposit',
                hash: '',
                errorMessage: '',
            }))
            setError(null)

            const vaultContract = getContract({
                client,
                address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
            })

            const amountInWei = parseUnits(amount, USDC_DECIMALS)

            const transaction = prepareContractCall({
                contract: vaultContract,
                method: "function deposit(uint256 assets, address receiver)",
                params: [amountInWei.toBigInt(), account.address],
            })

            const result = await sendTransaction(transaction)
            setHash(result.transactionHash)

            // Wait for confirmation
            setIsConfirming(true)
            const receipt = await waitForReceipt({
                client,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
                transactionHash: result.transactionHash,
            })

            setIsConfirming(false)

            console.log('Deposit transaction receipt:', receipt)
            console.log('Deposit receipt status:', receipt.status)
            console.log('Deposit receipt status type:', typeof receipt.status)

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

            console.log('Deposit isSuccess:', isSuccess, 'isFailed:', isFailed)

            if (isSuccess) {
                setIsConfirmed(true)

                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    status: 'view',
                    errorMessage: '',
                    isFailed: false,
                }))
            } else if (isFailed) {
                console.log('Deposit transaction detected as failed')
                
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: 'Transaction failed on the blockchain. Please try again.',
                    isFailed: true,
                }))
                return // Exit early, don't proceed with success logic
            } else {
                // Unknown status - treat as failure for safety
                console.log('Unknown deposit transaction status, treating as failure')
                
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: 'Transaction status unclear. Please check the explorer.',
                    isFailed: true,
                }))
                return
            }

            logEvent('deposit_successful', {
                amount: amount,
                chain: selectedChain,
                token: underlyingAssetAdress,
                walletAddress: account.address
            })

            // Dispatch custom event to notify transaction is complete
            if (typeof window !== 'undefined') {
                console.log('Dispatching transaction-complete event');
                const event = new CustomEvent('transaction-complete', {
                    detail: {
                        type: 'deposit',
                        hash: result.transactionHash,
                        amount: amount
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Deposit transaction error:', error)
            setIsConfirming(false)
            setError(error as Error)

            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: getErrorText(error as any),
            }))
        }
    }, [
        account,
        amount,
        selectedChain,
        underlyingAssetAdress,
        sendTransaction,
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
                walletAddress: account?.address,
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
    }, [isPending, isConfirming, isConfirmed, depositTx.status, amountBN, amount, selectedChain, underlyingAssetAdress, account?.address, logEvent, setDepositTx])

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
        if (!account) {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                errorMessage: WALLET_CONNECTION_LOST_MESSAGE,
                isPending: false,
                isConfirming: false,
            }))
            return
        }

        try {
            // Clear any previous errors when starting approval
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))
            setError(null)

            const usdcContract = getContract({
                client,
                address: USDC_ADDRESS_MAP[selectedChain as keyof typeof USDC_ADDRESS_MAP] as `0x${string}`,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
            })

            const amountInWei = parseUnits(amount, USDC_DECIMALS)
            
            const transaction = prepareContractCall({
                contract: usdcContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`, amountInWei.toBigInt()],
            })

            const result = await sendTransaction(transaction)
            setHash(result.transactionHash)

            // Wait for confirmation
            setIsConfirming(true)
            const receipt = await waitForReceipt({
                client,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
                transactionHash: result.transactionHash,
            })

            setIsConfirming(false)

            console.log('Approval transaction receipt:', receipt)
            console.log('Approval receipt status:', receipt.status)

            const isApprovalSuccess = receipt.status === 'success' || 
                                    (receipt.status as any) === 1 || 
                                    (receipt.status as any) === '0x1' ||
                                    (typeof receipt.status === 'string' && receipt.status.toLowerCase() === 'success')

            if (isApprovalSuccess) {
                setIsConfirmed(true)
            } else {
                // Approval transaction failed on blockchain
                setDepositTx((prev: TDepositTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    errorMessage: 'Approval transaction failed on the blockchain. Please try again.',
                    isFailed: true,
                }))
                return // Exit early
            }

        } catch (error) {
            console.error('Approve transaction error:', error)
            setIsConfirming(false)
            setError(error as Error)

            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: getErrorText(error as { message: string }),
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
    const showConnectionWarning = isConnecting

    return (
        <div className="flex flex-col gap-2">
            {showConnectionWarning && (
                <CustomAlert
                    description="Connecting wallet... Please wait."
                />
            )}
            {/* Show only one error message at a time - prioritize depositTx.errorMessage over error */}
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
