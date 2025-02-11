'use client'

import { Card } from './ui/card'
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
import { useEffect, useState } from 'react'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from '@/lib/utils'
import { ChartConfig } from './ui/chart'

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-medium text-foreground-subtle mb-1">{payload[0]?.payload.timestamp}</p>
                <div className="space-y-1">
                    <p className="font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-morpho))] mr-2" />
                        Base APY: {payload[0]?.payload.baseApy}%
                    </p>
                    <p className="font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-superlend))] mr-2" />
                        Total APY: {payload[0]?.payload.totalApy}%
                    </p>
                    <p className="font-medium flex items-center">
                        {/* <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-superlend))] mr-2" /> */}
                        Total Assets: ${payload[0]?.payload.totalAssets}
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
    setYAxisDigitCount: any
}

const CustomYAxisTick = ({
    x,
    y,
    payload,
    index,
    length,
    setYAxisDigitCount,
}: CustomYAxisTickProps) => {
    // if (index === 0 || index === length - 1) return null
    // setYAxisDigitCount(payload.value.toString().length)

    return (
        <g
            transform={`translate(${x},${y})`}
            style={{ zIndex: 10, position: 'relative', color: 'hsl(var(--foreground-subtle))' }}
        >
            <text x={0} y={0} dy={6} dx={11} textAnchor="start" fontSize={12} fill="hsl(var(--foreground-subtle))">
                {`${shortNubers(payload.value)}%`}
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
    if (index % 2) return null
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

export default function PerformanceHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const { historicalData } = useHistoricalData(selectedRange)
    const [startIndex, setStartIndex] = useState(0)
    const [endIndex, setEndIndex] = useState(historicalData.length - 1)

    useEffect(() => {
        setStartIndex(0)
        setEndIndex(historicalData.length - 1)
    }, [historicalData])

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

    const allValues = chartData.flatMap(d => [Number(d.baseApy), Number(d.totalApy)]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue;

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
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--foreground-subtle))"
                            fontSize={12}
                            tickLine={false}
                            tickCount={4}
                            axisLine={false}
                            padding={{ left: 10, right: 10 }}
                            dy={10}
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
                            stroke="hsl(var(--foreground-subtle))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${shortNubers(value.toFixed(2))}%`}
                            padding={{ top: 10, bottom: 10 }}
                            domain={[
                                minValue - (valueRange * 0.1), 
                                maxValue + (valueRange * 0.1)
                            ]}
                            allowDataOverflow={true}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'hsl(var(--foreground-disabled))', strokeWidth: 1 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="baseApy"
                            stroke="hsl(var(--chart-morpho))"
                            strokeWidth={2}
                            fill="url(#baseApyGradient)"
                            isAnimationActive={true}
                            dot={false}

                        />
                        <Line
                            type="monotone"
                            dataKey="totalApy"
                            stroke="hsl(var(--chart-superlend))"
                            strokeWidth={2}
                            fill="url(#totalApyGradient)"
                            isAnimationActive={true}
                            dot={false}
                        />
                        <Brush
                            dataKey="date"
                            height={35}
                            stroke="hsl(var(--pulse-color))"
                            fill="hsl(var(--accent-cream))"
                            travellerWidth={8}
                            y={245}
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
                                    stroke="hsl(var(--chart-morpho))"
                                    // fill="hsla(var(--chart-morpho), 0.15)"
                                    strokeWidth={1}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="totalApy"
                                    stroke="hsl(var(--chart-superlend))"
                                    // fill="hsla(var(--chart-superlend), 0.15)"
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

{/* <ChartContainer
                        config={chartConfig}
                        className="h-[250px] w-full"
                    >
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 10,
                                right: 20,
                                top: 30,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={true}
                                axisLine={true}
                                tickMargin={5}
                                // interval={100}
                                tickCount={4}
                                tickFormatter={(value) =>
                                    formatDateAccordingToPeriod(
                                        value,
                                        selectedRange
                                    )
                                }
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
                            <ChartTooltip
                                cursor={true}
                                content={
                                    <ChartTooltipContent />
                                }
                            />
                            <Area
                                dataKey="totalApy"
                                type="monotone"
                                fill="hsl(var(--chart-superlend))"
                                fillOpacity={0.3}
                                stroke="hsl(var(--chart-superlend))"
                                strokeWidth={2}
                                stackId="a"
                                activeDot={{ r: 6 }}
                            />
                            <Area
                                dataKey="baseApy"
                                type="monotone"
                                fill="var(--color-platformHistory)"
                                fillOpacity={0.3}
                                stroke="var(--color-platformHistory)"
                                strokeWidth={2}
                                stackId="a"
                                activeDot={{ r: 6 }}
                            />
                            <YAxis
                                tick={({ x, y, payload, index }) => (
                                    <CustomYAxisTick
                                        payload={
                                            payload as { value: number }
                                        }
                                        x={x as number}
                                        y={y as number}
                                        index={index as number}
                                        length={chartData.length}
                                        setYAxisDigitCount={4}
                                    />
                                )}
                                // domain={[minValue, maxValue]}
                                tickCount={4}
                                tickMargin={40}
                                // stroke="#FFF"
                                tickLine={true}
                                axisLine={true}
                            />
                            <Brush
                            dataKey="date"
                            height={35}
                            stroke="hsl(var(--pulse-color))"
                            fill="url(#baseApyGradient)"
                            travellerWidth={8}
                            y={255}
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
                        </AreaChart>
                    </ChartContainer> */}
