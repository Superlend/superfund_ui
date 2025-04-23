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
import { useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import { SONIC_USDC_ADDRESS, USDC_ADDRESS } from '@/lib/constants'
import { fetchRewardApyAaveV3 } from '@/hooks/vault_hooks/vaultHook'


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const isAaveApproximated = payload[0]?.payload.isAaveApproximated;

        return (
            <div className="flex flex-col gap-2 bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <BodyText level='body3' className="text-gray-600">
                    {payload[0]?.payload.timestamp}
                </BodyText>
                <div className="space-y-1">
                    <BodyText level='body3' className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#fb5900]" />
                            Superfund
                        </div>
                        <span className="font-medium">
                            {payload[0]?.payload.superfundDisplay}% APY
                        </span>
                    </BodyText>
                    <BodyText level='body3' className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#1E90FF]" />
                            Aave
                            {/* {isAaveApproximated && (
                                <span className="text-xs text-muted-foreground ml-1">(approx.)</span>
                            )} */}
                        </div>
                        <span className="font-medium">
                            {payload[0]?.payload.aaveDisplay}% APY
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
    superfund: {
        label: 'Superfund',
        color: '#fb5900',
    },
    aave: {
        label: 'Aave',
        color: '#1E90FF',
    }
} satisfies ChartConfig

export function BenchmarkHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const [apiPeriod, setApiPeriod] = useState<Period | 'YEAR'>(Period.oneMonth)
    const [aaveRewardApy, setAaveRewardApy] = useState<number>(0)
    const { selectedChain } = useChain()
    const SONIC_PROTOCOL_IDENTIFIER = '0x0b1d26d64c197f8644f6f24ef29af869793188f521c37dc35052c5aebf1e1b1e'
    const BASE_PROTOCOL_IDENTIFIER = '0x8ef0fa7f46a36d852953f0b6ea02f9a92a8a2b1b9a39f38654bee0792c4b4304'

    const { historicalData: SuperfundHistoryData, isLoading: isSuperfundLoading } = useHistoricalData({
        period: selectedRange,
    })
    fetchRewardApyAaveV3()
        .then((apy) => {
            setAaveRewardApy(apy)
        })
        .catch((error) => {
            console.error('Error fetching Aave reward apy:', error)
        })
    const { data: AaveHistoryData, isLoading: isAaveLoading } = useGetBenchmarkHistory({
        protocol_identifier: selectedChain === ChainId.Sonic ? SONIC_PROTOCOL_IDENTIFIER : BASE_PROTOCOL_IDENTIFIER,
        token: selectedChain === ChainId.Sonic ? SONIC_USDC_ADDRESS : USDC_ADDRESS,
        period: apiPeriod,
    })
    const [historicalData, setHistoricalData] = useState<Array<{ timestamp: number; aave: number; superfund: number }>>([])
    const prevSuperfundData = useRef<any>(null);
    const prevAaveData = useRef<any>(null);

    // Combine both data sources
    useEffect(() => {
        // Skip if API is still loading
        if (isSuperfundLoading || isAaveLoading) return;

        // Create maps for faster lookups
        const superfundMap = new Map<number, number>();
        if (SuperfundHistoryData && Array.isArray(SuperfundHistoryData)) {
            SuperfundHistoryData.forEach((item: any) => {
                if (item && item.timestamp && item.totalApy) {
                    superfundMap.set(item.timestamp, item.totalApy);
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

        // Get all timestamps
        const superfundTimestamps = Array.from(superfundMap.keys());
        const aaveTimestamps = Array.from(aaveMap.keys());


        // Check if timestamps are in different formats (e.g., milliseconds vs seconds)
        const superfundFirstTimestamp = superfundTimestamps[0];
        const aaveFirstTimestamp = aaveTimestamps[0];

        // Log timestamp formats
        if (superfundFirstTimestamp && aaveFirstTimestamp) {
            // Normalize timestamps to milliseconds if needed
            let normalizedSuperfundTimestamps = superfundTimestamps;
            let normalizedSuperfundMap = superfundMap;
            let normalizedAaveTimestamps = aaveTimestamps;
            let normalizedAaveMap = aaveMap;

            // Convert seconds to milliseconds if needed
            if (superfundFirstTimestamp.toString().length === 10 && aaveFirstTimestamp.toString().length === 13) {
                // Superfund in seconds, Aave in milliseconds
                normalizedSuperfundMap = new Map();
                normalizedSuperfundTimestamps = superfundTimestamps.map(ts => ts * 1000);
                superfundMap.forEach((value, key) => {
                    normalizedSuperfundMap.set(key * 1000, value);
                });
            } else if (superfundFirstTimestamp.toString().length === 13 && aaveFirstTimestamp.toString().length === 10) {
                // Superfund in milliseconds, Aave in seconds
                normalizedAaveMap = new Map();
                normalizedAaveTimestamps = aaveTimestamps.map(ts => ts * 1000);
                aaveMap.forEach((value, key) => {
                    normalizedAaveMap.set(key * 1000, value);
                });
            }

            // Helper function to find closest timestamp in a set
            const findClosestTimestamp = (target: number, timestamps: number[]): number | null => {
                if (timestamps.length === 0) return null;

                let closest = timestamps[0];
                let minDistance = Math.abs(target - closest);

                for (let i = 1; i < timestamps.length; i++) {
                    const distance = Math.abs(target - timestamps[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closest = timestamps[i];
                    }
                }

                // Only return if within reasonable time range (e.g., 1 day)
                const maxDistance = 24 * 60 * 60 * 1000; // 1 day in milliseconds
                return minDistance <= maxDistance ? closest : null;
            };

            // Sort Superfund timestamps chronologically
            normalizedSuperfundTimestamps.sort((a, b) => a - b);

            // For each Superfund timestamp, find exact or nearest Aave value
            const sortedAaveTimestamps = Array.from(normalizedAaveTimestamps).sort((a, b) => a - b);

            const combined = normalizedSuperfundTimestamps.map(timestamp => {
                // Get Superfund value
                const superfundValue = normalizedSuperfundMap.get(timestamp);

                // Try exact match for Aave first
                if (normalizedAaveMap.has(timestamp)) {
                    return {
                        timestamp,
                        superfund: superfundValue as number,
                        aave: normalizedAaveMap.get(timestamp) as number
                    };
                }

                // If no exact match, find closest Aave timestamp
                const closestAaveTimestamp = findClosestTimestamp(timestamp, sortedAaveTimestamps);

                if (closestAaveTimestamp !== null) {
                    return {
                        timestamp,
                        superfund: superfundValue as number,
                        aave: normalizedAaveMap.get(closestAaveTimestamp) as number,
                        isAaveApproximated: true // Flag to indicate approximated value
                    };
                }

                // If no reasonable Aave match found
                return {
                    timestamp,
                    superfund: superfundValue as number,
                    aave: null // Will be handled in rendering
                };
            });

            setHistoricalData(combined.filter(d => d.aave !== null) as any);
        } else {
            console.log('Missing timestamp data in one or both datasets');
            setHistoricalData([]);
        }

        // Update refs
        prevSuperfundData.current = SuperfundHistoryData;
        prevAaveData.current = AaveHistoryData;

    }, [SuperfundHistoryData, AaveHistoryData, isSuperfundLoading, isAaveLoading]);

    const chartData = useMemo(() => {

        if (historicalData.length === 0) {
            return [];
        }

        const formatted = historicalData.map((item: any) => {
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
                superfund: item.superfund,
                aave: selectedChain === ChainId.Sonic ? (item.aave + aaveRewardApy) : item.aave,
                isAaveApproximated: item.isAaveApproximated || false,
                superfundDisplay: abbreviateNumber(item.superfund),
                aaveDisplay: abbreviateNumber(selectedChain === ChainId.Sonic ? (item.aave + aaveRewardApy) : item.aave),
            }
        }).sort((a: any, b: any) => a.rawTimestamp - b.rawTimestamp);

        return formatted;
    }, [historicalData, aaveRewardApy])

    const { minValue, maxValue, valueRange } = useMemo(() => {
        const allValues = chartData.flatMap((d: any) => [Number(d.superfund), Number(d.aave)])
        const min = Math.min(...allValues)
        const max = Math.max(...allValues)
        return {
            minValue: min,
            maxValue: max,
            valueRange: max - min
        }
    }, [chartData])

    const yAxisDomain = useMemo(() => {
        // Calculate a minimum y-axis value that's proportionally lower than the minimum value
        // This ensures the lines appear more centered vertically
        const padding = valueRange * 0.5; // Adjust this factor to control vertical positioning
        const minYValue = Math.max(0, minValue - padding); // Ensure we don't go below 0 for APY values
        const maxYValue = maxValue + (valueRange * 0.1);
        return [minYValue, maxYValue];
    }, [minValue, maxValue, valueRange]);

    const yAxisTicks = useMemo(() => {
        const [minYValue, maxYValue] = yAxisDomain;
        const range = maxYValue - minYValue;
        const tickCount = 4;
        const interval = range / (tickCount - 1);
        
        // Generate evenly spaced ticks between min and max
        return Array.from({ length: tickCount }, (_, i) => minYValue + (interval * i));
    }, [yAxisDomain]);

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
            setApiPeriod("YEAR"); // Use one month data for API calls
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
                        Performance vs Peers
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
                        {chartData.length > 0 ? (
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
                                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                                        padding={{ top: 10, bottom: 10 }}
                                        domain={yAxisDomain}
                                        allowDataOverflow={true}
                                    />
                                    <ReferenceLine y={0} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: 'hsl(var(--foreground-disabled))', strokeWidth: 1 }}
                                    />
                                    <Line
                                        dataKey="superfund"
                                        type="monotone"
                                        stroke="var(--color-superfund)"
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
                                                dataKey="superfund"
                                                stroke="var(--color-superfund)"
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
