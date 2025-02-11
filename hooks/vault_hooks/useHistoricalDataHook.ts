import { THistoricalDataPerformanceHistory } from "@/types";
import { Period } from "@/types/periodButtons";
import { useEffect, useState } from "react";

// export function getPeriodData(period: Period, chartData: any) {
// }



export function useHistoricalData(period: Period) {
    const [historicalData, setHistoricalData] = useState<THistoricalDataPerformanceHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)


    switch (period) {
        case Period.oneDay:
            break
        case Period.oneWeek:
            break
        case Period.oneMonth:
            break
        case Period.allTime:
            break
    }

    useEffect(() => {
        // const data = getPeriodData(period)
    }, [period])

    return {
        historicalData,
        isLoading,
        error
    }
}
