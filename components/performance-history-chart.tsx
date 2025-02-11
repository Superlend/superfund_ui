'use client'

import { Card } from './ui/card'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Area,
    AreaChart,
    Brush,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { useState } from 'react'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate } from '@/lib/utils'

const data = [
    { date: '12:05 27 Jan 2025', baseApy: 14, totalApy: 17, totalAssets: 14 },
    { date: '12:05 28 Jan 2025', baseApy: 16, totalApy: 19, totalAssets: 16 },
    { date: '12:05 29 Jan 2025', baseApy: 13, totalApy: 16, totalAssets: 13 },
    { date: '12:05 30 Jan 2025', baseApy: 15, totalApy: 18, totalAssets: 15 },
    { date: '12:05 31 Jan 2025', baseApy: 16, totalApy: 19, totalAssets: 16 },
    { date: '12:05 01 Feb 2025', baseApy: 14, totalApy: 17, totalAssets: 14 },
    { date: '12:05 02 Feb 2025', baseApy: 18, totalApy: 21, totalAssets: 18 },
    { date: '12:05 03 Feb 2025', baseApy: 19, totalApy: 22, totalAssets: 19 },
    { date: '12:05 04 Feb 2025', baseApy: 21, totalApy: 23, totalAssets: 21 },
    { date: '12:05 05 Feb 2025', baseApy: 22, totalApy: 24, totalAssets: 22 },
]

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-medium text-foreground-subtle mb-1">{payload[0]?.payload.timestamp}</p>
                <div className="space-y-1">
                    <p className="font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-morpho))] mr-2" />
                        Base APY: {payload[0]?.value}%
                    </p>
                    <p className="font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-superlend))] mr-2" />
                        Total APY: {payload[0]?.value}%
                    </p>
                    <p className="font-medium flex items-center">
                        {/* <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-superlend))] mr-2" /> */}
                        Total Assets: ${payload[0]?.value}
                    </p>
                </div>
            </div>
        )
    }
    return null
}

const styles = `
    .recharts-brush .recharts-brush-traveller {
        fill: hsl(var(--background));
        stroke: hsl(var(--chart-superlend));
        stroke-width: 1.5;
        rx: 4;
        ry: 4;
    }
    .recharts-brush .recharts-brush-slide {
        fill: hsla(var(--chart-superlend), 0.05);
        stroke: none;
    }
    .recharts-brush text {
        fill: hsl(var(--foreground)) !important;
        font-weight: 500;
    }
`

export default function PerformanceHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const { historicalData } = useHistoricalData(selectedRange)

    const chartData = historicalData.map((item: any) => {
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
            baseApy: abbreviateNumber(item.baseApy),
            totalApy: abbreviateNumber(item.totalApy),
            totalAssets: abbreviateNumber(item.totalAssets),
        }
    })

    const handleRangeChange = (value: string) => {
        setSelectedRange(value as Period)
    }

    return (
        <Card>
            <style>{styles}</style>
            <div className="flex items-center justify-between p-6">
                <h2 className="text-lg font-semibold">
                    Performance History
                </h2>
                {/* Timeline Filters Tab */}
                <Tabs
                    defaultValue={Period.oneMonth}
                    value={selectedRange}
                    onValueChange={handleRangeChange}
                    className="w-fit"
                >
                    <TabsList className="bg-gray-200 rounded-2 p-0.5">
                        {PERIOD_LIST.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="px-[12px] py-[2px] data-[state=active]:bg-white data-[state=active]:shadow-md rounded-2"
                            >
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
            <div className="h-[300px] bg-white rounded-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 45
                        }}
                    >
                        {/* <defs>
                            <linearGradient
                                id="baseApyGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="hsl(var(--chart-superlend))"
                                    stopOpacity={0.15}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="hsl(var(--chart-superlend))"
                                    stopOpacity={0.01}
                                />
                            </linearGradient>
                            <linearGradient
                                id="totalApyGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="hsl(var(--chart-blue))"
                                    stopOpacity={0.15}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="hsl(var(--chart-blue))"
                                    stopOpacity={0.01}
                                />
                            </linearGradient>
                        </defs> */}
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--foreground-subtle))"
                            fontSize={12}
                            tickLine={false}
                            tickCount={4}
                            axisLine={false}
                            padding={{ left: 10, right: 10 }}
                            dy={10}
                        />
                        <YAxis
                            stroke="hsl(var(--foreground-subtle))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            padding={{ top: 10, bottom: 10 }}
                            dx={-10}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'hsl(var(--foreground-disabled))', strokeWidth: 1 }}
                        />
                        {/* Base APY Line */}
                        <Line
                            type="monotone"
                            dataKey="baseApy"
                            stroke="hsl(var(--chart-morpho))"
                            strokeWidth={2}
                            // dot={{ fill: "hsl(var(--chart-morpho))", r: 4 }}
                            // activeDot={{ r: 3, strokeWidth: 0 }}
                            // fill="url(#baseApyGradient)"
                            isAnimationActive={true}
                        />
                        {/* Total APY Line */}
                        <Line
                            type="monotone"
                            dataKey="totalApy"
                            stroke="hsl(var(--chart-superlend))"
                            strokeWidth={2}
                            // dot={{ fill: "hsl(var(--chart-superlend))", r: 4 }}
                            // activeDot={{ r: 3, strokeWidth: 0 }}
                            // fill="url(#totalApyGradient)"
                            isAnimationActive={true}
                        />
                        <Brush
                            dataKey="date"
                            height={35}
                            stroke="hsl(var(--pulse-color))"
                            // fill="url(#baseApyGradient)"
                            travellerWidth={8}
                            y={245}
                            strokeWidth={1.2}
                            startIndex={0}
                            endIndex={data.length - 1}
                            className="recharts-brush"
                            alwaysShowText={false}
                        >
                            <AreaChart>
                                <Area
                                    type="monotone"
                                    dataKey="baseApy"
                                    stroke="hsl(var(--chart-morpho))"
                                    fill="hsla(var(--chart-morpho), 0.15)"
                                    strokeWidth={1}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="totalApy"
                                    stroke="hsl(var(--chart-superlend))"
                                    fill="hsla(var(--chart-superlend), 0.15)"
                                    strokeWidth={1}
                                />
                            </AreaChart>
                        </Brush>
                    </LineChart>
                </ResponsiveContainer >
            </div >
        </Card >
    )
}
