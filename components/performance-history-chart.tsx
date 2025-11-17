'use client'

import { Card } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Area,
    AreaChart,
    Brush,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from '@/lib/utils'
import { ChartConfig, ChartContainer } from './ui/chart'
import { TimelineFilterTabs } from './tabs/timeline-filter-tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from './ui/button'
import { Expand } from 'lucide-react'
import { BodyText, HeadingText } from './ui/typography'
import { Skeleton } from './ui/skeleton'
import { useApyData } from '@/context/apy-data-provider'
import { handleDynamicNativeBoost, isEligibleForNativeBoost } from '@/lib/handleNativeBoost'


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="flex flex-col gap-2 bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <BodyText level='body3' className="text-gray-600">
                    {payload[0]?.payload.timestamp}
                </BodyText>
                <div className="space-y-1">
                    <BodyText level='body3' className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#8A2BE2]" />
                            Total APY
                        </div>
                        <span className="font-medium">
                            {payload[0]?.payload.totalApy}%
                        </span>
                    </BodyText>
                    <BodyText level='body3' className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#3366CC]" />
                            Base APY
                        </div>
                        <span className="font-medium">
                            {payload[0]?.payload.baseApy}%
                        </span>
                    </BodyText>
                </div>
                <BodyText level='body3' className="flex items-center justify-between gap-4 border-t border-gray-400 pt-1">
                    Total Assets
                    <span className="font-medium">
                        ${payload[0]?.payload.totalAssets}
                    </span>
                </BodyText>
            </div>
        )
    }
    return null
}

const styles = `
    .recharts-brush .recharts-brush-traveller {
        fill: hsl(var(--background));
        stroke: #8A2BE2;
        stroke-width: 1.5;
        rx: 4;
        ry: 4;
    }
    .recharts-brush .recharts-brush-slide {
        fill: rgba(138, 43, 226, 0.05);
        stroke: none;
    }
    .recharts-brush text {
        fill: hsl(var(--foreground)) !important;
        font-weight: 500;
    }
`

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

interface CustomYAxisTickProps {
    x: number
    y: number
    payload: {
        value: number
    }
    index: number
    length: number
}

const CustomYAxisTick = ({
    x,
    y,
    payload,
    index,
    length,
}: CustomYAxisTickProps) => {
    return (
        <g
            transform={`translate(${x},${y})`}
            style={{ zIndex: 10, position: 'relative', color: 'hsl(var(--foreground-subtle))' }}
        >
            <text x={0} y={0} dy={6} dx={11} textAnchor="start" fontSize={12} fill="hsl(var(--foreground-subtle))">
                {`${abbreviateNumber(payload.value, 0)}%`}
            </text>
        </g>
    )
}

const CustomXAxisTick = ({
    x,
    y,
    selectedRange,
    payload,
    index,
    length,
}: CustomXAxisTickProps) => {
    // if (index % 2) return null
    return (
        <g transform={`translate(${x + 10},${y})`} style={{ zIndex: 10 }}>
            <text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground-subtle))">
                {formatDateAccordingToPeriod(
                    payload.value.toString(),
                    selectedRange
                )}
            </text>
        </g>
    )
}

