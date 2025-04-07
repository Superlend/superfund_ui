'use client'

import { Card } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Area,
    AreaChart,
    Brush,
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from '@/lib/utils'
import { ChartConfig, ChartContainer } from './ui/chart'
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
import { BodyText, HeadingText } from './ui/typography'
import { Skeleton } from './ui/skeleton'
import useGetBenchmarkHistory from '@/hooks/useGetBenchmarkHistory'


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="flex flex-col gap-2 bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <BodyText level='body3' className="text-gray-600">
                    {payload[0]?.payload.timestamp}
                </BodyText>
                <div className="space-y-1">
                    <BodyText level='body3' className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#fb5900]" />
                            Superlend:
                        </div>
                        <span className="font-medium">
                            {payload[0]?.payload.superlendDisplay}%
                        </span>
                    </BodyText>
                    <BodyText level='body3' className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#1E90FF]" />
                            Aave:
                        </div>
                        <span className="font-medium">
                            {payload[0]?.payload.aaveDisplay}%
                        </span>
                    </BodyText>
                </div>
            </div>
        )
    }
    return null
}

const styles = `
    .recharts-brush .recharts-brush-traveller {
        fill: hsl(var(--background));
        stroke: #cacaca;
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
    if (index % 2 !== 0 && length > 10) return null;

    return (
        <g transform={`translate(${x},${y})`} style={{ zIndex: 10 }}>
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
    superlend: {
        label: 'Superlend',
        color: '#fb5900',
    },
    aave: {
        label: 'Aave',
        color: '#1E90FF',
    }
} satisfies ChartConfig

export function BenchmarkHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const [apiPeriod, setApiPeriod] = useState<Period>(Period.oneMonth)
    const { data: SuperlendHistoryData, isLoading: isSuperlendLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf',
        token: '0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9',
        period: apiPeriod,
    })
    const { data: AaveHistoryData, isLoading: isAaveLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0x8ef0fa7f46a36d852953f0b6ea02f9a92a8a2b1b9a39f38654bee0792c4b4304',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const [historicalData, setHistoricalData] = useState<Array<{ timestamp: number; aave: number; superlend: number }>>([])
    
    // New approach - use domain values for zoom
    const [isProcessing, setIsProcessing] = useState(false)
    const prevSuperlendData = useRef<any>(null);
    const prevAaveData = useRef<any>(null);
    
    // Determine if we're loading data
    const isLoading = isSuperlendLoading || isAaveLoading || isProcessing;

    // Reset zoom when period changes
    useEffect(() => {
        // No longer needed as we're using default zoom behavior
    }, [selectedRange]);

    // Combine both data sources
    useEffect(() => {
        // Skip if API is still loading
        if (isSuperlendLoading || isAaveLoading) return;

        // Skip if the data hasn't actually changed
        const superlendChanged = prevSuperlendData.current !== SuperlendHistoryData;
        const aaveChanged = prevAaveData.current !== AaveHistoryData;

        if (superlendChanged || aaveChanged) {
            setIsProcessing(true);

            if (SuperlendHistoryData && AaveHistoryData) {
                // Create maps for faster lookups
                const superlendMap = new Map<number, number>();
                if (SuperlendHistoryData?.processMap && Array.isArray(SuperlendHistoryData.processMap)) {
                    SuperlendHistoryData.processMap.forEach((item: any) => {
                        if (item && item.timestamp && item.data && item.data.depositRate) {
                            superlendMap.set(item.timestamp, item.data.depositRate);
                        }
                    });
                }

                const aaveMap = new Map<number, number>();
                if (AaveHistoryData?.processMap && Array.isArray(AaveHistoryData.processMap)) {
                    AaveHistoryData.processMap.forEach((item: any) => {
                        if (item && item.timestamp && item.data && item.data.depositRate) {
                            aaveMap.set(item.timestamp, item.data.depositRate);
                        }
                    });
                }

                // Get all unique timestamps
                const superlendTimestamps = (SuperlendHistoryData?.processMap && Array.isArray(SuperlendHistoryData.processMap))
                    ? SuperlendHistoryData.processMap.map((item: any) => item.timestamp)
                    : [];
                const aaveTimestamps = (AaveHistoryData?.processMap && Array.isArray(AaveHistoryData.processMap))
                    ? AaveHistoryData.processMap.map((item: any) => item.timestamp)
                    : [];
                const allTimestamps = Array.from(new Set([...superlendTimestamps, ...aaveTimestamps])).sort((a, b) => a - b);

                // Create combined dataset
                const combined = allTimestamps.map(timestamp => ({
                    timestamp,
                    aave: aaveMap.get(timestamp) || 0,
                    superlend: superlendMap.get(timestamp) || 0
                }));

                setHistoricalData(combined);

                // Update refs
                prevSuperlendData.current = SuperlendHistoryData;
                prevAaveData.current = AaveHistoryData;
            }
            setIsProcessing(false);
        }
    }, [SuperlendHistoryData, AaveHistoryData, isSuperlendLoading, isAaveLoading]);

    const customTicks = {
        [Period.oneDay]: 5,
        [Period.oneWeek]: 5,
        [Period.oneMonth]: 5,
        [Period.allTime]: 5,
    }

    const chartData = useMemo(() => {
        return historicalData.map((item: any) => {
            const date = new Date(item.timestamp)
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

            // Add extra formatted dates for display
            const monthDay = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric'
            }).format(date);

            return {
                rawTimestamp: item.timestamp,
                xValue: item.timestamp,
                date: formattedDate.split(',')[0],
                monthDay,
                timestamp: `${formattedDate} ${time}`,
                timeValue: time,
                superlend: item.superlend,
                aave: item.aave,
                superlendDisplay: abbreviateNumber(item.superlend),
                aaveDisplay: abbreviateNumber(item.aave),
            }
        }).sort((a: any, b: any) => a.rawTimestamp - b.rawTimestamp)
    }, [historicalData])

    const { minValue, maxValue, valueRange } = useMemo(() => {
        const allValues = chartData.flatMap((d: any) => [Number(d.superlend), Number(d.aave)])
        const min = Math.min(...allValues)
        const max = Math.max(...allValues)
        return {
            minValue: min,
            maxValue: max,
            valueRange: max - min
        }
    }, [chartData])

    const yAxisTicks = useMemo(() => {
        const maxTickValue = maxValue + (valueRange * 0.1);
        const interval = maxTickValue / 3; // Divide by 3 to get 4 points (0 and 3 intervals)
        return [0, interval, interval * 2, maxTickValue];
    }, [maxValue, valueRange]);

    // Implement smart downsampling to reduce visual noise
    const processedChartData = useMemo(() => {
        // If we have a reasonable number of data points or not enough data, use the full dataset
        if (chartData.length <= 100 || chartData.length <= 10) return chartData;

        // More advanced downsampling that preserves important features
        const targetLength = 100; // Target ~100 points for good visualization

        // Simple bucket-based algorithm that retains data shape
        const result = [];
        const step = chartData.length / targetLength;

        // Always include the first point
        if (chartData.length > 0) {
            result.push(chartData[0]);
        }

        // Process the middle points with smart sampling
        for (let i = 1; i < chartData.length - 1; i += step) {
            const idx = Math.floor(i);
            if (idx < chartData.length) {
                result.push(chartData[idx]);
            }
        }

        // Always include the last point
        if (chartData.length > 1) {
            result.push(chartData[chartData.length - 1]);
        }

        return result;
    }, [chartData]);

    // Handle brush change to update zoom
    const handleBrushChange = useCallback((brushData: any) => {
        // We'll no longer set zoom domain on brush change
        // Instead, let Recharts handle the zooming behavior naturally
    }, []);
    
    // Get domain values for x-axis
    const xAxisDomain = useMemo(() => {
        return ['dataMin', 'dataMax'];
    }, []);

    const handleRangeChange = useCallback((value: string) => {
        // For the "All" filter, use one year period instead for API calls
        if (value === Period.allTime) {
            setSelectedRange(Period.allTime); // For UI display
            setApiPeriod(Period.oneMonth); // Use one month data for API calls
        } else {
            setSelectedRange(value as Period);
            setApiPeriod(value as Period);
        }
    }, [])

    // Format timestamp for display, reused for both x-axis and brush
    const formatTimestamp = useCallback((value: number): string => {
        // Create a date formatter that produces 
        // results similar to our original implementation
        const date = new Date(value);

        // Format based on period
        if (selectedRange === Period.oneDay) {
            // For one day, show hour and minute
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } else if (selectedRange === Period.oneWeek) {
            // For one week, show day name
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return dayNames[date.getDay()];
        } else if (selectedRange === Period.oneMonth) {
            // For one month, show day and abbreviated month
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = date.getDate();
            return `${day} ${months[date.getMonth()]}`;
        } else {
            // For all time, use month and year
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getFullYear()}`;
        }
    }, [selectedRange]);

    return (
        <>
            {/* {content}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className='w-[90%] h-[85%] max-w-full max-h-full p-0'>
                    {content}
                </DialogContent>
            </Dialog> */}
            <Card>
                <style>{styles}</style>
                <div className="flex items-center justify-between max-md:px-4 p-6">
                    <HeadingText level="h4" weight="medium" className='text-gray-800'>
                        Benchmark History
                    </HeadingText>
                    <div className="flex items-center gap-2">
                        <div>
                            <TimelineFilterTabs
                                selectedRange={selectedRange}
                                handleRangeChange={handleRangeChange}
                            />
                        </div>
                        {/* {!openDialog &&
                            <Button onClick={() => setOpenDialog(true)} className='py-1'>
                                <Expand className='w-4 h-4 text-gray-600' />
                            </Button>
                        } */}
                    </div>
                </div>
                {/* <div className={`h-[${false ? '500px' : '350px'}] bg-white rounded-4`}> */}
                <ChartContainer
                    config={chartConfig}
                    className={`w-full h-[350px] bg-white rounded-4`}
                >
                    <>
                        {!isLoading && chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    accessibilityLayer
                                    data={processedChartData}
                                    margin={{
                                        top: 0,
                                        right: 30,
                                        left: -15,
                                        bottom: 45
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="rawTimestamp"
                                        type="number"
                                        domain={xAxisDomain}
                                        stroke="hsl(var(--foreground-subtle))"
                                        fontSize={12}
                                        tickLine={true}
                                        axisLine={true}
                                        tickCount={5}
                                        interval="preserveStart"
                                        padding={{ left: 0, right: 10 }}
                                        tickFormatter={formatTimestamp}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--foreground-subtle))"
                                        fontSize={12}
                                        tickLine={true}
                                        axisLine={true}
                                        ticks={yAxisTicks}
                                        tickFormatter={(value) => `${shortNubers(value.toFixed(0))}%`}
                                        padding={{ top: 10, bottom: 10 }}
                                        domain={[
                                            0,
                                            maxValue + (valueRange * 0.1)
                                        ]}
                                        allowDataOverflow={true}
                                    />
                                    <ReferenceLine y={0} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: 'hsl(var(--foreground-disabled))', strokeWidth: 1 }}
                                    />
                                    <Line
                                        dataKey="superlend"
                                        type="monotone"
                                        stroke="var(--color-superlend)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 1 }}
                                        connectNulls={true}
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        dataKey="aave"
                                        type="monotone"
                                        stroke="var(--color-aave)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 1 }}
                                        connectNulls={true}
                                        isAnimationActive={false}
                                    />
                                    <Brush
                                        dataKey="rawTimestamp"
                                        height={35}
                                        stroke="#cacaca"
                                        fill="#fafafa"
                                        travellerWidth={8}
                                        y={285}
                                        strokeWidth={1.2}
                                        onChange={handleBrushChange}
                                        alwaysShowText={false}
                                        tickFormatter={formatTimestamp}
                                    >
                                        <AreaChart data={processedChartData}>
                                            <Area
                                                type="monotone"
                                                dataKey="superlend"
                                                stroke="var(--color-superlend)"
                                                strokeWidth={1}
                                                fill="rgba(251, 89, 0, 0.2)"
                                                connectNulls={true}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="aave"
                                                stroke="var(--color-aave)"
                                                strokeWidth={1}
                                                fill="rgba(30, 144, 255, 0.2)"
                                                connectNulls={true}
                                            />
                                        </AreaChart>
                                    </Brush>
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <Skeleton className={`w-full h-[350px] rounded-4 max-w-[1200px] bg-gray-300`} />
                        )}
                    </>
                </ChartContainer>
                {/* </div> */}
            </Card>
        </>
    )
}
