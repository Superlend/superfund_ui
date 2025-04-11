import { Period } from '@/types/periodButtons'
import { requestSuperlend } from './request'
import { TAddress } from '@/types'

export type TBenchmarkHistoryParams = {
    protocol_identifier: TAddress
    token: TAddress
    period: Period | 'YEAR'
}

export type TBenchmarkHistoryResponse = {
    "processMap": [
        {
            "timestamp": number,
            "data": {
                "size": number,
                "tokenID": string,
                "symbol": string,
                "liquidationPenalty": number,
                "blockNumber": number,
                "depositRate": number,
                "depositRateReward": number,
                "variableBorrowRate": number,
                "variableBorrowRateReward": number,
                "ltv": number,
                "liquidationThreshold": number,
                "stableBorrowRate": number,
                "tokenName": string,
                "utilizationRate": number,
                "decimals": number,
                "platformMarketId": string,
                "underlyingAsset": string,
                "reserveFactor": number
            }
        }
    ]
}

export async function getBenchmarkHistory({
    protocol_identifier,
    token,
    period
}: TBenchmarkHistoryParams) {
    return requestSuperlend<TBenchmarkHistoryResponse>({
        method: 'GET',
        path: `/platform/history`,
        query: {
            protocol_identifier,
            token,
            period
        },
    })
}
