'use client'

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Brush,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { TimelineFilterTabs } from './tabs/timeline-filter-tabs'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRebalanceHistory } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from '@/lib/utils'
import { VAULT_STRATEGIES_COLORS } from '@/lib/constants'
import { BodyText, Label } from './ui/typography'
import { Skeleton } from './ui/skeleton'

const chartData = [
    { date: '11/07', value1: 8, value2: 4, value3: 12 },
    { date: '12/07', value1: 6, value2: 10, value3: 8 },
    { date: '13/07', value1: 7, value2: 8, value3: 9 },
    { date: '14/07', value1: 10, value2: 6, value3: 8 },
    { date: '15/07', value1: 6, value2: 8, value3: 10 },
    { date: '16/07', value1: 7, value2: 9, value3: 8 },
    { date: '17/07', value1: 8, value2: 7, value3: 9 },
]

interface CustomYAxisTickProps {
    x: number
    y: number
    payload: {
        value: number
    }
    index: number
    length: number
    // setYAxisDigitCount: any
}

const CustomYAxisTick = ({
    x,
    y,
    payload,
    index,
    length,
    // setYAxisDigitCount,
}: CustomYAxisTickProps) => {
    // if (index === 0 || index === length - 1) return null
    // setYAxisDigitCount(payload.value.toString().length)

    return (
        <g
            transform={`translate(${x - 5},${y - 3})`}
            style={{ zIndex: 10, position: 'relative', color: '#000000' }}
        >
            <text x={0} y={0} dy={6} dx={11} textAnchor="start" fill="#000000">
                {`${shortNubers(payload.value)}%`}
            </text>
        </g>
    )
}

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
    if (index % 2) return null
    return (
        <g transform={`translate(${x},${y - 5})`} style={{ zIndex: 10 }}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#000000">
                {formatDateAccordingToPeriod(
                    payload.value.toString(),
                    selectedRange
                )}
            </text>
        </g>
    )
}

function CustomChartTooltipContent({
    payload,
    label,
}: {
    payload: any[]
    label: string
}) {
    const allocations = payload[0].payload.allocations.sort((a: any, b: any) => b.value - a.value)
    const caption = payload[0].payload.timestamp

    return (
        <div className="flex flex-col gap-2 px-1.5">
            <Label size="small" weight="medium" className="text-gray-600">
                {caption}
            </Label>
            <div className="flex flex-col space-y-1">
                {
                    allocations.map((allocation: any, index: number) => (
                        <div key={index} className="flex items-center gap-1">
                            <Label size="small" weight="medium" className="text-gray-600 max-w-[300px] truncate">
                                {allocation.name}
                            </Label>
                            <BodyText level="body3" weight="medium">
                                {abbreviateNumber(allocation.value)}%
                            </BodyText>
                        </div>
                    ))
                }
            </div>
            <Label size="small" weight="medium" className="text-gray-600 border-t border-gray-400 pt-1">
                Total Assets: <span className="text-black">{payload[0].payload.totalAssets}</span>
            </Label>
        </div>
    )
}

const chartConfig = {
    '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61': {
        label: 'Morpho Gauntlet USDC Prime',
        color: '#201CB0',
    },
    '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca': {
        label: 'Morpho Moonwell Flagship USDC',
        color: '#201CB0',
    },
    '0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12': {
        label: 'Morpho Gauntlet USDC Core',
        color: '#201CB0',
    },
    '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183': {
        label: 'Morpho Steakhouse USDC',
        color: '#201CB0',
    },
    '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e': {
        label: 'Morpho Ionic Ecosystem USDC',
        color: '#201CB0',
    },
    '0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e': {
        label: 'Morpho Re7 USDC',
        color: '#201CB0',
    },
    '0x7A7815B41617e728DbCF4247E46d1CEbd2d81150': {
        label: 'AaveV3',
        color: '#9293F7',
    },
    '0xf42f5795D9ac7e9D757dB633D693cD548Cfd9169': {
        label: 'Fluid',
        color: '#753FFD',
    },
    '0x0A1a3b5f2041F33522C4efc754a7D096f880eE16': {
        label: 'Euler Base USDC',
        color: '#17395e',
    },
    '0x0000000000000000000000000000000000000000': {
        label: 'Cash Reserve',
        color: '#000000',
    }
}

