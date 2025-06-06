import { request } from './request'

export interface BoostRewardResponse {
  token: {
    name: string
    decimals: number
    symbol: string
    address: string
  },
  boost_apy: number
  description?: string
}

export interface BoostRewardParams {
  vaultAddress: string
  chainId: number
}

export async function getBoostRewards({
  vaultAddress,
  chainId,
}: BoostRewardParams) {
  return request<BoostRewardResponse[]>({
    method: 'GET',
    path: `/reward/native-boost/${vaultAddress}/${chainId}`,
  })
} 