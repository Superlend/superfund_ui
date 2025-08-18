'use client'

import { Card } from './ui/card'
import { motion } from 'motion/react'
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
import { PERIOD_LIST } from '@/constants'
import { BodyText, HeadingText } from './ui/typography'
import { TimelineFilterTabs } from './tabs/timeline-filter-tabs'

const data = [
    { date: '11/07', value: 14 },
    { date: '12/07', value: 16 },
    { date: '13/07', value: 13 },
    { date: '14/07', value: 15 },
    { date: '15/07', value: 16 },
    { date: '16/07', value: 14 },
    { date: '17/07', value: 18 },
    { date: '18/07', value: 19 },
    { date: '19/07', value: 21 },
    { date: '20/07', value: 22 },
]

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">{`${payload[0].value}%`}</p>
            </div>
        )
    }
    return null
}

export default function DepositHistoryChart({
    selectedRange,
    handleRangeChange,
    selectedFilter,
    handleFilterChange,
    chartData,
}: any) {
    return (
        <Card>
            <div className="flex items-center justify-between p-6 pb-4">
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Deposit History
                </HeadingText>
                <div className="flex items-center gap-2">
                    <BodyText level="body1" weight="normal" className="text-muted-foreground">
                        Historical Growth
                    </BodyText>
                </div>
            </div>
            <div className="relative h-[300px] bg-white rounded-4">
                <TimelineFilterTabs
                    selectedRange={selectedRange}
                    handleRangeChange={handleRangeChange}
                    className="absolute top-3 left-16 z-10"
                />
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -10,
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
                                    stopColor="#1550FF"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#1550FF"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            padding={{ left: 20, right: 10 }}
                            allowDataOverflow={false}
                            scale="auto"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            padding={{ top: 10, bottom: 10 }}
                            allowDataOverflow={false}
                            scale="auto"
                            interval="preserveStartEnd"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#1550FF"
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
