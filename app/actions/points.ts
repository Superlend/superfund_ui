'use server'

import { requestPoints } from '@/queries/request'

interface PointsClaimData {
  is_claimed: boolean
}

export async function checkUserPointsClaimStatus(wallet: string, userAddress: string): Promise<boolean> {
  try {
    const data = await requestPoints<PointsClaimData>({
      method: 'GET',
      path: '/user/check_user_farcaster_event_status',
      query: {
        wallet,
        user_address: userAddress
      }
    })
    
    return data.is_claimed
  } catch (error) {
    console.error('Error checking points claim status:', error)
    return false
  }
} 