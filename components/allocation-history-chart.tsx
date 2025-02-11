'use client'

import {
    Bar,
    BarChart,
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
import { useState } from 'react'
import { useRebalanceHistory } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate } from '@/lib/utils'
import { VAULT_STRATEGIES_COLORS } from '@/lib/constants'
import { BodyText, Label } from './ui/typography'

const chartData = [
    { date: '11/07', value1: 8, value2: 4, value3: 12 },
    { date: '12/07', value1: 6, value2: 10, value3: 8 },
    { date: '13/07', value1: 7, value2: 8, value3: 9 },
    { date: '14/07', value1: 10, value2: 6, value3: 8 },
    { date: '15/07', value1: 6, value2: 8, value3: 10 },
    { date: '16/07', value1: 7, value2: 9, value3: 8 },
    { date: '17/07', value1: 8, value2: 7, value3: 9 },
]

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
        <div className="flex flex-col gap-2 px-1.5 pt-1.5">
            <Label size="small" className="text-gray-600">
                {caption}
            </Label>
            {
                allocations.map((allocation: any) => (
                    <div key={allocation.address} className="flex items-center gap-1">
                        <BodyText level="body3" weight="medium">
                            {abbreviateNumber(allocation.value)}%
                        </BodyText>
                        <Label size="small" className="text-gray-600 max-w-[100px] truncate">
                            {allocation.name}
                        </Label>
                    </div>
                ))
            }
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
        color: '#17395e',
    }
}

export function AllocationHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneDay)
    const { rebalanceHistory, isLoading, error } = useRebalanceHistory(selectedRange)

    const handleRangeChange = (value: string) => {
        setSelectedRange(value as Period)
    }

    const chartData = rebalanceHistory.map((item) => {
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

        const allocations = item.allocations.map((allocation: any) => {
            return {
                [allocation.name]: allocation.value,
            }
        })

        return {
            timestamp: `${formattedDate} ${time}`,
            date: formattedDate.split(',')[0],
            time: time,
            totalAssets: abbreviateNumber(item.totalAssets),
            allocations: item.allocations,
            // ...item.allocations.reduce((acc, allocation) => ({
            //     ...acc,
            //     [allocation.name]: allocation.value
            // }), {})
        }
    })
    console.log(chartData)

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                    Allocation History
                </CardTitle>
                {/* Timeline Filters Tab */}
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
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 0,
                                right: 10,
                                left: -10,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12 }}
                                tickMargin={5}
                                tickCount={5}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12 }}
                                tickMargin={5}
                                ticks={[0, 25, 50, 75, 100]}
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
                            {/* <ChartLegend content={<ChartLegendContent />} /> */}
                            {
                                Object.keys(chartConfig).map((key, index) => (
                                    <Bar
                                        key={index}
                                        dataKey={`allocations[${index}].value`}
                                        stackId="stack"
                                        fill={`var(--color-${key})`}
                                        radius={[0, 0, 4, 4]}
                                    />
                                ))
                            }
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
