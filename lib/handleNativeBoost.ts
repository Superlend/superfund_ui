import {
    NATIVE_BOOST_APY_END_DATE,
    NATIVE_BOOST_APY_START_DATE,
} from '@/constants'

export const handleDynamicNativeBoost = (tvl: number) => {
    if (tvl <= 200_000) return 4
    else if (tvl > 200_000 && tvl <= 500_000) return 3
    else if (tvl > 500_000 && tvl <= 1_000_000) return 2
    else if (tvl > 1_000_000 && tvl <= 2_000_000) return 1
    return 0.5
}

export function isEligibleForNativeBoost(currentTimestamp: number) {
    return (
        currentTimestamp >= NATIVE_BOOST_APY_START_DATE &&
        currentTimestamp <= NATIVE_BOOST_APY_END_DATE
    )
}
