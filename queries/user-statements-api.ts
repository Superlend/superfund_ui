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

export interface UserStatementData {
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
  transactions?: any[]
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
  data: {
    statements: UserStatementData[]
    totalStatements: number
  }
}

export interface UserStatementsParams {
  userAddress: string
  vaultAddress: string
  chainId: number
  limit?: number
  offset?: number
}

export async function getUserStatements(params: UserStatementsParams): Promise<UserStatementsResponse['data']> {
  const { userAddress, vaultAddress, chainId, limit, offset } = params
  
  // Build query parameters
  const queryParams = new URLSearchParams()
  if (limit !== undefined) {
    queryParams.append('limit', limit.toString())
  }
  if (offset !== undefined) {
    queryParams.append('offset', offset.toString())
  }
  
  const queryString = queryParams.toString()
  const path = `/user/statements/${userAddress}/${vaultAddress}/${chainId}${queryString ? `?${queryString}` : ''}`
  
  return requestRewards<UserStatementsResponse['data']>({
    method: 'GET',
    path,
  })
} 