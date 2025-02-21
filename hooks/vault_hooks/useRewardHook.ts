import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import useGetClaimRewards from '../useGetClaimRewards'
import { useWalletConnection } from '../useWalletConnection'
import { useEffect, useState, useCallback } from 'react'
import { TClaimRewardsResponse } from '../../types'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

const REWARD_ABI = [
    {
        type: 'function',
        name: 'claim',
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'reward', type: 'address' },
            { name: 'claimable', type: 'uint256' },
            { name: 'proof', type: 'bytes32[]' },
        ],
        outputs: [{ name: 'amount', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'claimed',
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'reward', type: 'address' },
        ],
        outputs: [{ name: 'amount', type: 'uint256' }],
        stateMutability: 'view',
    },
]

const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ''),
    batch: { multicall: true },
})

const CHAIN_ID = 8453

export function useRewardsHook() {
    const { walletAddress } = useWalletConnection()

    const {
        data: rewardsData,
        isLoading: isLoadingRewards,
        isError: isErrorRewards,
    } = useGetClaimRewards({
        user_address: walletAddress,
        chain_id: CHAIN_ID,
    })

    const [formattedClaimData, setFormattedClaimData] = useState<
        TClaimRewardsResponse[]
    >([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isError, setIsError] = useState<boolean>(false)

    const fetchFormattedClaimData = useCallback(async () => {
        if (
            !walletAddress ||
            !rewardsData ||
            rewardsData.length === 0 ||
            isErrorRewards
        ) {
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

    return {
        formattedClaimData,
        isLoading,
        isError,
        fetchFormattedClaimData,
    }
}
