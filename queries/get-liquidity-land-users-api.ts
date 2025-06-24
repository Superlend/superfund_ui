import axios from 'axios'

export interface LiquidityLandUser {
  walletAddress: string
  totalValueUsd: number
  date: string
}

export async function getLiquidityLandUsers(): Promise<LiquidityLandUser[]> {
  try {
    const response = await axios.get('/api/liquidity-land')
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch Liquidity Land users', {
      cause: error,
    })
  }
} 