import { useCallback, useEffect, useState } from 'react'
import { parseUnits } from 'ethers/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
import CustomAlert from '@/components/alerts/CustomAlert'
import {
    TWithdrawTx,
    TTxContext,
    useTxContext,
    TClaimRewardsTx,
} from '@/context/super-vault-tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { USDC_DECIMALS, VAULT_ADDRESS } from '@/lib/constants'
import REWARD_ABI from '@/data/abi/rewardsABI.json'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useChain } from '@/context/chain-context'
import { useActiveAccount, useConnect, useSendTransaction } from "thirdweb/react"
import { getContract, prepareContractCall, waitForReceipt } from "thirdweb"
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

interface IClaimRewardsButtonProps {
    disabled: boolean
    rewardDetails: any
    handleCloseModal: (isVisible: boolean) => void
}

const ClaimRewardsButton = ({
    disabled,
    rewardDetails,
    handleCloseModal,
}: IClaimRewardsButtonProps) => {
    const account = useActiveAccount()
    const { mutateAsync: sendTransaction, isPending } = useSendTransaction()
    const { logEvent } = useAnalytics()
    const { claimRewardsTx, setClaimRewardsTx } = useTxContext() as TTxContext
    const { isConnecting } = useConnect()
    const walletAddress = account?.address as `0x${string}`
    
    // Transaction state
    const [hash, setHash] = useState<string>('')
    const [isConfirming, setIsConfirming] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    
    const txBtnStatus: Record<string, string> = {
        pending: 'Claiming...',
        confirming: 'Confirming...',
        success: 'Close',
        error: 'Close',
        default: 'Start claiming',
        connecting: 'Connecting wallet...',
    }
    const { selectedChain } = useChain()

    useEffect(() => {
        if (claimRewardsTx.status === 'view') return

        if (hash) {
            setClaimRewardsTx((prev: TClaimRewardsTx) => ({
                ...prev,
                hash,
            }))
        }
        
        if (isConfirmed) {
            setClaimRewardsTx((prev: TClaimRewardsTx) => ({
                ...prev,
                status: 'view',
                hash,
                isConfirmed: isConfirmed,
            }))
            logEvent('claim_rewards_successful', {
                amount: rewardDetails.reward.claimable,
                chain: selectedChain,
                token: rewardDetails.reward.token.address,
                walletAddress: walletAddress
            })
        }
    }, [hash, isConfirmed, claimRewardsTx.status, rewardDetails.reward.claimable, selectedChain, rewardDetails.reward.token.address, walletAddress, logEvent, setClaimRewardsTx])

    // Update the status(Loading states) of the claimRewardsTx based on the isPending and isConfirming states
    useEffect(() => {
        setClaimRewardsTx((prev: TClaimRewardsTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed, setClaimRewardsTx])

    const txBtnText =
        txBtnStatus[
        isConnecting
            ? 'connecting'
            : isConfirming
                ? 'confirming'
                : isConfirmed
                    ? claimRewardsTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
                        ? 'pending'
                        : !isPending &&
                            !isConfirming &&
                            !isConfirmed &&
                            claimRewardsTx.status === 'view'
                            ? 'error'
                            : 'default'
        ]

    const handleClaimRewards = useCallback(async () => {
        // Validate connection state before proceeding
        if (!account) {
            console.error('Cannot make transactions: wallet not properly connected')
            setClaimRewardsTx((prev: TClaimRewardsTx) => ({
                ...prev,
                errorMessage: 'Wallet not properly connected. Please reconnect your wallet.',
                isPending: false,
                isConfirming: false,
            }))
            return
        }

        try {
            setError(null)
            
            const rewardsContract = getContract({
                client,
                address: rewardDetails.reward.distributor.address,
                chain: THIRDWEB_CHAINS[selectedChain as keyof typeof THIRDWEB_CHAINS],
            })

            const transaction = prepareContractCall({
                contract: rewardsContract,
                method: "function claim(address _account, address _token, uint256 _amount, bytes32[] calldata _merkleProof)",
                params: [
                    account.address,
                    rewardDetails.reward.token.address,
                    rewardDetails.reward.claimable,
                    rewardDetails.reward.proof,
                ],
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
            setIsConfirmed(true)

        } catch (error) {
            console.error('Claim rewards error:', error)
            setIsConfirming(false)
            setError(error as Error)
            
            setClaimRewardsTx((prev: TClaimRewardsTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: getErrorText(error as any),
            }))
        }
    }, [account, rewardDetails, selectedChain, sendTransaction, setClaimRewardsTx])

    const onClaimRewards = async () => {
        await handleClaimRewards()
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
            {(error || claimRewardsTx.errorMessage) && (
                <CustomAlert
                    description={
                        error 
                            ? getErrorText(error)
                            : claimRewardsTx.errorMessage
                    }
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (isPending || isConfirming || disabled || !account) &&
                    claimRewardsTx.status !== 'view'
                }
                onClick={() => {
                    if (claimRewardsTx.status !== 'view') {
                        onClaimRewards()
                    } else {
                        handleCloseModal(false)
                    }
                }}
            >
                {txBtnText}
                {claimRewardsTx.status !== 'view' &&
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

export default ClaimRewardsButton
