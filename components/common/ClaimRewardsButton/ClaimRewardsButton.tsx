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
    TClaimRewardsTx,
} from '@/context/super-vault-tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { USDC_DECIMALS, VAULT_ADDRESS } from '@/lib/constants'
import { parseAbi } from 'viem'
import { usePrivy } from '@privy-io/react-auth'

const VAULT_ABI = parseAbi([
    'function withdraw(uint256 _assets, address _receiver, address _owner) returns (uint256)',
])

interface IClaimRewardsButtonProps {
    disabled: boolean
    asset: any
    handleCloseModal: (isVisible: boolean) => void
}

const ClaimRewardsButton = ({
    disabled,
    asset,
    handleCloseModal,
}: IClaimRewardsButtonProps) => {
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { claimRewardsTx, setClaimRewardsTx } = useTxContext() as TTxContext
    const txBtnStatus: Record<string, string> = {
        pending: 'Claiming...',
        confirming: 'Confirming...',
        success: 'Close',
        error: 'Close',
        default: 'Start claiming',
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    useEffect(() => {
        if (claimRewardsTx.status === 'view') return

        if (hash) {
            setClaimRewardsTx((prev: TClaimRewardsTx) => ({
                ...prev,
                status: 'view',
                hash,
            }))
        }

        if (hash && isConfirmed) {
            setClaimRewardsTx((prev: TClaimRewardsTx) => ({
                ...prev,
                status: 'view',
                hash,
                isConfirmed: isConfirmed,
            }))
        }
    }, [hash, isConfirmed])

    // Update the status(Loading states) of the lendTx based on the isPending and isConfirming states
    useEffect(() => {
        setClaimRewardsTx((prev: TClaimRewardsTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    const txBtnText =
        txBtnStatus[
        isConfirming
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

        try {
            // writeContractAsync({
            //     address: VAULT_ADDRESS as `0x${string}`,
            //     abi: VAULT_ABI,
            //     functionName: 'withdraw',
            //     args: [
            //         walletAddress as `0x${string}`,
            //         walletAddress as `0x${string}`,
            //     ],
            // })
        } catch (error) {
            error
        }
    }, [])

    const onClaimRewards = async () => {
        await handleClaimRewards()
        return
    }

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <CustomAlert
                    description={
                        (error as BaseError).shortMessage || error.message
                    }
                />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={
                    (isPending || isConfirming || disabled) &&
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
