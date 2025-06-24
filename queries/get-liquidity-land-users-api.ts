import axios from 'axios'

export interface LiquidityLandUser {
  walletAddress: string
  totalValueUsd: number
  date: string
}

export async function getLiquidityLandUsers(): Promise<LiquidityLandUser[]> {
  try {
    const response = await axios.get('https://api.liquidity.land/project/cmc8sragi0001rg0ihberoqt2/activities.json')
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch Liquidity Land users', {
      cause: error,
    })
  }
} 