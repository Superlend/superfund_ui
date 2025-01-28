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
    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                    Allocation History
                </CardTitle>
                {/* Timeline Filters Tab */}
                <Tabs
                    defaultValue={Period.oneMonth}
                    value={Period.oneMonth}
                    onValueChange={() => {}}
                    className="w-fit"
                >
                    <TabsList>
                        {PERIOD_LIST.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="px-[12px] py-[2px]"
                            >
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
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
                            <Bar
                                dataKey="value1"
                                stackId="stack"
                                fill="rgb(239, 108, 100)"
                                radius={[0, 0, 4, 4]}
                            />
                            <Bar
                                dataKey="value2"
                                stackId="stack"
                                fill="rgb(146, 136, 224)"
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="value3"
                                stackId="stack"
                                fill="rgb(37, 99, 235)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
