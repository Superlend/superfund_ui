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
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod } from '@/lib/utils'
import { ChartContainer } from './ui/chart'
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
import { CHART_CONFIG, PROTOCOL_IDENTIFIERS } from '@/lib/benchmark-chart-config'
import { 
    TBenchmarkDataPoint, 
    TFormattedBenchmarkDataPoint, 
    TCustomTooltipProps,
    TCustomXAxisTickProps,
    TCustomYAxisTickProps
} from '@/types/benchmark-chart'

const CustomTooltip = ({ active, payload, visibleLines = {} }: TCustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;

        // Sort protocols by their APY values (highest to lowest)
        const sortedProtocols = Object.entries(CHART_CONFIG)
            .map(([key, config]) => {
                const value = data[key as keyof TFormattedBenchmarkDataPoint];
                const displayValue = data[`${key}Display` as keyof TFormattedBenchmarkDataPoint];
                const isApproximated = data[`is${key.charAt(0).toUpperCase() + key.slice(1)}Approximated` as keyof TFormattedBenchmarkDataPoint];
                
                return {
                    key,
                    config,
                    value: value as number | null | undefined,
                    displayValue,
                    isApproximated
                };
            })
            .filter(item => 
                // Filter out null values and protocols that are not visible
                item.value !== null && 
                item.value !== undefined && 
                (visibleLines[item.key as keyof typeof visibleLines] !== false) // Show if not explicitly set to false
            )
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        return (
            <div className="flex flex-col gap-2 bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <BodyText level='body3' className="text-gray-600">
                    {data.timestamp}
                </BodyText>
                <div className="space-y-1">
                    {sortedProtocols.map(({ key, config, displayValue, isApproximated }) => (
                        <BodyText key={key} level='body3' className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                                {config.label}
                                {/* {isApproximated && (
                                    <span className="text-xs text-muted-foreground ml-1">(approx.)</span>
                                )} */}
                            </div>
                            <span className="font-medium">
                                {displayValue}% APY
                            </span>
                        </BodyText>
                    ))}
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

const CustomYAxisTick = ({
    x,
    y,
    payload,
    index,
    length,
}: TCustomYAxisTickProps) => {
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
}: TCustomXAxisTickProps) => {
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

export function BenchmarkHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const [apiPeriod, setApiPeriod] = useState<Period | 'YEAR'>(Period.oneMonth)
    const [aaveRewardApy, setAaveRewardApy] = useState<number>(0)
    const { selectedChain } = useChain()

    // Get Superfund data
    const { historicalData: superfundData, isLoading: superfundLoading } = useHistoricalData({
        period: apiPeriod === 'YEAR' ? Period.allTime : apiPeriod as Period,
        chain_id: selectedChain
    })

    // Get Aave reward APY
    useEffect(() => {
        fetchRewardApyAaveV3()
            .then((apy) => {
                setAaveRewardApy(apy)
            })
            .catch((error) => {
                console.error('Error fetching Aave reward apy:', error)
            })
    }, [])

    // Get Aave data
    const { data: aaveData, isLoading: isAaveLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS[selectedChain === ChainId.Sonic ? 'SONIC' : 'BASE'].aave,
        period: apiPeriod,
        token: selectedChain === ChainId.Sonic ? SONIC_USDC_ADDRESS : USDC_ADDRESS
    })

    // Get Morpho data for Base chain
    const { data: morphoGauntletPrimeData, isLoading: isMorphoGauntletPrimeLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.morphoGauntletPrime,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    const { data: morphoMoonwellData, isLoading: isMorphoMoonwellLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.morphoMoonwell,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    const { data: morphoGauntletCoreData, isLoading: isMorphoGauntletCoreLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.morphoGauntletCore,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    const { data: morphoSteakhouseData, isLoading: isMorphoSteakhouseLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.morphoSteakhouse,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    const { data: morphoIonicData, isLoading: isMorphoIonicLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.morphoIonic,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    const { data: morphoRe7Data, isLoading: isMorphoRe7Loading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.morphoRe7,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    // Get Fluid data for Base chain
    const { data: fluidData, isLoading: isFluidLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.fluid,
        period: apiPeriod,
        token: USDC_ADDRESS
    });

    const [historicalData, setHistoricalData] = useState<TBenchmarkDataPoint[]>([])
    const prevSuperfundData = useRef<any>(null)
    const prevAaveData = useRef<any>(null)
    const prevMorphoData = useRef<any>({
        morphoGauntletPrime: null,
        morphoMoonwell: null,
        morphoGauntletCore: null,
        morphoSteakhouse: null,
        morphoIonic: null,
        morphoRe7: null
    })

    // Combine data sources
    useEffect(() => {
        // Skip if API is still loading
        if (superfundLoading || isAaveLoading) return;

        // Create maps for faster lookups
        const superfundMap = new Map<number, number>();
        if (superfundData && Array.isArray(superfundData)) {
            superfundData.forEach((item: any) => {
                if (item && item.timestamp && item.totalApy) {
                    superfundMap.set(item.timestamp, item.totalApy);
                }
            });
        }

        const aaveMap = new Map<number, number>();
        if (aaveData?.processMap && Array.isArray(aaveData.processMap)) {
            aaveData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    aaveMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }

        // Create maps for Morpho protocols if on Base chain
        const morphoMaps = {
            fluid: new Map<number, number>(),
            morphoGauntletPrime: new Map<number, number>(),
            morphoMoonwell: new Map<number, number>(),
            morphoGauntletCore: new Map<number, number>(),
            morphoSteakhouse: new Map<number, number>(),
            morphoIonic: new Map<number, number>(),
            morphoRe7: new Map<number, number>()
        };

        if (selectedChain === ChainId.Base) {
            const morphoData = {
                fluid: fluidData,
                morphoGauntletPrime: morphoGauntletPrimeData,
                morphoMoonwell: morphoMoonwellData,
                morphoGauntletCore: morphoGauntletCoreData,
                morphoSteakhouse: morphoSteakhouseData,
                morphoIonic: morphoIonicData,
                morphoRe7: morphoRe7Data
            };

            Object.entries(morphoData).forEach(([key, data]) => {
                if (data?.processMap && Array.isArray(data.processMap)) {
                    data.processMap.forEach((item: any) => {
                        if (item && item.timestamp && item.data && item.data.depositRate) {
                            morphoMaps[key as keyof typeof morphoMaps].set(item.timestamp, item.data.depositRate);
                        }
                    });
                }
            });
        }

        // Get all timestamps
        const superfundTimestamps = Array.from(superfundMap.keys());
        const aaveTimestamps = Array.from(aaveMap.keys());
        const morphoTimestamps = selectedChain === ChainId.Base 
            ? Object.values(morphoMaps).flatMap(map => Array.from(map.keys()))
            : [];

        // Check if timestamps are in different formats (e.g., milliseconds vs seconds)
        const superfundFirstTimestamp = superfundTimestamps[0];
        const aaveFirstTimestamp = aaveTimestamps[0];
        const morphoFirstTimestamp = morphoTimestamps[0];

        // Log timestamp formats
        if (superfundFirstTimestamp && (aaveFirstTimestamp || morphoFirstTimestamp)) {
            // Normalize timestamps to milliseconds if needed
            let normalizedSuperfundTimestamps = superfundTimestamps;
            let normalizedSuperfundMap = superfundMap;
            let normalizedAaveTimestamps = aaveTimestamps;
            let normalizedAaveMap = aaveMap;
            let normalizedMorphoMaps = morphoMaps;

            // Convert seconds to milliseconds if needed
            if (superfundFirstTimestamp.toString().length === 10 && 
                (aaveFirstTimestamp?.toString().length === 13 || morphoFirstTimestamp?.toString().length === 13)) {
                // Superfund in seconds, others in milliseconds
                normalizedSuperfundMap = new Map();
                normalizedSuperfundTimestamps = superfundTimestamps.map(ts => ts * 1000);
                superfundMap.forEach((value, key) => {
                    normalizedSuperfundMap.set(key * 1000, value);
                });
            } else if (superfundFirstTimestamp.toString().length === 13 && 
                      (aaveFirstTimestamp?.toString().length === 10 || morphoFirstTimestamp?.toString().length === 10)) {
                // Superfund in milliseconds, others in seconds
                normalizedAaveMap = new Map();
                normalizedAaveTimestamps = aaveTimestamps.map(ts => ts * 1000);
                aaveMap.forEach((value, key) => {
                    normalizedAaveMap.set(key * 1000, value);
                });

                if (selectedChain === ChainId.Base) {
                    Object.entries(morphoMaps).forEach(([key, map]) => {
                        const normalizedMap = new Map();
                        const timestamps = Array.from(map.keys());
                        timestamps.forEach(ts => {
                            normalizedMap.set(ts * 1000, map.get(ts)!);
                        });
                        normalizedMorphoMaps[key as keyof typeof morphoMaps] = normalizedMap;
                    });
                }
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

            // For each Superfund timestamp, find exact or nearest values for other protocols
            const sortedAaveTimestamps = Array.from(normalizedAaveTimestamps).sort((a, b) => a - b);
            const sortedMorphoTimestamps = selectedChain === ChainId.Base
                ? Object.values(normalizedMorphoMaps).map(map => Array.from(map.keys()).sort((a, b) => a - b))
                : [];

            const combined = normalizedSuperfundTimestamps.map(timestamp => {
                // Get Superfund value
                const superfundValue = normalizedSuperfundMap.get(timestamp);

                // Try exact match for Aave first
                let aaveValue = null;
                let isAaveApproximated = false;
                if (normalizedAaveMap.has(timestamp)) {
                    aaveValue = normalizedAaveMap.get(timestamp);
                } else {
                    // If no exact match, find closest Aave timestamp
                    const closestAaveTimestamp = findClosestTimestamp(timestamp, sortedAaveTimestamps);
                    if (closestAaveTimestamp !== null) {
                        aaveValue = normalizedAaveMap.get(closestAaveTimestamp);
                        isAaveApproximated = true;
                    }
                }

                // For Base chain, get Fluid and Morpho values
                let fluidValue = null;
                let isFluidApproximated = false;
                if (selectedChain === ChainId.Base) {
                    const fluidMap = normalizedMorphoMaps['fluid'];
                    const sortedFluidTimestamps = sortedMorphoTimestamps[0]; // fluid is first in morphoMaps
                    if (fluidMap && fluidMap.has(timestamp)) {
                        fluidValue = fluidMap.get(timestamp);
                        isFluidApproximated = false;
                    } else if (fluidMap) {
                        const closestFluidTimestamp = findClosestTimestamp(timestamp, sortedFluidTimestamps);
                        if (closestFluidTimestamp !== null) {
                            fluidValue = fluidMap.get(closestFluidTimestamp);
                            isFluidApproximated = true;
                        }
                    }
                }

                // For Base chain, get Morpho values
                let morphoValues: any = {};
                if (selectedChain === ChainId.Base) {
                    Object.entries(normalizedMorphoMaps).forEach(([key, map], index) => {
                        if (key === 'fluid') return; // handled above
                        const morphoKey = key as keyof typeof morphoMaps;
                        if (map.has(timestamp)) {
                            morphoValues[morphoKey] = map.get(timestamp);
                            morphoValues[`is${morphoKey.charAt(0).toUpperCase() + morphoKey.slice(1)}Approximated`] = false;
                        } else {
                            const closestMorphoTimestamp = findClosestTimestamp(timestamp, sortedMorphoTimestamps[index]);
                            if (closestMorphoTimestamp !== null) {
                                morphoValues[morphoKey] = map.get(closestMorphoTimestamp);
                                morphoValues[`is${morphoKey.charAt(0).toUpperCase() + morphoKey.slice(1)}Approximated`] = true;
                            } else {
                                morphoValues[morphoKey] = null;
                                morphoValues[`is${morphoKey.charAt(0).toUpperCase() + morphoKey.slice(1)}Approximated`] = false;
                            }
                        }
                    });
                }

                return {
                    timestamp,
                    superfund: superfundValue as number,
                    aave: aaveValue,
                    isAaveApproximated,
                    fluid: fluidValue,
                    isFluidApproximated,
                    ...morphoValues
                };
            });

            setHistoricalData(
              combined.filter(d =>
                d.aave !== null ||
                d.fluid !== null ||
                d.morphoGauntletPrime !== null ||
                d.morphoMoonwell !== null ||
                d.morphoGauntletCore !== null ||
                d.morphoSteakhouse !== null ||
                d.morphoIonic !== null ||
                d.morphoRe7 !== null
              ) as TBenchmarkDataPoint[]
            );
        } else {
            console.log('Missing timestamp data in one or both datasets');
            setHistoricalData([]);
        }

        // Update refs
        prevSuperfundData.current = superfundData;
        prevAaveData.current = aaveData;
        if (selectedChain === ChainId.Base) {
            prevMorphoData.current = {
                morphoGauntletPrime: morphoGauntletPrimeData,
                morphoMoonwell: morphoMoonwellData,
                morphoGauntletCore: morphoGauntletCoreData,
                morphoSteakhouse: morphoSteakhouseData,
                morphoIonic: morphoIonicData,
                morphoRe7: morphoRe7Data
            };
        }

    }, [
        superfundData,
        aaveData,
        morphoGauntletPrimeData,
        morphoMoonwellData,
        morphoGauntletCoreData,
        morphoSteakhouseData,
        morphoIonicData,
        morphoRe7Data,
        superfundLoading,
        isAaveLoading,
        selectedChain,
        fluidData
    ]);

    const chartData = useMemo(() => {
        if (!historicalData) return []

        return historicalData.map((item: TBenchmarkDataPoint) => {
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

            const formattedItem: TFormattedBenchmarkDataPoint = {
                rawTimestamp: item.timestamp,
                xValue: item.timestamp,
                date: formattedDate.split(',')[0],
                monthDay,
                timestamp: `${formattedDate} ${time}`,
                timeValue: time,
                superfund: item.superfund ?? null,
                aave: selectedChain === ChainId.Sonic ? ((item.aave ?? 0) + aaveRewardApy) : (item.aave ?? null),
                isAaveApproximated: item.isAaveApproximated || false,
                superfundDisplay: abbreviateNumber(item.superfund ?? 0),
                aaveDisplay: abbreviateNumber(selectedChain === ChainId.Sonic ? ((item.aave ?? 0) + aaveRewardApy) : (item.aave ?? 0)),
                fluid: item.fluid ?? null,
                isFluidApproximated: item.isFluidApproximated || false,
                fluidDisplay: abbreviateNumber(item.fluid ?? 0),
            } as TFormattedBenchmarkDataPoint;

            // Add Morpho data for Base chain
            if (selectedChain === ChainId.Base) {
                const morphoKeys = [
                    'morphoGauntletPrime',
                    'morphoMoonwell',
                    'morphoGauntletCore',
                    'morphoSteakhouse',
                    'morphoIonic',
                    'morphoRe7'
                ];

                morphoKeys.forEach(key => {
                    const value = item[key as keyof TBenchmarkDataPoint];
                    const isApproximated = item[`is${key.charAt(0).toUpperCase() + key.slice(1)}Approximated` as keyof TBenchmarkDataPoint];
                    
                    if (value !== null && value !== undefined) {
                        (formattedItem as any)[key] = value;
                        (formattedItem as any)[`${key}Display`] = abbreviateNumber(value as number);
                        (formattedItem as any)[`is${key.charAt(0).toUpperCase() + key.slice(1)}Approximated`] = isApproximated || false;
                    }
                });
            }

            return formattedItem;
        }).sort((a: TFormattedBenchmarkDataPoint, b: TFormattedBenchmarkDataPoint) => a.rawTimestamp - b.rawTimestamp);
    }, [historicalData, aaveRewardApy, selectedChain]);

    const { minValue, maxValue, valueRange } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return {
                minValue: 0,
                maxValue: 10,
                valueRange: 10
            };
        }

        const allValues = chartData.flatMap((d: TFormattedBenchmarkDataPoint) => {
            const values = [Number(d.superfund), Number(d.aave)];
            if (selectedChain === ChainId.Base) {
                values.push(
                    Number(d.morphoGauntletPrime),
                    Number(d.morphoMoonwell),
                    Number(d.morphoGauntletCore),
                    Number(d.morphoSteakhouse),
                    Number(d.morphoIonic),
                    Number(d.morphoRe7)
                );
            }
            return values.filter(v => !isNaN(v));
        });

        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        return {
            minValue: min,
            maxValue: max,
            valueRange: max - min
        };
    }, [chartData, selectedChain]);

    const yAxisDomain = useMemo(() => {
        // Calculate a minimum y-axis value that's proportionally lower than the minimum value
        // This ensures the lines appear more centered vertically
        const padding = valueRange * 0.5; // Adjust this factor to control vertical positioning
        const minYValue = Math.max(0, minValue - padding); // Ensure we don't go below 0 for APY values
        const maxYValue = maxValue + (valueRange * 0.1);
        return [minYValue, maxYValue] as [number, number];
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

    // Legend toggle state
    const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
        superfund: true,
        aave: true,
        fluid: true,
        morphoGauntletPrime: true,
        morphoMoonwell: true,
        morphoGauntletCore: true,
        morphoSteakhouse: true,
        morphoIonic: true,
        morphoRe7: true,
    });

    // Helper for legend toggle
    const handleLegendToggle = (key: keyof typeof CHART_CONFIG) => {
        setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Custom legend component
    const CustomLegend = () => {
        // Determine which protocols to show based on selectedChain
        const filteredEntries = Object.entries(CHART_CONFIG).filter(([key]) => {
            if (key === 'superfund' || key === 'aave') {
                // Always show superfund and aave for both chains
                return true;
            } else {
                // Show other protocols only for Base chain
                return selectedChain === ChainId.Base;
            }
        }) as [keyof typeof CHART_CONFIG, typeof CHART_CONFIG[keyof typeof CHART_CONFIG]][];

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
                {filteredEntries.map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => handleLegendToggle(key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: visibleLines[key] ? 1 : 0.4,
                            fontWeight: visibleLines[key] ? 600 : 400,
                            fontSize: 15,
                            padding: 0,
                        }}
                    >
                        <span style={{
                            width: 16,
                            height: 6,
                            borderRadius: 3,
                            background: config.color,
                            display: 'inline-block',
                            marginRight: 4,
                            border: visibleLines[key] ? '2px solid #222' : '2px solid #ccc',
                            transition: 'border 0.2s',
                        }} />
                        {config.label}
                    </button>
                ))}
            </div>
        );
    };

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
                <div className="px-6 pt-2">
                    <CustomLegend />
                </div>
                {/* <div className={`h-[${false ? '500px' : '350px'}] bg-white rounded-4`}> */}
                <ChartContainer
                    config={CHART_CONFIG}
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
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const formattedPayload = payload.map(item => ({
                                                payload: item.payload as TFormattedBenchmarkDataPoint
                                            }));
                                            return <CustomTooltip active={active} payload={formattedPayload} visibleLines={visibleLines} />;
                                        }}
                                        cursor={{ stroke: 'hsl(var(--foreground-disabled))', strokeWidth: 1 }}
                                    />
                                    {visibleLines.superfund && (
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
                                    )}
                                    {visibleLines.aave && (
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
                                    )}
                                    {visibleLines.fluid && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="fluid"
                                            type="monotone"
                                            stroke="#00C853"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoGauntletPrime && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="morphoGauntletPrime"
                                            type="monotone"
                                            stroke="var(--color-morphoGauntletPrime)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoMoonwell && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="morphoMoonwell"
                                            type="monotone"
                                            stroke="var(--color-morphoMoonwell)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoGauntletCore && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="morphoGauntletCore"
                                            type="monotone"
                                            stroke="var(--color-morphoGauntletCore)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoSteakhouse && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="morphoSteakhouse"
                                            type="monotone"
                                            stroke="var(--color-morphoSteakhouse)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoIonic && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="morphoIonic"
                                            type="monotone"
                                            stroke="var(--color-morphoIonic)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoRe7 && selectedChain === ChainId.Base && (
                                        <Line
                                            dataKey="morphoRe7"
                                            type="monotone"
                                            stroke="var(--color-morphoRe7)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
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
                                            {visibleLines.superfund && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="superfund"
                                                    stroke="var(--color-superfund)"
                                                    strokeWidth={1}
                                                    fill="rgba(251, 89, 0, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.aave && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="aave"
                                                    stroke="var(--color-aave)"
                                                    strokeWidth={1}
                                                    fill="rgba(30, 144, 255, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.fluid && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="fluid"
                                                    stroke="#00C853"
                                                    strokeWidth={1}
                                                    fill="rgba(0, 200, 83, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoGauntletPrime && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoGauntletPrime"
                                                    stroke="var(--color-morphoGauntletPrime)"
                                                    strokeWidth={1}
                                                    fill="rgba(255, 107, 107, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoMoonwell && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoMoonwell"
                                                    stroke="var(--color-morphoMoonwell)"
                                                    strokeWidth={1}
                                                    fill="rgba(78, 205, 196, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoGauntletCore && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoGauntletCore"
                                                    stroke="var(--color-morphoGauntletCore)"
                                                    strokeWidth={1}
                                                    fill="rgba(69, 183, 209, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoSteakhouse && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoSteakhouse"
                                                    stroke="var(--color-morphoSteakhouse)"
                                                    strokeWidth={1}
                                                    fill="rgba(150, 206, 180, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoIonic && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoIonic"
                                                    stroke="var(--color-morphoIonic)"
                                                    strokeWidth={1}
                                                    fill="rgba(255, 238, 173, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoRe7 && selectedChain === ChainId.Base && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoRe7"
                                                    stroke="var(--color-morphoRe7)"
                                                    strokeWidth={1}
                                                    fill="rgba(212, 165, 165, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
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
