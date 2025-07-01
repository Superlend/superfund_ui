import { requestRewards } from './request'

export interface UsdcExchangeRateParams {
  vaultAddress: string
  chainId: number
  blockNumbers: string[]
}

export interface BlockExchangeRate {
  exchangeRate: string
  exchangeRateFormatted: number
}

export interface UsdcExchangeRateResponse {
  [blockNumber: string]: BlockExchangeRate
}

export async function getUsdcExchangeRate({
  vaultAddress,
  chainId,
  blockNumbers,
}: UsdcExchangeRateParams) {
  if (!blockNumbers.length) {
    throw new Error('Block numbers array cannot be empty')
  }

  const blocksParam = blockNumbers.join(',')
  
  return requestRewards<UsdcExchangeRateResponse>({
    method: 'GET',
    path: `/block/exchange-rates/${vaultAddress}/${chainId}`,
    query: {
      blocks: blocksParam
    }
  })
} 