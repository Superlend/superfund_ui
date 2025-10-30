'use client'

import {
    Area,
    AreaChart,
    Brush,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { TimelineFilterTabs } from './tabs/timeline-filter-tabs'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRebalanceHistory } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { abbreviateNumber, extractTimeFromDate, formatDateAccordingToPeriod, shortNubers } from '@/lib/utils'
import { VAULT_STRATEGIES_COLORS, VAULT_STRATEGIES_COLORS_MAP } from '@/lib/constants'
import { BodyText, HeadingText, Label } from './ui/typography'
import { Skeleton } from './ui/skeleton'
import { Expand } from 'lucide-react'
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { ChainId } from '@/types/chain'
import { useChain } from '@/context/chain-context'

const chartData = [
    { date: '11/07', value1: 8, value2: 4, value3: 12 },
    { date: '12/07', value1: 6, value2: 10, value3: 8 },
    { date: '13/07', value1: 7, value2: 8, value3: 9 },
    { date: '14/07', value1: 10, value2: 6, value3: 8 },
    { date: '15/07', value1: 6, value2: 8, value3: 10 },
    { date: '16/07', value1: 7, value2: 9, value3: 8 },
    { date: '17/07', value1: 8, value2: 7, value3: 9 },
]

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
    // if (index === 0 || index === length - 1) return null

    return (
        <g
            transform={`translate(${x - 35},${y - 3})`}
            style={{ zIndex: 20, position: 'relative', color: '#000000' }}
        >
            <text x={0} y={0} dy={6} dx={11} textAnchor="start" fill="#000000">
                {`$${abbreviateNumber(payload.value, 0)}`}
            </text>
        </g>
    )
}

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

const CustomXAxisTick = ({
    x,
    y,
    selectedRange,
    payload,
    index,
    length,
}: CustomXAxisTickProps) => {
    // if (index % 2) return null
    return (
        <g transform={`translate(${x + 10},${y})`} style={{ zIndex: 10 }}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#000000">
                {formatDateAccordingToPeriod(
                    payload.value.toString(),
                    selectedRange
                )}
            </text>
        </g>
    )
}

function CustomChartTooltipContent({
    payload,
    label,
}: {
    payload: any[]
    label: string
}) {
    if (!payload || payload.length === 0) return null;

    const allocations = payload[0].payload.allocations.sort((a: any, b: any) => b.value - a.value)
    const caption = payload[0].payload.timestamp

    return (
        <div className="flex flex-col gap-2 px-1.5">
            <Label size="small" weight="normal" className="text-gray-600">
                {caption}
            </Label>
            <div className="flex flex-col space-y-1">
                {
                    allocations.map((allocation: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                            <Label size="small" weight="normal" className="text-gray-800 max-w-[300px] truncate">
                                {allocation.name}
                            </Label>
                            <BodyText level="body3" weight="medium" className="text-gray-800">
                                ${abbreviateNumber(allocation.value)}
                            </BodyText>
                        </div>
                    ))
                }
            </div>
            <Label size="small" weight="normal" className="flex items-center justify-between text-gray-800 border-t border-gray-400 pt-1">
                Total Assets: <span className="text-gray-800 font-medium">${payload[0].payload.totalAssets}</span>
            </Label>
        </div>
    )
}

interface ChartDataPoint {
    timestamp: string
    date: string
    time: string
    totalAssets: string
    totalAssetsRaw: number
    allocations: {
        name: string
        value: number
        address: string
    }[]
    [key: string]: any // Allow dynamic allocation keys
}

interface ChartConfig {
    [key: string]: {
        label: string
        color: string
    }
}

const BASE_CHAIN_CONFIG = {
    '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61': {
        label: 'Morpho Gauntlet USDC Prime',
        color: '#3366CC', // Deep blue
    },
    '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca': {
        label: 'Morpho Moonwell Flagship USDC',
        color: '#8A2BE2', // Bright purple
    },
    '0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12': {
        label: 'Morpho Gauntlet USDC Core',
        color: '#FF8C00', // Dark orange
    },
    '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183': {
        label: 'Morpho Steakhouse USDC',
        color: '#DEB887', // Beige/sand
    },
    '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e': {
        label: 'Morpho Extrafi XLend USDC',
        color: '#4169E1', // Royal blue
    },
    '0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e': {
        label: 'Morpho Re7 USDC',
        color: '#9370DB', // Medium purple
    },
    '0x7A7815B41617e728DbCF4247E46d1CEbd2d81150': {
        label: 'AaveV3',
        color: '#1E90FF', // Dodger blue
    },
    '0xf42f5795D9ac7e9D757dB633D693cD548Cfd9169': {
        label: 'Fluid',
        color: '#FFA500', // Orange
    },
    '0x0A1a3b5f2041F33522C4efc754a7D096f880eE16': {
        label: 'Euler Base USDC',
        color: '#6A5ACD', // Slate blue
    },
    '0x0000000000000000000000000000000000000000': {
        label: 'Cash Reserve',
        color: '#F4A460', // Sandy brown
    },
    '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A': {
        label: 'Spark USDC Vault',
        color: '#3366CC', // Deep blue
    },
    '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738': {
        label: 'Seamless USDC Vault',
        color: '#8A2BE2', // Bright purple
    },
    '0xB7890CEE6CF4792cdCC13489D36D9d42726ab863': {
        label: 'Universal USDC Vault',
        color: '#3151b0', // Dark blue
    },
    '0xb99b6df96d4d5448cc0a5b3e0ef7896df9507cf5': {
        label: '40 Acres USDC Vault',
        color: '#00745f', // Dark green
    }
}

