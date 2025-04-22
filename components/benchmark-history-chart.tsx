'use client'

import { Card } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Area,
    AreaChart,
    Brush,
    CartesianGrid,
    Legend,
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
        const isAaveApproximated = payload[0]?.payload.isAaveApproximated;
        const isFluidApproximated = payload[0]?.payload.isFluidApproximated;

        // Create an array of all protocols with their data
        const protocols = [
            {
                name: 'Superfund',
                color: '#fb5900',
                value: Number(payload[0]?.payload.superfund || 0),
                display: payload[0]?.payload.superfundDisplay || '0.00'
            },
            {
                name: 'Aave',
                color: '#1E90FF',
                value: Number(payload[0]?.payload.aave || 0),
                display: payload[0]?.payload.aaveDisplay || '0.00'
            },
            {
                name: 'Fluid',
                color: '#00C853',
                value: Number(payload[0]?.payload.fluid || 0),
                display: payload[0]?.payload.fluidDisplay || '0.00'
            },
            {
                name: 'Morpho G. Prime',
                color: '#9C27B0',
                value: Number(payload[0]?.payload.morphoGauntletPrime || 0),
                display: payload[0]?.payload.morphoGauntletPrimeDisplay || '0.00'
            },
            {
                name: 'Morpho Moonwell',
                color: '#673AB7',
                value: Number(payload[0]?.payload.morphoMoonwell || 0),
                display: payload[0]?.payload.morphoMoonwellDisplay || '0.00'
            },
            {
                name: 'Morpho G. Core',
                color: '#3F51B5',
                value: Number(payload[0]?.payload.morphoGauntletCore || 0),
                display: payload[0]?.payload.morphoGauntletCoreDisplay || '0.00'
            },
            {
                name: 'Morpho Steakhouse',
                color: '#FF5722',
                value: Number(payload[0]?.payload.morphoSteakhouse || 0),
                display: payload[0]?.payload.morphoSteakhouseDisplay || '0.00'
            },
            {
                name: 'Morpho Ionic',
                color: '#607D8B',
                value: Number(payload[0]?.payload.morphoIonic || 0),
                display: payload[0]?.payload.morphoIonicDisplay || '0.00'
            },
            {
                name: 'Morpho Re7',
                color: '#795548',
                value: Number(payload[0]?.payload.morphoRe7 || 0),
                display: payload[0]?.payload.morphoRe7Display || '0.00'
            }
        ];

        // Sort protocols by value (highest to lowest)
        const sortedProtocols = protocols.sort((a, b) => b.value - a.value);

        return (
            <div className="flex flex-col gap-2 bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <BodyText level='body3' className="text-gray-600">
                    {payload[0]?.payload.timestamp || ''}
                </BodyText>
                <div className="space-y-1">
                    {sortedProtocols.map((protocol, index) => (
                        <BodyText key={index} level='body3' className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: protocol.color }} />
                                {protocol.name}:
                            </div>
                            <span className="font-medium">
                                {protocol.display}%
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
    
    :root {
        --color-superfund: #fb5900;
        --color-aave: #1E90FF; 
        --color-fluid: #00C853;
        --color-morphoGauntletPrime: #9C27B0;
        --color-morphoMoonwell: #673AB7;
        --color-morphoGauntletCore: #3F51B5;
        --color-morphoSteakhouse: #2D3564;
        --color-morphoIonic: #607D8B;
        --color-morphoRe7: #795548;
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
    },
    fluid: {
        label: 'Fluid',
        color: '#00C853',
    },
    morphoGauntletPrime: {
        label: 'Morpho Gauntlet Prime',
        color: '#9C27B0',
    },
    morphoMoonwell: {
        label: 'Morpho Moonwell',
        color: '#673AB7',
    },
    morphoGauntletCore: {
        label: 'Morpho Gauntlet Core',
        color: '#3F51B5',
    },
    morphoSteakhouse: {
        label: 'Morpho Steakhouse',
        color: '#FF5722',
    },
    morphoIonic: {
        label: 'Morpho Ionic',
        color: '#607D8B',
    },
    morphoRe7: {
        label: 'Morpho Re7',
        color: '#795548',
    }
} satisfies ChartConfig

// Update the renderCustomizedLegend function to fix the visibility issue
const renderCustomizedLegend = (props: any, visibleLines: { [key: string]: boolean }, onClick: (dataKey: string) => void) => {
    const { payload } = props;

    // Map of dataKey to display name
    const nameMap: Record<string, string> = {
        superfund: "SuperFund",
        aave: "Aave",
        fluid: "Fluid",
        morphoGauntletPrime: "Morpho Gauntlet Prime",
        morphoMoonwell: "Morpho Moonwell",
        morphoGauntletCore: "Morpho Gauntlet Core",
        morphoSteakhouse: "Morpho Steakhouse",
        morphoIonic: "Morpho Ionic",
        morphoRe7: "Morpho Re7"
    };

    // List of all dataKeys in the order we want them displayed
    const orderedKeys = [
        "superfund", "aave", "fluid",
        "morphoGauntletPrime", "morphoMoonwell", "morphoGauntletCore",
        "morphoSteakhouse", "morphoIonic", "morphoRe7"
    ];

    // Color map for each key
    const colorMap: Record<string, string> = {
        superfund: "var(--color-superfund)",
        aave: "var(--color-aave)",
        fluid: "var(--color-fluid)",
        morphoGauntletPrime: "var(--color-morphoGauntletPrime)",
        morphoMoonwell: "var(--color-morphoMoonwell)",
        morphoGauntletCore: "var(--color-morphoGauntletCore)",
        morphoSteakhouse: "var(--color-morphoSteakhouse)",
        morphoIonic: "var(--color-morphoIonic)",
        morphoRe7: "var(--color-morphoRe7)"
    };

    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 pt-2 pb-1">
            {orderedKeys.map((dataKey, index) => {
                const isVisible = visibleLines[dataKey];
                return (
                    <div
                        key={`legend-item-${index}`}
                        className="flex items-center cursor-pointer transition-all duration-150 mx-2"
                        style={{ opacity: isVisible ? 1 : 0.4 }}
                        onClick={() => onClick(dataKey)}
                    >
                        <div
                            className="w-3 h-3 rounded-full mr-1.5"
                            style={{ backgroundColor: colorMap[dataKey] }}
                        />
                        <span className="text-xs font-medium">{nameMap[dataKey]}</span>
                    </div>
                );
            })}
        </div>
    );
};

