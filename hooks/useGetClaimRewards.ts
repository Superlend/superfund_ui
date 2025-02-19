'use client'

import { getClaimRewards } from '@/queries/get-claim-rewards-api'
import { TClaimRewardsResponse } from '@/types'
import { TClaimRewardsParams } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useGetOpportunitiesData(params: TClaimRewardsParams) {
    const { data, isLoading, isError, refetch } = useQuery<
        TClaimRewardsResponse[],
        Error
    >({
        queryKey: ['claim-rewards', params.user_address, params.chain_id],
        queryFn: async () => {
            try {
                const responseData = await getClaimRewards(params)
                return responseData
            } catch (error) {
                return []
            }
        },
        staleTime: Infinity,
        refetchInterval: false,
        enabled: !!params.user_address && !!params.chain_id,
    })
    return { data: data, isLoading, isError, refetch }
}