const SONIC_CHAIN_CONFIG = {
    '0x7342c3387EfBbcc9fa505027bd1fDB0093e6E8bA': {
        label: 'Aave V3 USDC',
        color: '#3366CC', // Deep blue
    },
    '0x417B12320601D59A548b67ce08b15F7c4bF4fe4d': {
        label: 'MEV Capital Sonic Cluster',
        color: '#8A2BE2', // Bright purple
    },
    '0x5001f8Ca9fc7809D13854885E419D11Da12df8AF': {
        label: 'Re7 labs Cluster',
        color: '#FF8C00', // Dark orange
    },
    '0x0000000000000000000000000000000000000000': {
        label: 'Cash Reserve',
        color: '#F4A460', // Sandy brown
    },
    '0x14886c2Fc03D1858e6d097d40EdF92B3bFEBA678': {
        label: 'Silo Finance Borrowable USDC.e Deposit',
        color: '#3f3f3f', // Dark gray
    },
    '0xa352A4851cc8ae0DA04220a92F4Ce4A0E06912dc': {
        label: 'Silo Finance Borrowable USDC.e Deposit, SiloId: 49',
        color: '#3f3f3f', // Dark gray
    }
}

const CHART_CONFIG_MAP = {
    [ChainId.Base]: BASE_CHAIN_CONFIG,
    [ChainId.Sonic]: SONIC_CHAIN_CONFIG,
}

