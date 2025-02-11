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

const chartData = [
    { date: '11/07', value1: 8, value2: 4, value3: 12 },
    { date: '12/07', value1: 6, value2: 10, value3: 8 },
    { date: '13/07', value1: 7, value2: 8, value3: 9 },
    { date: '14/07', value1: 10, value2: 6, value3: 8 },
    { date: '15/07', value1: 6, value2: 8, value3: 10 },
    { date: '16/07', value1: 7, value2: 9, value3: 8 },
    { date: '17/07', value1: 8, value2: 7, value3: 9 },
]

const chartConfig = {
    value1: {
        label: 'Value 1',
        color: 'rgb(239, 108, 100)',
    },
    value2: {
        label: 'Value 2',
        color: 'rgb(146, 136, 224)',
    },
    value3: {
        label: 'Value 3',
        color: 'rgb(37, 99, 235)',
    },
}

export function AllocationHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
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
                                top: 10,
                                right: 10,
                                left: -10,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12 }}
                                tickMargin={8}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12 }}
                                tickMargin={8}
                                ticks={[0, 6, 12, 18, 24]}
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        className="flex items-center gap-2 rounded-lg border bg-white p-2 text-sm shadow-lg"
                                    // indicator={false}
                                    />
                                }
                            />
                            {
                                Array.from({ length: 8 }, (_, index) => (
                                    <Bar
                                        key={index}
                                        dataKey={`allocations[${index}].value`}
                                        stackId="stack"
                                        fill="rgb(239, 108, 100)"
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