export function AllocationHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneWeek)
    const { rebalanceHistory, isLoading, error } = useRebalanceHistory(selectedRange)
    const [startIndex, setStartIndex] = useState(0)
    const [endIndex, setEndIndex] = useState(rebalanceHistory.length - 1)

    useEffect(() => {
        setStartIndex(0)
        setEndIndex(rebalanceHistory.length - 1)
    }, [rebalanceHistory])

    const handleRangeChange = useCallback((value: string) => {
        setSelectedRange(value as Period)
    }, [])

    const chartData = useMemo(() => {
        return rebalanceHistory.map((item) => {
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
                totalAssets: abbreviateNumber(item.totalAssets),
                allocations: item.allocations.filter((allocation: any) => allocation.value > 0),
            }
        })
    }, [rebalanceHistory])

    const memoizedBarsForChart = useMemo(() => {
        return Object.keys(chartConfig).map((key) => (
            <Bar
                key={key}
                dataKey={(data) => data.allocations.find((allocation: any) => allocation.address == key)?.value}
                stackId="stack"
                fill={`var(--color-${key})`}
            />
        ))
    }, [])

    const memoizedBarsForBrush = useMemo(() => {
        return Object.keys(chartConfig).map((key) => (
            <Area
                key={key}
                dataKey={(data) => data.allocations.find((allocation: any) => allocation.address == key)?.value}
                stackId="stack"
                stroke={`var(--color-${key})`}
                strokeWidth={1}
            />
        ))
    }, [])

    const memoizedBrush = useMemo(() => (
        <Brush
            dataKey="date"
            height={35}
            stroke="hsl(var(--pulse-color))"
            fill="hsl(var(--accent-cream))"
            travellerWidth={8}
            y={255}
            strokeWidth={1.2}
            startIndex={startIndex}
            endIndex={endIndex}
            className="recharts-brush"
            alwaysShowText={false}
        >
            <AreaChart>
                {memoizedBarsForBrush}
            </AreaChart>
        </Brush>
    ), [startIndex, endIndex, memoizedBarsForBrush])

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                    Allocation History
                </CardTitle>
                <TimelineFilterTabs
                    selectedRange={selectedRange}
                    handleRangeChange={handleRangeChange}
                />
            </CardHeader>
            <CardContent className="p-0 rounded-4 bg-white">
                <ChartContainer
                    config={chartConfig}
                    className="w-full h-[300px] max-w-[1200px]"
                >
                    <>
                        {!isLoading &&
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 0,
                                        right: 10,
                                        left: -10,
                                        bottom: 10,
                                    }}
                                    barGap={-1}
                                    barCategoryGap={-1}
                                >
                                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        // tick={{ fontSize: 12 }}
                                        // tickMargin={5}
                                        tickCount={5}
                                        tickFormatter={(value) =>
                                            formatDateAccordingToPeriod(
                                                value,
                                                selectedRange
                                            )
                                        }
                                        dx={-10}
                                        tick={({ x, y, payload, index }) => (
                                            <CustomXAxisTick
                                                payload={
                                                    payload as { value: number }
                                                }
                                                selectedRange={selectedRange}
                                                x={x as number}
                                                y={y as number}
                                                index={index as number}
                                                length={chartData.length}
                                            />
                                        )}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12 }}
                                        tickMargin={5}
                                        ticks={[0, 25, 50, 75, 100]}
                                        domain={[0, 100]}
                                    // tick={({ x, y, payload, index }) => (
                                    //     <CustomYAxisTick
                                    //         payload={
                                    //             payload as { value: number }
                                    //         }
                                    //         x={x as number}
                                    //         y={y as number}
                                    //         index={index as number}
                                    //         length={chartData.length}
                                    //     />
                                    // )}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                className="flex items-center gap-2 rounded-lg border bg-white p-2 text-sm shadow-lg"
                                                hideIndicator={true}
                                                labelFormatter={(
                                                    label,
                                                    playload
                                                ) => (
                                                    <CustomChartTooltipContent
                                                        payload={playload}
                                                        label={label}
                                                    />
                                                )}
                                            />
                                        }
                                    />
                                    {memoizedBarsForChart}
                                    {memoizedBrush}
                                </BarChart>
                            </ResponsiveContainer>
                        }
                        {
                            isLoading &&
                            <Skeleton className="w-full h-[300px] rounded-4 max-w-[1200px] bg-gray-300" />
                        }
                    </>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
