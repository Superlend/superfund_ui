import { TClaimRewardsParams, TClaimRewardsResponse } from '@/types'
import { request } from './request'

export async function getClaimRewards({
    user_address,
    chain_id,
}: TClaimRewardsParams) {
    return request<TClaimRewardsResponse[]>({
        method: 'GET',
        path: `/reward/distribution/${user_address}/${chain_id}`,
    })
}
