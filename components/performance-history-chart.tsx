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
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from '@/lib/utils'
import { ChartConfig } from './ui/chart'
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


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-medium text-foreground-subtle mb-1">{payload[0]?.payload.timestamp}</p>
                <div className="space-y-1">
                    <p className="font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[#3366CC] mr-2" />
                        Base APY: {payload[0]?.payload.baseApy}%
                    </p>
                    <p className="font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[#8A2BE2] mr-2" />
                        Total APY: {payload[0]?.payload.totalApy}%
                    </p>
                    <p className="font-medium flex items-center">
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
    const [openDialog, setOpenDialog] = useState(false)

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

            return {
                timestamp: `${formattedDate} ${time}`,
                date: formattedDate.split(',')[0],
                time: time,
                baseApy: abbreviateNumber(item.baseApy),
                totalApy: abbreviateNumber(item.totalApy),
                totalAssets: abbreviateNumber(item.totalAssets),
            }
        })
    }, [historicalData])

    const { minValue, maxValue, valueRange } = useMemo(() => {
        const allValues = chartData.flatMap(d => [Number(d.baseApy), Number(d.totalApy)])
        const min = Math.min(...allValues)
        const max = Math.max(...allValues)
        return {
            minValue: min,
            maxValue: max,
            valueRange: max - min
        }
    }, [chartData])

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
    ), [])

    const memoizedBrush = useMemo(() => (
        <Brush
            dataKey="date"
            height={35}
            stroke="#8A2BE2"
            fill="rgba(138, 43, 226, 0.1)"
            travellerWidth={8}
            y={openDialog ? 450 : 295}
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
    ), [startIndex, endIndex, openDialog])

    const content = (
        <Card>
            <style>{styles}</style>
            <div className="flex items-center justify-between p-6">
                <h2 className="text-lg font-semibold">
                    Performance History
                </h2>
                <div className="flex items-center gap-2">
                    <div className={`${openDialog ? 'mr-12' : ''}`}>
                        <TimelineFilterTabs
                            selectedRange={selectedRange}
                            handleRangeChange={handleRangeChange}
                        />
                    </div>
                    {!openDialog &&
                        <Button onClick={() => setOpenDialog(true)} className='py-1'>
                            <Expand className='w-4 h-4 text-gray-600' />
                        </Button>
                    }
                </div>
            </div>
            <div className={`h-[${openDialog ? '500px' : '350px'}] bg-white rounded-4`}>
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
                            tickLine={false}
                            axisLine={false}
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
            </div>
        </Card>
    )

    return (
        <>
            {content}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className='w-[90%] h-[85%] max-w-full max-h-full p-0'>
                    {/* <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove your data from our servers.
                        </DialogDescription>
                    </DialogHeader> */}
                    {content}
                </DialogContent>
            </Dialog>

        </>
    )
}
