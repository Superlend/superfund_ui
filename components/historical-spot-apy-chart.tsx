'use client'

import React, { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { AlignEndHorizontal, ChartLine } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Period } from '@/types/periodButtons'
import { abbreviateNumber, extractTimeFromDate } from '@/lib/utils'
import { TimelineFilterTabs } from '@/components/tabs/timeline-filter-tabs'

enum ChartType {
    Area = 'area',
    Bar = 'bar'
}

const chartConfig = {
    spotApy: {
        label: 'Spot APY',
        color: '#FF5B00',
    },
}

type THistoricalSpotApyChartProps = {
    selectedRange: Period
    setSelectedRange: (range: Period) => void
    historicalData: any[]
    isLoadingHistoricalData: boolean
    isErrorHistoricalData: boolean
    noDataUI: React.ReactNode
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="text-sm font-medium text-gray-900">{data?.timestamp}</p>
                <p className="text-sm text-gray-600">
                    <span className="inline-block w-3 h-3 bg-[#FF5B00] rounded-full mr-2"></span>
                    Spot APY: {data?.spotApy}%
                </p>
            </div>
        )
    }
    return null
}

function CustomXAxisTick({ payload, x, y, selectedRange, index, length }: any) {
    const shouldShow = selectedRange === Period.oneDay || 
                      selectedRange === Period.oneWeek || 
                      index % Math.max(1, Math.floor(length / 5)) === 0

    if (!shouldShow) return null

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill="#888888"
                fontSize="12"
            >
                {payload.value}
            </text>
        </g>
    )
}

export default function HistoricalSpotApyChart({
    selectedRange,
    setSelectedRange,
    historicalData,
    isLoadingHistoricalData,
    isErrorHistoricalData,
    noDataUI
}: THistoricalSpotApyChartProps) {
    const [chartType, setChartType] = useState<ChartType>(ChartType.Area)

    const averageSpotApy = useMemo(() => {
        if (!historicalData || historicalData.length === 0) return 0
        return historicalData.reduce((acc: number, item: any) => acc + item.spotApy, 0) / historicalData.length
    }, [historicalData])

    const chartData = useMemo(() => {
        return historicalData?.map((item: any) => {
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
                rawTimestamp: item.timestamp,
                timestamp: `${formattedDate}`,
                date: formattedDate.split(',')[0],
                time: time,
                spotApy: Number(item.spotApy).toFixed(2),
            }
        }).sort((a, b) => new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime())
    }, [historicalData])

    const handleRangeChange = (range: Period) => {
        setSelectedRange(range)
    }

    const earningsSuffixText = {
        [Period.oneDay]: 'today',
        [Period.oneWeek]: 'this week',
        [Period.oneMonth]: 'this month',
        [Period.oneYear]: 'this year',
    } satisfies Record<Period, string>

    return (
        <Card>
            <div className="flex items-start sm:items-center justify-between max-sm:px-4 p-6 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                    <HeadingText level="h4" weight="medium" className="text-gray-800">
                        Historical Spot APY
                    </HeadingText>
                    <div className="flex gap-1 items-center w-auto p-1 tracking-normal leading-tight uppercase whitespace-nowrap rounded-4 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
                        <Button
                            variant={chartType === ChartType.Area ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setChartType(ChartType.Area)}
                            className={`flex items-center justify-center py-1 grow-1 min-w-[50px] w-full flex-1 h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-3 ${chartType === ChartType.Area ? 'shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]' : ''
                                }`}
                        >
                            <ChartLine className={`h-4 w-4 ${chartType !== ChartType.Area ? 'stroke-gray-600' : ''}`} />
                        </Button>
                        <Button
                            variant={chartType === ChartType.Bar ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setChartType(ChartType.Bar)}
                            className={`flex items-center justify-center py-1 grow-1 min-w-[50px] w-full flex-1 h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-3 ${chartType === ChartType.Bar ? 'shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]' : ''
                                }`}
                        >
                            <AlignEndHorizontal className={`h-4 w-4 rotate-180 scale-[-1] ${chartType !== ChartType.Bar ? 'stroke-gray-600' : ''}`} />
                        </Button>
                    </div>
                </div>
                <TimelineFilterTabs
                    selectedRange={selectedRange}
                    handleRangeChange={(value: string) => handleRangeChange(value as Period)}
                    filterPeriodList={(item: { value: Period }) => item.value !== Period.oneDay}
                />
            </div>
            <div className="relative h-[300px] bg-white rounded-4 pb-2">
                <div className="flex items-center gap-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    {(isErrorHistoricalData || (historicalData?.length === 0 && !isLoadingHistoricalData)) &&
                        noDataUI
                    }
                </div>
                <div className="flex items-center gap-2 absolute top-3 right-8 z-10">
                    {!isLoadingHistoricalData &&
                        <>
                            <BodyText level="body2" weight="normal" className="text-muted-foreground">
                                Avg {earningsSuffixText[selectedRange]}
                            </BodyText>
                            <HeadingText level="h5" weight="medium" className="text-gray-800">
                                {averageSpotApy.toFixed(2)}%
                            </HeadingText>
                        </>
                    }
                    {isLoadingHistoricalData &&
                        <Skeleton className={`w-[100px] h-[22px] rounded-2 max-w-[1200px] bg-gray-300`} />
                    }
                </div>
                <>
                    {!isLoadingHistoricalData &&
                        <ResponsiveContainer width="100%" height="100%">
                            <ChartContainer
                                config={chartConfig}
                            >
                                {chartType === ChartType.Area ? (
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
                                                id="colorSpotApy"
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
                                            dataKey="spotApy"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={true}
                                            axisLine={true}
                                            tickCount={4}
                                            tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                                            padding={{ top: 10, bottom: 10 }}
                                            allowDataOverflow={false}
                                            scale="auto"
                                            interval="preserveStartEnd"
                                        />
                                        <ChartTooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="spotApy"
                                            stroke="#FF5B00"
                                            fillOpacity={1}
                                            fill="url(#colorSpotApy)"
                                            isAnimationActive={true}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </AreaChart>
                                ) : (
                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 10,
                                            bottom: 0,
                                        }}
                                    >
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={true}
                                            axisLine={true}
                                            tickCount={5}
                                            padding={{ left: 0, right: 0 }}
                                            allowDataOverflow={true}
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
                                            dataKey="spotApy"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={true}
                                            axisLine={true}
                                            tickCount={4}
                                            tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                                            padding={{ top: 10, bottom: 10 }}
                                            allowDataOverflow={false}
                                            scale="auto"
                                            interval="preserveStartEnd"
                                        />
                                        <ChartTooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="spotApy"
                                            fill="#FF5B00"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={50}
                                        />
                                    </BarChart>
                                )}
                            </ChartContainer>
                        </ResponsiveContainer>
                    }
                    {isLoadingHistoricalData &&
                        <Skeleton className={`w-full h-[350px] rounded-4 max-w-[1200px] bg-gray-300`} />
                    }
                </>
            </div>
        </Card>
    )
} 