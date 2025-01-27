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
import { PERIOD_LIST } from '@/constants'

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

export default function PerformanceHistoryChart({
    selectedRange,
    handleRangeChange,
    selectedFilter,
    handleFilterChange,
    chartData,
}: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <Card>
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
                </div>
                <div className="h-[300px] bg-white rounded-4">
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
                                        stopColor="#22c55e"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#22c55e"
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
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </motion.div>
    )
}