export function AllocationHistoryChart() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneWeek)
    const { rebalanceHistory, isLoading, error } = useRebalanceHistory(selectedRange)
    const [startIndex, setStartIndex] = useState(0)
    const [endIndex, setEndIndex] = useState(rebalanceHistory.length - 1)
    const [openDialog, setOpenDialog] = useState(false)
    const { selectedChain } = useChain()
    const chartConfig: ChartConfig = CHART_CONFIG_MAP[selectedChain as keyof typeof CHART_CONFIG_MAP]
    const chainColors = VAULT_STRATEGIES_COLORS_MAP[selectedChain as keyof typeof VAULT_STRATEGIES_COLORS_MAP]

    useEffect(() => {
        setStartIndex(0)
        setEndIndex(rebalanceHistory.length - 1)
    }, [rebalanceHistory.length])

    const handleRangeChange = useCallback((value: string) => {
        setSelectedRange(value as Period)
    }, [])

    const chartData = useMemo(() => {
        const transformedData: ChartDataPoint[] = []

        rebalanceHistory.forEach((item: any, index: number) => {
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

            // Calculate actual allocation values and only include non-zero allocations
            const allocationsWithValues = item.allocations
                .filter((allocation: any) => allocation.value > 0)
                .map((allocation: any) => ({
                    name: chartConfig[allocation.address]?.label || allocation.name,
                    value: (item.totalAssets * allocation.value) / 100,
                    address: allocation.address,
                }))

            // Create an object with all addresses having 0 value by default
            const defaultAllocations = Object.keys(chartConfig).reduce((acc, address) => {
                acc[address] = 0
                return acc
            }, {} as Record<string, number>)

            // Update with actual values
            allocationsWithValues.forEach((allocation: any) => {
                defaultAllocations[allocation.address] = allocation.value
            })

            // Add the main data point
            const dataPoint = {
                rawTimestamp: item.timestamp,
                timestamp: `${formattedDate} ${time}`,
                date: formattedDate.split(',')[0],
                time: time,
                totalAssets: abbreviateNumber(item.totalAssets),
                totalAssetsRaw: item.totalAssets, // Keep raw value for Y-axis domain calculation
                allocations: allocationsWithValues,
                ...defaultAllocations
            }

            transformedData.push(dataPoint)
        })

        return transformedData.sort((a, b) => new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime())
    }, [rebalanceHistory, chartConfig])

    // Calculate max Y-axis value based on actual total assets
    const yAxisDomain = useMemo(() => {
        if (chartData.length === 0) return [0, 100]
        
        const maxTotalAssets = Math.max(...chartData.map(d => d.totalAssetsRaw || 0))
        // Add 10% padding to the top
        const maxWithPadding = maxTotalAssets * 1.1
        
        // Verify stacked values match total assets
        chartData.forEach((d, idx) => {
            const stackedSum = Object.keys(chartConfig).reduce((sum, address) => {
                return sum + (d[address] || 0)
            }, 0)
            // if (Math.abs(stackedSum - d.totalAssetsRaw) > 1) {
            //     console.warn(`Data point ${idx}: Stacked sum (${stackedSum}) doesn't match totalAssetsRaw (${d.totalAssetsRaw})`)
            // }
        })
        
        // console.log('Y-axis domain:', [0, maxWithPadding], 'Max total assets:', maxTotalAssets)
        
        return [0, maxWithPadding]
    }, [chartData, chartConfig])

    const memoizedAreasForChart = useMemo(() => {
        // Get unique strategy names from the allocation data
        const uniqueStrategies = new Set<string>()
        chartData.forEach(data => {
            data.allocations.forEach(allocation => {
                if (allocation.value > 0) {
                    uniqueStrategies.add(allocation.name)
                }
            })
        })

        // Convert to array and sort by total value across all time periods
        const activeStrategies = Array.from(uniqueStrategies).sort((a, b) => {
            const totalA = chartData.reduce((sum, data) => {
                const allocation = data.allocations.find(alloc => alloc.name === a)
                return sum + (allocation?.value || 0)
            }, 0)
            const totalB = chartData.reduce((sum, data) => {
                const allocation = data.allocations.find(alloc => alloc.name === b)
                return sum + (allocation?.value || 0)
            }, 0)
            return totalB - totalA
        })

        return activeStrategies.map((strategyName) => {
            // Find the address for this strategy from any data point
            const sampleAllocation = chartData
                .flatMap(data => data.allocations)
                .find(allocation => allocation.name === strategyName)
            
            const address = sampleAllocation?.address || ''
            const color = chainColors[strategyName as keyof typeof chainColors] || chartConfig[address]?.color || '#cccccc'

            return (
                <Area
                    key={address}
                    type="stepAfter"
                    dataKey={address}
                    name={strategyName}
                    stackId="stack"
                    stroke={color}
                    fill={color}
                    fillOpacity={1}
                    strokeOpacity={1}
                    strokeWidth={0}
                    connectNulls={true}
                    isAnimationActive={false}
                    dot={false}
                    activeDot={false}
                />
            )
        })
    }, [chartData, chainColors, chartConfig])

    const memoizedBrush = useMemo(() => (
        <Brush
            dataKey="date"
            height={35}
            stroke="#cacaca"
            fill="#fafafa"
            travellerWidth={8}
            y={openDialog ? 430 : 310}
            strokeWidth={1.2}
            startIndex={startIndex}
            // endIndex={endIndex}
            className="recharts-brush"
            alwaysShowText={false}
        >
            <AreaChart>
                {memoizedAreasForChart}
            </AreaChart>
        </Brush>
    ), [startIndex, memoizedAreasForChart, openDialog])

    const content = (
        <Card className="w-full" id="allocation-history">
            <CardHeader className="flex flex-row items-center justify-between max-md:px-4">
                <HeadingText level="h4" weight="medium" className="text-gray-800">
                    Allocation History
                </HeadingText>
                <div className="flex items-center gap-2">
                    <div className={`${openDialog ? 'mr-12' : ''}`}>
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
            </CardHeader>
            <CardContent className="p-0 pb-4 rounded-4 bg-white">
                <ChartContainer
                    config={chartConfig}
                    className={`w-full h-[${openDialog ? '500px' : '350px'}] max-w-full`}
                >
                    <>
                        {!isLoading &&
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                        top: 20,
                                        right: 10,
                                        left: -10,
                                        bottom: openDialog ? 45 : 10,
                                    }}
                                >
                                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={true}
                                        axisLine={true}
                                        tickCount={5}
                                        interval={(chartData?.length || 0) > 5 ? Math.floor((chartData?.length || 0) / 5) : 0}
                                        tickFormatter={(value) =>
                                            formatDateAccordingToPeriod(value, selectedRange)
                                        }
                                        padding={{ left: 0, right: 10 }}
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
                                        tickLine={true}
                                        axisLine={true}
                                        tickMargin={5}
                                        domain={yAxisDomain}
                                        allowDataOverflow={false}
                                        tick={({ x, y, payload, index }) => (
                                            <CustomYAxisTick
                                                payload={payload as { value: number }}
                                                x={x as number}
                                                y={y as number}
                                                index={index as number}
                                                length={chartData.length}
                                            />
                                        )}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                className="flex items-center gap-2 rounded-lg border bg-white p-2 text-sm shadow-lg"
                                                hideIndicator={true}
                                                labelFormatter={(label, playload) => (
                                                    <CustomChartTooltipContent
                                                        payload={playload}
                                                        label={label}
                                                    />
                                                )}
                                            />
                                        }
                                    />
                                    {memoizedAreasForChart}
                                    {memoizedBrush}
                                </AreaChart>
                            </ResponsiveContainer>
                        }
                        {
                            isLoading &&
                            <Skeleton className={`w-full h-[${openDialog ? '500px' : '350px'}] rounded-4 max-w-[1200px] bg-gray-300`} />
                        }
                    </>
                </ChartContainer>
            </CardContent>
        </Card>
    )

    return (
        <>
            {content}
            {/* <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className='w-[90%] h-[85%] max-w-full max-h-full p-0'>
                    {content}
                </DialogContent>
            </Dialog> */}
        </>
    )
}