const chartConfig = {
    platformHistory: {
        label: 'History',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig

export function PerformanceHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const { historicalData, isLoading } = useHistoricalData({
        period: selectedRange,
    })
    const [startIndex, setStartIndex] = useState(0)
    const [endIndex, setEndIndex] = useState(historicalData.length - 1)
    // const { boostApy: BOOST_APY, isLoading: isLoadingBoostApy, boostApyStartDate } = useApyData()

    useEffect(() => {
        setStartIndex(0)
        setEndIndex(historicalData.length - 1)
    }, [historicalData])

    const handleRangeChange = useCallback((value: string) => {
        setSelectedRange(value as Period)
    }, [])

    const chartData = useMemo(() => {
        return historicalData.map((item: any) => {
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
            
            // Only add BOOST_APY if the date is on or after May 12, 2025
            const shouldAddBoost = isEligibleForNativeBoost(date.getTime());
            const BOOST_APY = handleDynamicNativeBoost(Number(item.totalAssets ?? 0));
            const totalApyValue = shouldAddBoost ? Number(item.totalApy) + BOOST_APY : Number(item.totalApy);

            return {
                rawTimestamp: item.timestamp,
                timestamp: `${formattedDate}`,
                date: formattedDate.split(',')[0],
                time: time,
                baseApy: abbreviateNumber(item.baseApy),
                totalApy: abbreviateNumber(totalApyValue),
                totalAssets: abbreviateNumber(item.totalAssets),
            }
        }).sort((a: any, b: any) => new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime())
    }, [historicalData])

    const { minValue, maxValue, valueRange } = useMemo(() => {
        const allValues = chartData.flatMap((d: any) => [Number(d.baseApy), Number(d.totalApy)])
        const min = Math.min(...allValues)
        const max = Math.max(...allValues)
        return {
            minValue: min,
            maxValue: max,
            valueRange: max - min
        }
    }, [chartData])

    const yAxisTicks = useMemo(() => {
        const maxTickValue = maxValue + (valueRange * 0.1);
        const interval = maxTickValue / 3; // Divide by 3 to get 4 points (0 and 3 intervals)
        return [0, interval, interval * 2, maxTickValue];
    }, [maxValue, valueRange]);

    const memoizedLines = useMemo(() => (
        <>
            <Line
                type="monotone"
                dataKey="baseApy"
                stroke="#3366CC"
                strokeWidth={2}
                fill="url(#baseApyGradient)"
                isAnimationActive={true}
                dot={false}
            />
            <Line
                type="monotone"
                dataKey="totalApy"
                stroke="#8A2BE2"
                strokeWidth={2}
                fill="url(#totalApyGradient)"
                isAnimationActive={true}
                dot={false}
            />
        </>
    ), [chartData])

    const memoizedBrush = useMemo(() => (
        <Brush
            dataKey="date"
            height={35}
            stroke="#cacaca"
            fill="#fafafa"
            travellerWidth={8}
            y={285}
            strokeWidth={1.2}
            startIndex={startIndex}
            endIndex={endIndex}
            className="recharts-brush"
            alwaysShowText={false}
        >
            <AreaChart>
                <Area
                    type="monotone"
                    dataKey="baseApy"
                    stroke="#3366CC"
                    strokeWidth={1}
                />
                <Area
                    type="monotone"
                    dataKey="totalApy"
                    stroke="#8A2BE2"
                    strokeWidth={1}
                />
            </AreaChart>
        </Brush>
    ), [startIndex, endIndex])

    return (
        <Card>
            <div className="flex items-center justify-between max-md:px-4 p-6">
                <HeadingText level="h4" weight="medium" className='text-gray-800'>
                    Performance History
                </HeadingText>
                <div className="flex items-center gap-2">
                    <div className={`${false ? 'mr-12' : ''}`}>
                        <TimelineFilterTabs
                            selectedRange={selectedRange}
                            handleRangeChange={handleRangeChange}
                        />
                    </div>
                </div>
            </div>
            <ChartContainer
                config={chartConfig}
                className={`w-full h-[350px] bg-white rounded-4`}
            >
                <>
                    {!isLoading &&
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 0,
                                    right: 30,
                                    left: -15,
                                    bottom: 45
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--foreground-subtle))"
                                    fontSize={12}
                                    tickLine={true}
                                    axisLine={true}
                                    tickCount={5}
                                    interval={(chartData?.length || 0) > 5 ? Math.floor((chartData?.length || 0) / 5) : 0}
                                    padding={{ left: 0, right: 10 }}
                                    tickFormatter={(value) =>
                                        formatDateAccordingToPeriod(
                                            value,
                                            selectedRange
                                        )
                                    }
                                    tick={({ x, y, payload, index }) => (
                                        <CustomXAxisTick
                                            payload={payload as { value: number }}
                                            selectedRange={selectedRange}
                                            x={x as number}
                                            y={y as number}
                                            index={index as number}
                                            length={chartData.length}
                                        />
                                    )}
                                />
                                <YAxis
                                    stroke="hsl(var(--foreground-subtle))"
                                    fontSize={12}
                                    tickLine={true}
                                    axisLine={true}
                                    ticks={yAxisTicks}
                                    tickFormatter={(value) => `${shortNubers(value.toFixed(0))}%`}
                                    padding={{ top: 10, bottom: 10 }}
                                    domain={[
                                        0,
                                        maxValue + (valueRange * 0.1)
                                    ]}
                                    allowDataOverflow={true}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: 'hsl(var(--foreground-disabled))', strokeWidth: 1 }}
                                />
                                {memoizedLines}
                                {memoizedBrush}
                            </LineChart>
                        </ResponsiveContainer>
                    }
                    {
                        isLoading &&
                        <Skeleton className={`w-full h-[350px] rounded-4 max-w-[1200px] bg-gray-300`} />
                    }
                </>
            </ChartContainer>
        </Card>
    )
}
