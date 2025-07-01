import { WarningMessages } from '@/constants'
import { Period } from './periodButtons'

export type TPositionType = 'deposit' | 'withdraw' | 'claim' | 'transfer'
export type TActionType = 'deposit' | 'withdraw' | 'claim' | 'transfer'
export type TAddress = `0x${string}`

// Claim Rewards START =====================================
export type TClaimRewardsParams = {
    user_address: string
    chain_id: number
    refetchClaimRewards?: boolean
}

export type TClaimRewardsResponse = {
    token: {
        address: TAddress
        name: string
        decimals: number
        symbol: string
        logo: string
        price_usd: string
    }
    claimable: string
    claimed: string
    availabeToClaim: string
    availabeToClaimFormatted: string
    distributor: {
        address: TAddress
        chainId: number
    }
    proof: TAddress[]
}
// Claim Rewards END =====================================

export type TToken = {
    address: string
    decimals: number
    logo: string | null
    name: string
    price_usd: number
    symbol: string
}

export type TChain = {
    chain_id: number
    logo: string | null
    name: string
}

// Queries START =====================================

// Login Challenge
export type TGetLoginChallengeParams = {
    user_address: string
}

export type TLoginChallengeResponse = {
    challenge: string
}

// Login
export type TPostLoginParams = {
    challenge: string
    signature: string
    address: string
}

export type TLoginResponse = {
    access_token: string
    refresh_token: string
}

// Refresh
export type TPostRefreshParams = {
    Authorization: string
}

export type TRefreshResponse = TLoginResponse

// Opportunities
export type TRewardAsset = {
    symbol: string
    name: string
    address: `0x${string}`
    logo: string
}
export type TReward = {
    supply_apy: number
    asset: {
        symbol: string
        name: string
        address: `0x${string}`
        decimals: number
        logo: string
        price_usd: number
    }
}

export type THistoricalDataPerformanceHistory = {
    timestamp: number
    totalAssets: number
    allocations: {
        name: string
        address: string
        value: number
        color: string
    }[]
}

export type THistoricalDataRebalanceHistory = {
    timestamp: number
}

export type TOpportunityTable = {
    tokenAddress: string
    tokenSymbol: string
    tokenLogo: string
    tokenName: string
    chainLogo: string
    chain_id: number
    chainName: string
    protocol_identifier: string
    platformName: string
    platformId: string
    platformLogo: string
    apy_current: string
    additional_rewards: boolean
    rewards: TReward[]
    max_ltv: number
    deposits: string
    borrows: string
    utilization: string
    isVault: boolean
}

// Platform
export type TGetPlatformParams = {
    chain_id: number
    protocol_identifier: string
}

export type TPlatformAsset = {
    token: {
        name: string
        symbol: string
        logo: string
        address: string
        decimals: number
        price_usd: number
        warnings: any[]
    }
    ltv: number
    supply_apy: number
    variable_borrow_apy: number
    stable_borrow_apy: number
    borrow_enabled: boolean
    remaining_supply_cap: number
    remaining_borrow_cap: number
}

export type TPlatform = {
    platform: {
        name: string
        platform_name: string
        protocol_identifier: string
        // protocol_type: "aaveV3" | "compoundV2" | "morpho" | "fluid";
        protocol_type: 'aaveV3' | 'compoundV2' | 'morpho' | 'fluid'
        logo: string
        chain_id: number
        vaultId: string
        isVault: boolean
        morpho_market_id: string
        core_contract: string
    }
    assets: TPlatformAsset[]
}

export type TGetPlatformHistoryParams = {
    protocol_identifier: string
    token: string
    period: Period.oneDay | Period.oneMonth | Period.oneWeek | Period.oneYear
}

export type TPlatformHistoryProcessMap = {
    timestamp: number
    data: {
        size: number
        tokenID: string
        symbol: string
        liquidationPenalty: number
        blockNumber: number
        depositRate: number
        depositRateReward: number
        variableBorrowRate: number
        variableBorrowRateReward: number
        ltv: number
        liquidationThreshold: number
        stableBorrowRate: number
        tokenName: string
        utilizationRate: number
        decimals: number
        platformMarketId: string
        underlyingAsset: string
        reserveFactor: number
    }
}

export type TPlatformHistoryStats = {
    depositRateAverage: number
    depositRateRewardAverage: number
    variableBorrowRateAverage: number
    variableBorrowRateRewardAverage: number
    utilizationRateAverage: number
    prediction: {
        depositRatePredict: number
        variableBorrowRatePredict: number
    }
}

export type TPlatformHistory = {
    processMap: TPlatformHistoryProcessMap[]
    stats: TPlatformHistoryStats
}

export type TGetTokensParams = {
    chain_id?: string[]
    token?: string[]
}

// Daily Earnings History
export type TDailyEarningsHistoryParams = {
    vault_address: TAddress
    user_address: TAddress
    start_timestamp?: number
}

export type TDailyEarningsHistory = {
    earnings: number
    timestamp: number
}

export type TDailyEarningsHistoryResponse = {
    history: TDailyEarningsHistory[]
}

// Queries END =====================================
