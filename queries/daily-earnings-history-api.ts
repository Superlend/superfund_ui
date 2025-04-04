import { TDailyEarningsHistoryParams, TDailyEarningsHistoryResponse } from '@/types'
import { requestIndexer } from './request'

export async function getDailyEarningsHistory({
    vault_address,
    user_address,
    start_timestamp,
}: TDailyEarningsHistoryParams) {
    return requestIndexer<TDailyEarningsHistoryResponse>({
        method: 'POST',
        path: `/vaults/history_daily_earnings`,
        body: {
            vault_address,
            user_address,
            start_timestamp,
        },
    })
}
