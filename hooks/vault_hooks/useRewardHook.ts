import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import useGetClaimRewards from '../useGetClaimRewards'
import { useWalletConnection } from '../useWalletConnection'
import { useEffect, useState, useCallback } from 'react'
import { TClaimRewardsResponse } from '../../types'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import REWARD_ABI from '@/data/abi/rewardsABI.json'
import { useActiveAccount } from 'thirdweb/react'

const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ''),
    batch: { multicall: true },
})

export function useRewardsHook() {
    // const { walletAddress } = useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    // const isWalletConnected = !!account

    const {
        data: rewardsData,
        isLoading: isLoadingRewards,
        isError: isErrorRewards,
        refetch: refetchClaimRewardsData,
    } = useGetClaimRewards({
        user_address: walletAddress || '',
        chain_id: base.id,
    })

    const [formattedClaimData, setFormattedClaimData] = useState<
        TClaimRewardsResponse[]
    >([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<boolean>(false)

    const fetchFormattedClaimData = useCallback(async (retryCount = 0) => {
        if (
            !walletAddress ||
            !rewardsData ||
            rewardsData.length === 0 ||
            isErrorRewards
        ) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setIsError(false)

        try {
            const claimedRequests: Promise<BigInt>[] = rewardsData.map(
                (_rewardData) =>
                    publicClient.readContract({
                        address: _rewardData.distributor
                            .address as `0x${string}`,
                        abi: REWARD_ABI,
                        functionName: 'claimed',
                        args: [walletAddress, _rewardData.token.address],
                    }) as Promise<BigInt>
            )

            const claimedTokenData = await Promise.all(claimedRequests)

            const formattedData: TClaimRewardsResponse[] = rewardsData.map(
                (_rewardData, idx) => {
                    const claimed = claimedTokenData[idx].toString()
                    const availableToClaim = BigNumber.from(
                        _rewardData.claimable
                    )
                        .sub(claimed)
                        .toString()

                    return {
                        ..._rewardData,
                        claimed,
                        availabeToClaim: availableToClaim,
                        availabeToClaimFormatted: formatUnits(
                            availableToClaim,
                            _rewardData.token.decimals
                        ),
                    }
                }
            )

            setFormattedClaimData(formattedData)
            
            // If this is a retry and we still have unclaimed rewards, try again after a delay
            const hasUnclaimedRewards = formattedData.some(reward => Number(reward.availabeToClaim) > 0)
            if (retryCount > 0 && hasUnclaimedRewards && retryCount < 3) {
                setTimeout(() => {
                    fetchFormattedClaimData(retryCount + 1)
                }, 3000) // Wait 3 seconds before retrying
            }
        } catch (error) {
            console.error('Error fetching claimed token data:', error)
            setIsError(true)
            setFormattedClaimData([])
        } finally {
            setIsLoading(false)
        }
    }, [walletAddress, rewardsData, isErrorRewards])

    useEffect(() => {
        fetchFormattedClaimData()
    }, [fetchFormattedClaimData])

    // Enhanced refetch function that includes retry mechanism for post-transaction updates
    const refetchWithRetry = useCallback(async () => {
        await refetchClaimRewardsData()
        // Start retry mechanism to ensure blockchain state is updated
        setTimeout(() => {
            fetchFormattedClaimData(1) // Start with retry count 1
        }, 2000)
    }, [refetchClaimRewardsData, fetchFormattedClaimData])

    return {
        formattedClaimData,
        isLoading,
        isError,
        fetchFormattedClaimData,
        refetchClaimRewardsData: refetchWithRetry,
    }
}
