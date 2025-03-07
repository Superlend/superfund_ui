'use client'

import { Card } from './ui/card'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Period } from '@/types/periodButtons'
import { BodyText, HeadingText } from './ui/typography'
import { TimelineFilterTabs } from './tabs/timeline-filter-tabs'
import { useMemo, useState } from 'react'
import useGetDailyEarningsHistory from '@/hooks/useGetDailyEarningsHistory'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { VAULT_ADDRESS } from '@/lib/constants'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, getStartTimestamp } from '@/lib/utils'
import { ChartConfig, ChartContainer } from './ui/chart'
import { Skeleton } from './ui/skeleton'

interface CustomXAxisTickProps {
    x: number
    y: number
    selectedRange: Period
    payload: {
        value: number
    }
    index: number
    length: number
}

const CustomXAxisTick = ({
    x,
    y,
    selectedRange,
    payload,
    index,
    length,
}: CustomXAxisTickProps) => {
    return (
        <g transform={`translate(${x},${y})`} style={{ zIndex: 10 }}>
            <text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground-subtle))">
                {formatDateAccordingToPeriod(
                    payload.value.toString(),
                    selectedRange
                )}
            </text>
        </g>
    )
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const date = payload[0].payload.date;
        const value = payload[0].value;

        return (
            <div className="bg-white flex flex-col gap-2 p-2 rounded-lg shadow-lg border">
                <BodyText level="body2" weight="normal" className="text-muted-foreground">
                    {`${date}`}
                </BodyText>
                <BodyText level="body2" weight="medium">
                    {`$${value}`}
                </BodyText>
            </div>
        )
    }
    return null
}

type TDailyEarningsHistoryChartProps = {
    selectedRange: Period
    handleRangeChange: (range: Period) => void
    selectedFilter: Period
    handleFilterChange: (filter: Period) => void
    chartData: any[]
}

const chartConfig = {
    dailyEarningsHistory: {
        label: 'Daily Earnings History',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig

const customTicks = {
    [Period.oneDay]: 5,
    [Period.oneWeek]: 5,
    [Period.oneMonth]: 5,
    [Period.allTime]: 5,
} satisfies Record<Period, number>

export default function DailyEarningsHistoryChart(
    //     {
    //     selectedRange,
    //     handleRangeChange,
    //     selectedFilter,
    //     handleFilterChange,
    //     chartData,
    // }: TDailyEarningsHistoryChartProps
) {
    const [selectedRange, setSelectedRange] = useState(Period.oneMonth)
    const { walletAddress } = useWalletConnection()
    const startTimeStamp = getStartTimestamp(selectedRange)
    const {
        data: dailyEarningsHistoryData,
        isLoading: isLoadingDailyEarningsHistory,
        isError: isErrorDailyEarningsHistory
    } = useGetDailyEarningsHistory({
        vault_address: VAULT_ADDRESS,
        user_address: "0x140c643f635b2840ddc8e0e9034c8cf08c9a6fad",
        start_timestamp: startTimeStamp,
    })

    const totalEarnings = useMemo(() => {
        return dailyEarningsHistoryData?.reduce((acc: number, item: any) => acc + item.earnings, 0) ?? 0
    }, [dailyEarningsHistoryData])

    const chartData = useMemo(() => {
        return dailyEarningsHistoryData?.map((item: any) => {
            const date = new Date(item.timestamp * 1000)
            const dateOptions: any = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }
            const formattedDate = new Intl.DateTimeFormat(
                'en-US',
                dateOptions
            ).format(date)
            const time = extractTimeFromDate(date, { exclude: ['seconds'] })

            return {
                timestamp: `${formattedDate} ${time}`,
                date: formattedDate.split(',')[0],
                time: time,
                earnings: abbreviateNumber(item.earnings, 4),
            }
        })
    }, [dailyEarningsHistoryData])

    const handleRangeChange = (range: Period) => {
        setSelectedRange(range)
    }

    const totalEarningsSuffixText = {
        [Period.oneDay]: 'today',
        [Period.oneWeek]: 'this week',
        [Period.oneMonth]: 'this month',
        [Period.allTime]: 'till date',
    } satisfies Record<Period, string>

    return (
        <Card>
            <div className="flex items-center justify-between p-6 pb-4">
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Daily Earnings
                </HeadingText>
                <TimelineFilterTabs
                    selectedRange={selectedRange}
                    handleRangeChange={(value) => handleRangeChange(value as Period)}
                    filterPeriodList={(item) => item.value !== Period.oneDay}
                />
            </div>
            <div className="relative h-[300px] bg-white rounded-4 pb-2">
                <div className="flex items-center gap-2 absolute top-3 right-8 z-10">
                    {!isLoadingDailyEarningsHistory &&
                        <>
                            <BodyText level="body2" weight="normal" className="text-muted-foreground">
                                Earned {totalEarningsSuffixText[selectedRange]}
                            </BodyText>
                            <HeadingText level="h5" weight="medium" className={`${totalEarnings === 0 ? 'text-gray-800' : totalEarnings > 0 ? 'text-green-800' : 'text-red-800'}`}>
                                ${abbreviateNumber(totalEarnings, 4)}
                            </HeadingText>
                        </>
                    }
                    {isLoadingDailyEarningsHistory &&
                        <Skeleton className={`w-[100px] h-[22px] rounded-2 max-w-[1200px] bg-gray-300`} />
                    }
                </div>
                <>
                    {!isLoadingDailyEarningsHistory &&
                        <ResponsiveContainer width="100%" height="100%">
                            <ChartContainer
                                config={chartConfig}
                            >
                                <AreaChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 10,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorValue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#FF5B0033"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#FF5B0033"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={true}
                                        axisLine={true}
                                        tickCount={5}
                                        padding={{ left: 0, right: 0 }}
                                        allowDataOverflow={true}
                                        scale="band"
                                        type="category"
                                        interval={(chartData?.length || 0) > 5 ? Math.floor((chartData?.length || 0) / 5) : 0}
                                        tick={({ x, y, payload, index }) => (
                                            <CustomXAxisTick
                                                payload={payload as { value: number }}
                                                selectedRange={selectedRange}
                                                x={x as number}
                                                y={y as number}
                                                index={index as number}
                                                length={chartData?.length || 0}
                                            />
                                        )}
                                    />
                                    <YAxis
                                        dataKey="earnings"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={true}
                                        axisLine={true}
                                        tickCount={4}
                                        tickFormatter={(value) => `$${abbreviateNumber(value, 4)}`}
                                        padding={{ top: 10, bottom: 10 }}
                                        allowDataOverflow={false}
                                        scale="auto"
                                        interval="preserveStartEnd"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="earnings"
                                        stroke="#FF5B00"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        isAnimationActive={true}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </ResponsiveContainer>
                    }
                    {
                        isLoadingDailyEarningsHistory &&
                        <Skeleton className={`w-full h-[350px] rounded-4 max-w-[1200px] bg-gray-300`} />
                    }
                </>
            </div>
        </Card>
    )
}
