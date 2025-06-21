import { requestRewards } from './request'

export interface TokenReward {
  amount: number
  priceUsd: number
  token: {
    address: string
    name: string
    symbol: string
    decimals: number
    logoUrl: string | null
  }
}

export interface UserStatementsData {
  openingBalance: number
  closingBalance: number
  startBlock: number
  endBlock: number
  openingBlockTimestamp: string
  closingBlockTimestamp: string
  openingExchangeRate: number
  closingExchangeRate: number
  vault: string
  chainId: number
  transactions?: any[] // We ignore this as mentioned
  rewards: TokenReward[]
  baseApr: number
  rewardApr: number
  totalApr: number
  interestEarnedUsd: number
  rewardEarnedUsd: number
  totalEarnedUsd: number
}

export interface UserStatementsResponse {
  success: boolean
  message: string
  data: UserStatementsData
}

export interface UserStatementsParams {
  userAddress: string
  vaultAddress: string
  chainId: number
}

export async function getUserStatements(params: UserStatementsParams): Promise<UserStatementsData> {
  const { userAddress, vaultAddress, chainId } = params
  
  return requestRewards<UserStatementsData>({
    method: 'GET',
    path: `/user/statements/${userAddress}/${vaultAddress}/${chainId}`,
  })
} 