export function BenchmarkHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const [apiPeriod, setApiPeriod] = useState<Period | 'YEAR'>(Period.oneMonth)
    const { historicalData: SuperfundHistoryData, isLoading: isSuperfundLoading } = useHistoricalData(selectedRange)
    const { data: AaveHistoryData, isLoading: isAaveLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0x8ef0fa7f46a36d852953f0b6ea02f9a92a8a2b1b9a39f38654bee0792c4b4304',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: FluidHistoryData, isLoading: isFluidLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0xfce6a6b40d1d1f1158b5ce2f4f983ee3b6c1883f8cbdb11d6ff2cb04755eccdd',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: MorphoGauntletPrimeHistoryData, isLoading: isMorphoGauntletPrimeLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0x516b4912495a3aa0071acefe8f6f6444393c85cd3219b5af3a8acd54cb30c018',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: MorphoMoonwellHistoryData, isLoading: isMorphoMoonwellLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0x85f993c2d2706818124616951e2c98f6ed174568141316cc20f8f0c17103c01c',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: MorphoGauntletCoreHistoryData, isLoading: isMorphoGauntletCoreLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0x16bbde3bc6fc2247f0734b88d14fea971ec5c222caeb3a868e06b7b58d748ef2',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: MorphoSteakhouseHistoryData, isLoading: isMorphoSteakhouseLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0xd54545c6103cd824ef74d3c7f9c9e42393521aa093aac66c6714de2201d2757e',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: MorphoIonicHistoryData, isLoading: isMorphoIonicLoading } = useGetBenchmarkHistory({
        protocol_identifier: '0x0acac7b189a953d42bb4af2a7147328c3dc5fc8b2949f590ecad2bc1b4da23af',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const { data: MorphoRe7HistoryData, isLoading: isMorphoRe7Loading } = useGetBenchmarkHistory({
        protocol_identifier: '0x4c3ee701174bb8e3b83a219bbfd4bb4782ac0c4569a89acb1c23563a26b42312',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        period: apiPeriod,
    })
    const [historicalData, setHistoricalData] = useState<Array<{ timestamp: number; aave: number; superfund: number }>>([])

    // New approach - use domain values for zoom
    const [isProcessing, setIsProcessing] = useState(false)
    const prevSuperfundData = useRef<any>(null);
    const prevAaveData = useRef<any>(null);
    const prevFluidData = useRef<any>(null);
    const prevMorphoData = useRef<any>({
        gauntletPrime: null,
        moonwell: null,
        gauntletCore: null,
        steakhouse: null,
        ionic: null,
        re7: null
    });

    // New state to track visible protocols
    const [visibleLines, setVisibleLines] = useState<{ [key: string]: boolean }>({
        superfund: true,
        aave: true,
        fluid: true,
        morphoGauntletPrime: true,
        morphoMoonwell: true,
        morphoGauntletCore: true,
        morphoSteakhouse: true,
        morphoIonic: true,
        morphoRe7: true
    });

    // Update legend click handler to be simpler
    const handleLegendClick = useCallback((dataKey: string) => {
        setVisibleLines(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey]
        }));
    }, []);

    // Determine if we're loading data
    const isLoading = isSuperfundLoading || isAaveLoading || isFluidLoading ||
        isMorphoGauntletPrimeLoading || isMorphoMoonwellLoading || isMorphoGauntletCoreLoading ||
        isMorphoSteakhouseLoading || isMorphoIonicLoading || isMorphoRe7Loading;

    // Reset zoom when period changes
    useEffect(() => {
        // No longer needed as we're using default zoom behavior
    }, [selectedRange]);

    // Combine both data sources
    useEffect(() => {
        // Skip if API is still loading
        if (isSuperfundLoading || isAaveLoading) return;

        console.log('API data loaded, processing...');
        console.log('Data available:',
            'Superfund:', SuperfundHistoryData?.length,
            'Aave:', AaveHistoryData?.processMap?.length,
            'Fluid:', FluidHistoryData?.processMap?.length,
            'Morpho G. Prime:', MorphoGauntletPrimeHistoryData?.processMap?.length,
            'Morpho Moonwell:', MorphoMoonwellHistoryData?.processMap?.length,
            'Morpho G. Core:', MorphoGauntletCoreHistoryData?.processMap?.length,
            'Morpho Steakhouse:', MorphoSteakhouseHistoryData?.processMap?.length,
            'Morpho Ionic:', MorphoIonicHistoryData?.processMap?.length,
            'Morpho Re7:', MorphoRe7HistoryData?.processMap?.length
        );

        // Check if we have at least Superfund dataset
        if (!SuperfundHistoryData) {
            console.log('Superfund dataset missing');
            return;
        }

        // Process the data regardless of reference equality
        setIsProcessing(true);

        // Create maps for faster lookups
        const superfundMap = new Map<number, number>();
        if (SuperfundHistoryData && Array.isArray(SuperfundHistoryData)) {
            SuperfundHistoryData.forEach((item: any) => {
                if (item && item.timestamp && item.totalApy) {
                    superfundMap.set(item.timestamp, item.totalApy);
                }
            });
        }
        console.log('Superfund map size:', superfundMap.size);

        const aaveMap = new Map<number, number>();
        if (AaveHistoryData?.processMap && Array.isArray(AaveHistoryData.processMap)) {
            AaveHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    aaveMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Aave map size:', aaveMap.size);

        const fluidMap = new Map<number, number>();
        if (FluidHistoryData?.processMap && Array.isArray(FluidHistoryData.processMap)) {
            FluidHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    fluidMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Fluid map size:', fluidMap.size);

        const morphoGauntletPrimeMap = new Map<number, number>();
        if (MorphoGauntletPrimeHistoryData?.processMap && Array.isArray(MorphoGauntletPrimeHistoryData.processMap)) {
            MorphoGauntletPrimeHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    morphoGauntletPrimeMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Morpho Gauntlet Prime map size:', morphoGauntletPrimeMap.size);

        const morphoMoonwellMap = new Map<number, number>();
        if (MorphoMoonwellHistoryData?.processMap && Array.isArray(MorphoMoonwellHistoryData.processMap)) {
            MorphoMoonwellHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    morphoMoonwellMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Morpho Moonwell map size:', morphoMoonwellMap.size);

        const morphoGauntletCoreMap = new Map<number, number>();
        if (MorphoGauntletCoreHistoryData?.processMap && Array.isArray(MorphoGauntletCoreHistoryData.processMap)) {
            MorphoGauntletCoreHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    morphoGauntletCoreMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Morpho Gauntlet Core map size:', morphoGauntletCoreMap.size);

        const morphoSteakhouseMap = new Map<number, number>();
        if (MorphoSteakhouseHistoryData?.processMap && Array.isArray(MorphoSteakhouseHistoryData.processMap)) {
            MorphoSteakhouseHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    morphoSteakhouseMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Morpho Steakhouse map size:', morphoSteakhouseMap.size);

        const morphoIonicMap = new Map<number, number>();
        if (MorphoIonicHistoryData?.processMap && Array.isArray(MorphoIonicHistoryData.processMap)) {
            MorphoIonicHistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    morphoIonicMap.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Morpho Ionic map size:', morphoIonicMap.size);

        const morphoRe7Map = new Map<number, number>();
        if (MorphoRe7HistoryData?.processMap && Array.isArray(MorphoRe7HistoryData.processMap)) {
            MorphoRe7HistoryData.processMap.forEach((item: any) => {
                if (item && item.timestamp && item.data && item.data.depositRate) {
                    morphoRe7Map.set(item.timestamp, item.data.depositRate);
                }
            });
        }
        console.log('Morpho Re7 map size:', morphoRe7Map.size);

        // Get all timestamps
        const superfundTimestamps = Array.from(superfundMap.keys());
        const aaveTimestamps = Array.from(aaveMap.keys());
        const fluidTimestamps = Array.from(fluidMap.keys());
        const morphoGauntletPrimeTimestamps = Array.from(morphoGauntletPrimeMap.keys());
        const morphoMoonwellTimestamps = Array.from(morphoMoonwellMap.keys());
        const morphoGauntletCoreTimestamps = Array.from(morphoGauntletCoreMap.keys());
        const morphoSteakhouseTimestamps = Array.from(morphoSteakhouseMap.keys());
        const morphoIonicTimestamps = Array.from(morphoIonicMap.keys());
        const morphoRe7Timestamps = Array.from(morphoRe7Map.keys());

        console.log('Attempting to find timestamp matches between datasets');

        // Declare normalized maps and timestamps variables at a higher scope
        let normalizedSuperfundTimestamps = superfundTimestamps;
        let normalizedSuperfundMap = superfundMap;
        let normalizedAaveTimestamps = aaveTimestamps;
        let normalizedAaveMap = aaveMap;
        let normalizedFluidTimestamps = fluidTimestamps;
        let normalizedFluidMap = fluidMap;
        let normalizedMorphoGauntletPrimeTimestamps = morphoGauntletPrimeTimestamps;
        let normalizedMorphoGauntletPrimeMap = morphoGauntletPrimeMap;
        let normalizedMorphoMoonwellTimestamps = morphoMoonwellTimestamps;
        let normalizedMorphoMoonwellMap = morphoMoonwellMap;
        let normalizedMorphoGauntletCoreTimestamps = morphoGauntletCoreTimestamps;
        let normalizedMorphoGauntletCoreMap = morphoGauntletCoreMap;
        let normalizedMorphoSteakhouseTimestamps = morphoSteakhouseTimestamps;
        let normalizedMorphoSteakhouseMap = morphoSteakhouseMap;
        let normalizedMorphoIonicTimestamps = morphoIonicTimestamps;
        let normalizedMorphoIonicMap = morphoIonicMap;
        let normalizedMorphoRe7Timestamps = morphoRe7Timestamps;
        let normalizedMorphoRe7Map = morphoRe7Map;

        // Check if timestamps are in different formats (e.g., milliseconds vs seconds)
        const superfundFirstTimestamp = superfundTimestamps[0];
        const aaveFirstTimestamp = aaveTimestamps[0];
        const fluidFirstTimestamp = fluidTimestamps[0];

        // Log timestamp formats
        if (superfundFirstTimestamp && aaveFirstTimestamp && fluidFirstTimestamp) {
            console.log('Timestamp format check:', {
                superfundTimestamp: superfundFirstTimestamp,
                superfundDigits: superfundFirstTimestamp.toString().length,
                aaveTimestamp: aaveFirstTimestamp,
                aaveDigits: aaveFirstTimestamp.toString().length,
                fluidTimestamp: fluidFirstTimestamp,
                fluidDigits: fluidFirstTimestamp.toString().length
            });

            // Convert seconds to milliseconds if needed
            if (superfundFirstTimestamp.toString().length === 10 && aaveFirstTimestamp.toString().length === 13) {
                // Superfund in seconds, Aave in milliseconds
                normalizedSuperfundMap = new Map();
                normalizedSuperfundTimestamps = superfundTimestamps.map(ts => ts * 1000);
                superfundMap.forEach((value, key) => {
                    normalizedSuperfundMap.set(key * 1000, value);
                });
                console.log('Normalized: Superfund seconds -> milliseconds');

                // Print sample of normalized map for debugging
                const superfundMapEntries = Array.from(normalizedSuperfundMap.entries()).slice(0, 3);
                console.log('Normalized Superfund map sample:', superfundMapEntries);
                console.log('Original vs Normalized sizes:', superfundMap.size, normalizedSuperfundMap.size);
            } else if (superfundFirstTimestamp.toString().length === 13 && aaveFirstTimestamp.toString().length === 10) {
                // Superfund in milliseconds, Aave in seconds
                normalizedAaveMap = new Map();
                normalizedAaveTimestamps = aaveTimestamps.map(ts => ts * 1000);
                aaveMap.forEach((value, key) => {
                    normalizedAaveMap.set(key * 1000, value);
                });

                normalizedFluidMap = new Map();
                normalizedFluidTimestamps = fluidTimestamps.map(ts => ts * 1000);
                fluidMap.forEach((value, key) => {
                    normalizedFluidMap.set(key * 1000, value);
                });

                // Also normalize Morpho data
                normalizedMorphoGauntletPrimeMap = new Map();
                normalizedMorphoGauntletPrimeTimestamps = morphoGauntletPrimeTimestamps.map(ts => ts * 1000);
                morphoGauntletPrimeMap.forEach((value, key) => {
                    normalizedMorphoGauntletPrimeMap.set(key * 1000, value);
                });

                normalizedMorphoMoonwellMap = new Map();
                normalizedMorphoMoonwellTimestamps = morphoMoonwellTimestamps.map(ts => ts * 1000);
                morphoMoonwellMap.forEach((value, key) => {
                    normalizedMorphoMoonwellMap.set(key * 1000, value);
                });

                normalizedMorphoGauntletCoreMap = new Map();
                normalizedMorphoGauntletCoreTimestamps = morphoGauntletCoreTimestamps.map(ts => ts * 1000);
                morphoGauntletCoreMap.forEach((value, key) => {
                    normalizedMorphoGauntletCoreMap.set(key * 1000, value);
                });

                normalizedMorphoSteakhouseMap = new Map();
                normalizedMorphoSteakhouseTimestamps = morphoSteakhouseTimestamps.map(ts => ts * 1000);
                morphoSteakhouseMap.forEach((value, key) => {
                    normalizedMorphoSteakhouseMap.set(key * 1000, value);
                });

                normalizedMorphoIonicMap = new Map();
                normalizedMorphoIonicTimestamps = morphoIonicTimestamps.map(ts => ts * 1000);
                morphoIonicMap.forEach((value, key) => {
                    normalizedMorphoIonicMap.set(key * 1000, value);
                });

                normalizedMorphoRe7Map = new Map();
                normalizedMorphoRe7Timestamps = morphoRe7Timestamps.map(ts => ts * 1000);
                morphoRe7Map.forEach((value, key) => {
                    normalizedMorphoRe7Map.set(key * 1000, value);
                });

                console.log('Normalized: Aave, Fluid and Morpho seconds -> milliseconds');
            }

            // NEW APPROACH: Superfund leads, prioritize all Superfund data points
            // Use normalized timestamps instead of original timestamps
            const timestampsToUse = superfundFirstTimestamp.toString().length === 10 && aaveFirstTimestamp.toString().length === 13
                ? normalizedSuperfundTimestamps
                : superfundTimestamps;

            console.log('Using Superfund-led approach with', timestampsToUse.length, 'data points');

            // Helper function to find closest timestamp in a set
            const findClosestTimestamp = (target: number, timestamps: number[]): number | null => {
                if (timestamps.length === 0) return null;

                // Return exact matches immediately
                const exactMatch = timestamps.find(ts => ts === target);
                if (exactMatch !== undefined) {
                    console.log(`Found exact match for ${target}`);
                    return exactMatch;
                }

                // Check if we need to normalize the target (depends on which is in seconds vs milliseconds)
                let normalizedTarget = target;
                const targetLength = target.toString().length;
                const timestampLength = timestamps[0]?.toString().length;

                // If formats are different, normalize target to match timestamps
                if (targetLength === 10 && timestampLength === 13) {
                    // Target in seconds, timestamps in milliseconds
                    normalizedTarget = target * 1000;
                    console.log(`Normalized target from ${target} to ${normalizedTarget} for comparison`);
                } else if (targetLength === 13 && timestampLength === 10) {
                    // Target in milliseconds, timestamps in seconds
                    normalizedTarget = Math.floor(target / 1000);
                    console.log(`Normalized target from ${target} to ${normalizedTarget} for comparison`);
                }

                // Find the closest timestamp
                let closest = timestamps[0];
                let minDistance = Math.abs(normalizedTarget - closest);

                for (let i = 1; i < timestamps.length; i++) {
                    const distance = Math.abs(normalizedTarget - timestamps[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closest = timestamps[i];
                    }
                }

                // Only return if within reasonable time range (24 hours)
                // Use an appropriate max distance based on the time format
                const maxDistance = timestampLength === 13 ? 24 * 60 * 60 * 1000 : 24 * 60 * 60;

                console.log(`Closest match for ${target} -> ${normalizedTarget}: ${closest}, distance: ${minDistance}, max allowed: ${maxDistance}`);

                return minDistance <= maxDistance ? closest : null;
            };

            // Sort timestamps chronologically
            timestampsToUse.sort((a, b) => a - b);

            // For each Superfund timestamp, find exact or nearest Aave value
            const sortedAaveTimestamps = Array.from(normalizedAaveTimestamps).sort((a: number, b: number) => a - b);
            const sortedFluidTimestamps = Array.from(normalizedFluidTimestamps).sort((a: number, b: number) => a - b);
            const sortedMorphoGauntletPrimeTimestamps = Array.from(normalizedMorphoGauntletPrimeTimestamps).sort((a: number, b: number) => a - b);
            const sortedMorphoMoonwellTimestamps = Array.from(normalizedMorphoMoonwellTimestamps).sort((a: number, b: number) => a - b);
            const sortedMorphoGauntletCoreTimestamps = Array.from(normalizedMorphoGauntletCoreTimestamps).sort((a: number, b: number) => a - b);
            const sortedMorphoSteakhouseTimestamps = Array.from(normalizedMorphoSteakhouseTimestamps).sort((a: number, b: number) => a - b);
            const sortedMorphoIonicTimestamps = Array.from(normalizedMorphoIonicTimestamps).sort((a: number, b: number) => a - b);
            const sortedMorphoRe7Timestamps = Array.from(normalizedMorphoRe7Timestamps).sort((a: number, b: number) => a - b);

            // Determine if we should compare in seconds or milliseconds
            const usingMilliseconds = true; // Always use milliseconds for consistency
            console.log('Using timestamp format:', usingMilliseconds ? 'milliseconds' : 'seconds');

            const combined = timestampsToUse.map(timestamp => {
                // Get Superfund value - use the appropriate map based on normalization
                const superfundValue = superfundFirstTimestamp.toString().length === 10 && aaveFirstTimestamp.toString().length === 13
                    ? normalizedSuperfundMap.get(timestamp)
                    : superfundMap.get(timestamp);

                // Debug single timestamp matching
                if (timestamp === timestampsToUse[0]) {
                    console.log('First Superfund timestamp:', timestamp);
                    console.log('First 3 Aave timestamps:', sortedAaveTimestamps.slice(0, 3));
                    console.log('First 3 Fluid timestamps:', sortedFluidTimestamps.slice(0, 3));
                }

                // Try exact match for Aave first
                let aaveValue = normalizedAaveMap.get(timestamp);
                let fluidValue = normalizedFluidMap.get(timestamp);
                let morphoGauntletPrimeValue = normalizedMorphoGauntletPrimeMap.get(timestamp);
                let morphoMoonwellValue = normalizedMorphoMoonwellMap.get(timestamp);
                let morphoGauntletCoreValue = normalizedMorphoGauntletCoreMap.get(timestamp);
                let morphoSteakhouseValue = normalizedMorphoSteakhouseMap.get(timestamp);
                let morphoIonicValue = normalizedMorphoIonicMap.get(timestamp);
                let morphoRe7Value = normalizedMorphoRe7Map.get(timestamp);

                let isAaveApproximated = false;
                let isFluidApproximated = false;
                let isMorphoGauntletPrimeApproximated = false;
                let isMorphoMoonwellApproximated = false;
                let isMorphoGauntletCoreApproximated = false;
                let isMorphoSteakhouseApproximated = false;
                let isMorphoIonicApproximated = false;
                let isMorphoRe7Approximated = false;

                // Debug if a specific timestamp is giving us issues
                if (timestamp === timestampsToUse[0]) {
                    console.log("Debug - timestamp values:", {
                        timestamp,
                        hasAaveDirectMatch: aaveValue !== undefined,
                        hasFluidDirectMatch: fluidValue !== undefined,
                        aaveMapSize: normalizedAaveMap.size,
                        fluidMapSize: normalizedFluidMap.size
                    });
                }

                // If no exact match, find closest timestamp
                if (aaveValue === undefined) {
                    const closestAaveTimestamp = findClosestTimestamp(timestamp, sortedAaveTimestamps as number[]);
                    if (closestAaveTimestamp !== null) {
                        aaveValue = normalizedAaveMap.get(closestAaveTimestamp);
                        isAaveApproximated = true;
                        // Debug first instance for troubleshooting
                        if (timestamp === timestampsToUse[0]) {
                            console.log("Found closest Aave timestamp:", {
                                original: timestamp,
                                closest: closestAaveTimestamp,
                                value: aaveValue,
                                timeFormat: new Date(closestAaveTimestamp).toISOString()
                            });
                        }
                    } else if (timestamp === timestampsToUse[0]) {
                        console.log("No close Aave match found for timestamp:", timestamp);
                    }
                }

                if (fluidValue === undefined) {
                    const closestFluidTimestamp = findClosestTimestamp(timestamp, sortedFluidTimestamps as number[]);
                    if (closestFluidTimestamp !== null) {
                        fluidValue = normalizedFluidMap.get(closestFluidTimestamp);
                        isFluidApproximated = true;
                    }
                }

                // Look for closest Morpho timestamps
                if (morphoGauntletPrimeValue === undefined) {
                    const closestTimestamp = findClosestTimestamp(timestamp, sortedMorphoGauntletPrimeTimestamps as number[]);
                    if (closestTimestamp !== null) {
                        morphoGauntletPrimeValue = normalizedMorphoGauntletPrimeMap.get(closestTimestamp);
                        isMorphoGauntletPrimeApproximated = true;
                    }
                }

                if (morphoMoonwellValue === undefined) {
                    const closestTimestamp = findClosestTimestamp(timestamp, sortedMorphoMoonwellTimestamps as number[]);
                    if (closestTimestamp !== null) {
                        morphoMoonwellValue = normalizedMorphoMoonwellMap.get(closestTimestamp);
                        isMorphoMoonwellApproximated = true;
                    }
                }

                if (morphoGauntletCoreValue === undefined) {
                    const closestTimestamp = findClosestTimestamp(timestamp, sortedMorphoGauntletCoreTimestamps as number[]);
                    if (closestTimestamp !== null) {
                        morphoGauntletCoreValue = normalizedMorphoGauntletCoreMap.get(closestTimestamp);
                        isMorphoGauntletCoreApproximated = true;
                    }
                }

                if (morphoSteakhouseValue === undefined) {
                    const closestTimestamp = findClosestTimestamp(timestamp, sortedMorphoSteakhouseTimestamps as number[]);
                    if (closestTimestamp !== null) {
                        morphoSteakhouseValue = normalizedMorphoSteakhouseMap.get(closestTimestamp);
                        isMorphoSteakhouseApproximated = true;
                    }
                }

                if (morphoIonicValue === undefined) {
                    const closestTimestamp = findClosestTimestamp(timestamp, sortedMorphoIonicTimestamps as number[]);
                    if (closestTimestamp !== null) {
                        morphoIonicValue = normalizedMorphoIonicMap.get(closestTimestamp);
                        isMorphoIonicApproximated = true;
                    }
                }

                if (morphoRe7Value === undefined) {
                    const closestTimestamp = findClosestTimestamp(timestamp, sortedMorphoRe7Timestamps as number[]);
                    if (closestTimestamp !== null) {
                        morphoRe7Value = normalizedMorphoRe7Map.get(closestTimestamp);
                        isMorphoRe7Approximated = true;
                    }
                }

                return {
                    timestamp,
                    superfund: superfundValue,
                    aave: aaveValue !== undefined ? aaveValue : null,
                    fluid: fluidValue !== undefined ? fluidValue : null,
                    morphoGauntletPrime: morphoGauntletPrimeValue !== undefined ? morphoGauntletPrimeValue : null,
                    morphoMoonwell: morphoMoonwellValue !== undefined ? morphoMoonwellValue : null,
                    morphoGauntletCore: morphoGauntletCoreValue !== undefined ? morphoGauntletCoreValue : null,
                    morphoSteakhouse: morphoSteakhouseValue !== undefined ? morphoSteakhouseValue : null,
                    morphoIonic: morphoIonicValue !== undefined ? morphoIonicValue : null,
                    morphoRe7: morphoRe7Value !== undefined ? morphoRe7Value : null,
                    isAaveApproximated,
                    isFluidApproximated,
                    isMorphoGauntletPrimeApproximated,
                    isMorphoMoonwellApproximated,
                    isMorphoGauntletCoreApproximated,
                    isMorphoSteakhouseApproximated,
                    isMorphoIonicApproximated,
                    isMorphoRe7Approximated
                };
            });

            console.log('Combined dataset created with', combined.length, 'Superfund-led points');
            console.log('Approximated Aave values:', combined.filter(d => d.isAaveApproximated).length);

            // Debug: Check if we have any matches
            const withAave = combined.filter(d => d.aave !== null).length;
            const withFluid = combined.filter(d => d.fluid !== null).length;
            const withEither = combined.filter(d => d.aave !== null || d.fluid !== null).length;
            const withMorphoAny = combined.filter(d =>
                d.morphoGauntletPrime !== null ||
                d.morphoMoonwell !== null ||
                d.morphoGauntletCore !== null ||
                d.morphoSteakhouse !== null ||
                d.morphoIonic !== null ||
                d.morphoRe7 !== null
            ).length;

            console.log('Data points with: Aave =', withAave, 'Fluid =', withFluid, 'Either =', withEither, 'Any Morpho =', withMorphoAny);

            // Sample a few timestamps after normalization for debugging
            if (combined.length > 0) {
                console.log('Sample normalized timestamps:');
                const sampleSize = Math.min(3, combined.length);
                for (let i = 0; i < sampleSize; i++) {
                    console.log(`Sample ${i + 1}:`, {
                        timestamp: combined[i].timestamp,
                        superfund: combined[i].superfund,
                        aave: combined[i].aave,
                        fluid: combined[i].fluid,
                        morphoGauntletPrime: combined[i].morphoGauntletPrime
                    });
                }
            }

            // Instead of filtering, include all data points that have Superfund data
            // This ensures data is shown even if benchmark comparisons are missing
            setHistoricalData(combined as any);
        } else {
            console.log('Missing timestamp data in one or both datasets');
            setHistoricalData([]);
        }

        // Update refs
        prevSuperfundData.current = SuperfundHistoryData;
        prevAaveData.current = AaveHistoryData;
        prevFluidData.current = FluidHistoryData;
        prevMorphoData.current = {
            gauntletPrime: MorphoGauntletPrimeHistoryData,
            moonwell: MorphoMoonwellHistoryData,
            gauntletCore: MorphoGauntletCoreHistoryData,
            steakhouse: MorphoSteakhouseHistoryData,
            ionic: MorphoIonicHistoryData,
            re7: MorphoRe7HistoryData
        };

        setIsProcessing(false);
    }, [SuperfundHistoryData, AaveHistoryData, FluidHistoryData, isSuperfundLoading, isAaveLoading, isFluidLoading, MorphoGauntletPrimeHistoryData, MorphoMoonwellHistoryData, MorphoGauntletCoreHistoryData, MorphoSteakhouseHistoryData, MorphoIonicHistoryData, MorphoRe7HistoryData]);

    const customTicks = {
        [Period.oneDay]: 5,
        [Period.oneWeek]: 5,
        [Period.oneMonth]: 5,
        [Period.allTime]: 5,
    }

    const chartData = useMemo(() => {
        console.log('historicalData length:', historicalData.length);

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
                superfund: item.superfund !== null ? item.superfund : null,
                aave: item.aave !== null ? item.aave : null,
                fluid: item.fluid !== null ? item.fluid : null,
                morphoGauntletPrime: item.morphoGauntletPrime !== null ? item.morphoGauntletPrime : null,
                morphoMoonwell: item.morphoMoonwell !== null ? item.morphoMoonwell : null,
                morphoGauntletCore: item.morphoGauntletCore !== null ? item.morphoGauntletCore : null,
                morphoSteakhouse: item.morphoSteakhouse !== null ? item.morphoSteakhouse : null,
                morphoIonic: item.morphoIonic !== null ? item.morphoIonic : null,
                morphoRe7: item.morphoRe7 !== null ? item.morphoRe7 : null,
                isAaveApproximated: item.isAaveApproximated || false,
                isFluidApproximated: item.isFluidApproximated || false,
                superfundDisplay: item.superfund !== null ? abbreviateNumber(item.superfund) : '0.00',
                aaveDisplay: item.aave !== null ? abbreviateNumber(item.aave) : '0.00',
                fluidDisplay: item.fluid !== null ? abbreviateNumber(item.fluid) : '0.00',
                morphoGauntletPrimeDisplay: item.morphoGauntletPrime !== null ? abbreviateNumber(item.morphoGauntletPrime) : '0.00',
                morphoMoonwellDisplay: item.morphoMoonwell !== null ? abbreviateNumber(item.morphoMoonwell) : '0.00',
                morphoGauntletCoreDisplay: item.morphoGauntletCore !== null ? abbreviateNumber(item.morphoGauntletCore) : '0.00',
                morphoSteakhouseDisplay: item.morphoSteakhouse !== null ? abbreviateNumber(item.morphoSteakhouse) : '0.00',
                morphoIonicDisplay: item.morphoIonic !== null ? abbreviateNumber(item.morphoIonic) : '0.00',
                morphoRe7Display: item.morphoRe7 !== null ? abbreviateNumber(item.morphoRe7) : '0.00',
            }
        }).sort((a: any, b: any) => a.rawTimestamp - b.rawTimestamp);

        console.log('Formatted chartData length:', formatted.length);
        return formatted;
    }, [historicalData])

    const { minValue, maxValue, valueRange } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return {
                minValue: 0,
                maxValue: 10,
                valueRange: 10
            };
        }

        const allValues = chartData.flatMap((d: any) => [
            Number(d.superfund),
            Number(d.aave),
            Number(d.fluid),
            Number(d.morphoGauntletPrime),
            Number(d.morphoMoonwell),
            Number(d.morphoGauntletCore),
            Number(d.morphoSteakhouse),
            Number(d.morphoIonic),
            Number(d.morphoRe7)
        ].filter(v => v !== null && v !== undefined && !isNaN(v)))

        if (allValues.length === 0) {
            return {
                minValue: 0,
                maxValue: 10,
                valueRange: 10
            };
        }

        const min = Math.min(...allValues)
        const max = Math.max(...allValues)
        return {
            minValue: min,
            maxValue: max,
            valueRange: max - min > 0 ? max - min : 10
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
                                    <Legend
                                        content={(props) => renderCustomizedLegend(props, visibleLines, handleLegendClick)}
                                        layout="horizontal"
                                        verticalAlign="top"
                                        align="center"
                                        wrapperStyle={{ paddingTop: "10px" }}
                                    />
                                    {visibleLines.superfund && (
                                        <Line
                                            dataKey="superfund"
                                            dot={false}
                                            type="monotone"
                                            name="SuperFund"
                                            strokeWidth={2}
                                            stroke="var(--color-superfund)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.aave && (
                                        <Line
                                            dataKey="aave"
                                            dot={false}
                                            type="monotone"
                                            name="Aave"
                                            strokeWidth={2}
                                            stroke="var(--color-aave)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.fluid && (
                                        <Line
                                            dataKey="fluid"
                                            dot={false}
                                            type="monotone"
                                            name="Fluid"
                                            strokeWidth={2}
                                            stroke="var(--color-fluid, #00C853)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoGauntletPrime && (
                                        <Line
                                            dataKey="morphoGauntletPrime"
                                            dot={false}
                                            type="monotone"
                                            name="Morpho Gauntlet Prime"
                                            strokeWidth={3}
                                            stroke="var(--color-morphoGauntletPrime, #9C27B0)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoMoonwell && (
                                        <Line
                                            dataKey="morphoMoonwell"
                                            dot={false}
                                            type="monotone"
                                            name="Morpho Moonwell"
                                            strokeWidth={3}
                                            stroke="var(--color-morphoMoonwell, #673AB7)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoGauntletCore && (
                                        <Line
                                            dataKey="morphoGauntletCore"
                                            dot={false}
                                            type="monotone"
                                            name="Morpho Gauntlet Core"
                                            strokeWidth={3}
                                            stroke="var(--color-morphoGauntletCore, #3F51B5)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoSteakhouse && (
                                        <Line
                                            dataKey="morphoSteakhouse"
                                            dot={false}
                                            type="monotone"
                                            name="Morpho Steakhouse"
                                            strokeWidth={3}
                                            stroke="var(--color-morphoSteakhouse, #FF5722)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoIonic && (
                                        <Line
                                            dataKey="morphoIonic"
                                            dot={false}
                                            type="monotone"
                                            name="Morpho Ionic"
                                            strokeWidth={3}
                                            stroke="var(--color-morphoIonic, #607D8B)"
                                            activeDot={{ r: 5, strokeWidth: 1 }}
                                            connectNulls={true}
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {visibleLines.morphoRe7 && (
                                        <Line
                                            dataKey="morphoRe7"
                                            dot={false}
                                            type="monotone"
                                            name="Morpho Re7"
                                            strokeWidth={3}
                                            stroke="var(--color-morphoRe7, #795548)"
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
                                            {visibleLines.fluid && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="fluid"
                                                    stroke="var(--color-fluid, #00C853)"
                                                    strokeWidth={1}
                                                    fill="rgba(0, 200, 83, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoGauntletPrime && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoGauntletPrime"
                                                    stroke="var(--color-morphoGauntletPrime, #9C27B0)"
                                                    strokeWidth={1}
                                                    fill="rgba(156, 39, 176, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoMoonwell && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoMoonwell"
                                                    stroke="var(--color-morphoMoonwell, #673AB7)"
                                                    strokeWidth={1}
                                                    fill="rgba(103, 58, 183, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoGauntletCore && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoGauntletCore"
                                                    stroke="var(--color-morphoGauntletCore, #3F51B5)"
                                                    strokeWidth={1}
                                                    fill="rgba(63, 81, 181, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoSteakhouse && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoSteakhouse"
                                                    stroke="var(--color-morphoSteakhouse, #FF5722)"
                                                    strokeWidth={1}
                                                    fill="rgba(255, 87, 34, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoIonic && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoIonic"
                                                    stroke="var(--color-morphoIonic, #607D8B)"
                                                    strokeWidth={1}
                                                    fill="rgba(96, 125, 139, 0.2)"
                                                    connectNulls={true}
                                                />
                                            )}
                                            {visibleLines.morphoRe7 && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="morphoRe7"
                                                    stroke="var(--color-morphoRe7, #795548)"
                                                    strokeWidth={1}
                                                    fill="rgba(121, 85, 72, 0.2)"
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
