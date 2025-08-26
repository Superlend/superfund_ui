'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { Period } from '@/types/periodButtons'
import { TimelineFilterTabs } from './tabs/timeline-filter-tabs'
import { useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import { SONIC_USDC_ADDRESS, USDC_ADDRESS } from '@/lib/constants'
import { fetchRewardApyAaveV3 } from '@/hooks/vault_hooks/vaultHook'
import { CHART_CONFIG, PROTOCOL_IDENTIFIERS } from '@/lib/benchmark-chart-config'
import useGetBenchmarkHistory from '@/hooks/useGetBenchmarkHistory'
import { abbreviateNumber, getBoostApy } from '@/lib/utils'
import ImageWithDefault from './ImageWithDefault'
import { useApyData } from '@/context/apy-data-provider'

// Add the TopMorphoInfo interface for consistency with the chart component
interface TopMorphoInfo {
    key: string;
    value: number;
    protocolName: string;
    color: string;
    logo: string;
}

type BenchmarkData = {
    platform: string
    apy: number
    totalEarned: number
    color: string
    logo: string
}

export function BenchmarkYieldTable() {
    const [selectedRange, setSelectedRange] = useState<Period>(Period.oneMonth)
    const [apiPeriod, setApiPeriod] = useState<Period | 'YEAR'>(Period.oneMonth)
    const [aaveRewardApy, setAaveRewardApy] = useState<number>(0)
    const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const { selectedChain } = useChain()
    const { boostApy: BOOST_APY, isLoading: isLoadingBoostApy, boostApyStartDate } = useApyData()

    // Get Superfund data
    // const { historicalData: superfundData, isLoading: superfundLoading } = useHistoricalData({
    //     period: apiPeriod === 'YEAR' ? Period.oneYear : apiPeriod as Period,
    //     chain_id: selectedChain
    // })
    const {
        historicalData: superfundData,
        isLoading: superfundLoading,
        error: superfundError,
    } = useHistoricalData({
        period: apiPeriod === 'YEAR' ? Period.oneYear : apiPeriod as Period,
        chain_id: selectedChain,
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

    // Get Fluid data
    const { data: fluidData, isLoading: isFluidLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.fluid,
        period: apiPeriod,
        token: USDC_ADDRESS
    });

    // Get Morpho data for Base chain - add all the ones from chart component
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

    // Get Euler data for Base chain
    const { data: eulerData, isLoading: isEulerLoading } = useGetBenchmarkHistory({
        protocol_identifier: PROTOCOL_IDENTIFIERS.BASE.euler,
        period: apiPeriod,
        token: USDC_ADDRESS
    })

    // Calculate average APY for a dataset over the selected period
    const calculateAverageApy = (data: any) => {
        if (!data || !data.processMap || !Array.isArray(data.processMap) || data.processMap.length === 0) {
            return 0;
        }

        const total = data.processMap.reduce((sum: number, item: any) => {
            return sum + (item.data?.depositRate || 0);
        }, 0);

        return total / data.processMap.length;
    };

    // Calculate average APY for Morpho vaults
    const calculateMorphoAverageApy = (data: any) => {
        if (!data || !data.processMap || !Array.isArray(data.processMap) || data.processMap.length === 0) {
            return 0;
        }

        const total = data.processMap.reduce((sum: number, item: any) => {
            return sum + (item.data?.depositRateReward || 0);
        }, 0);

        return total / data.processMap.length;
    };

    // Calculate average APY for Superfund
    const calculateSuperfundAverageApy = (data: any) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return 0;
        }

        const total = data.reduce((sum: number, item: any) => {
            const currentDate = new Date(item.timestamp * 1000).getTime();
            // Only add BOOST_APY if the date is on or after May 12, 2025
            const shouldAddBoost = currentDate >= boostApyStartDate;
            const itemValue = (Number(item.spotApy ?? 0) + Number(item.rewardsApy ?? 0)) + (shouldAddBoost ? Number(BOOST_APY ?? 0) : 0);
            return sum + (itemValue || 0);
        }, 0);

        return total / data.length;
    };

    // Find the top performing Morpho vault
    const getTopMorphoVault = useMemo<TopMorphoInfo | null>(() => {
        if (selectedChain !== ChainId.Base) return null;

        const morphoData = {
            morphoGauntletPrime: { data: morphoGauntletPrimeData, loading: isMorphoGauntletPrimeLoading },
            morphoMoonwell: { data: morphoMoonwellData, loading: isMorphoMoonwellLoading },
            morphoGauntletCore: { data: morphoGauntletCoreData, loading: isMorphoGauntletCoreLoading },
            morphoSteakhouse: { data: morphoSteakhouseData, loading: isMorphoSteakhouseLoading },
            morphoIonic: { data: morphoIonicData, loading: isMorphoIonicLoading },
            morphoRe7: { data: morphoRe7Data, loading: isMorphoRe7Loading }
        };

        // Calculate average APY for each Morpho vault
        let topMorphoInfo: TopMorphoInfo | null = null;
        let topApy = -1;

        Object.entries(morphoData).forEach(([key, { data }]) => {
            const apy = calculateMorphoAverageApy(data);
            if (apy > topApy) {
                topApy = apy;
                topMorphoInfo = {
                    key,
                    value: apy,
                    protocolName: CHART_CONFIG[key as keyof typeof CHART_CONFIG].label,
                    color: CHART_CONFIG[key as keyof typeof CHART_CONFIG].color,
                    logo: 'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/morpho-logo.svg'
                };
            }
        });

        return topMorphoInfo;
    }, [
        selectedChain,
        morphoGauntletPrimeData, morphoMoonwellData, morphoGauntletCoreData,
        morphoSteakhouseData, morphoIonicData, morphoRe7Data
    ]);

    // Update benchmark data when API data changes
    useEffect(() => {
        const isDataLoading =
            superfundLoading ||
            isAaveLoading ||
            (selectedChain === ChainId.Base && (
                isFluidLoading ||
                isMorphoGauntletPrimeLoading ||
                isMorphoMoonwellLoading ||
                isMorphoGauntletCoreLoading ||
                isMorphoSteakhouseLoading ||
                isMorphoIonicLoading ||
                isMorphoRe7Loading ||
                isEulerLoading
            ));

        setIsLoading(isDataLoading);

        if (isDataLoading) return;

        // Local function to calculate earnings based on current selectedRange
        const calculateEarningsForCurrentPeriod = (apy: number) => {
            // Convert annual APY to daily rate
            // APY formula: (1 + r)^n - 1 = APY
            // Solve for r: r = (1 + APY)^(1/n) - 1
            const daysInYear = 365;
            const dailyRate = Math.pow(1 + apy/100, 1/daysInYear) - 1;
            const principal = 10000;

            // Determine number of days based on selected period
            let days = 30; // Default for oneMonth
            if (selectedRange === Period.oneDay) {
                days = 1;
            } else if (selectedRange === Period.oneWeek) {
                days = 7;
            } else if (selectedRange === Period.oneYear) {
                days = 365;
            }

            // Calculate compound interest over the selected period
            // A = P(1 + r)^t where:
            // A = final amount
            // P = principal
            // r = daily rate
            // t = number of days
            const totalValue = principal * Math.pow(1 + dailyRate, days);
            const earned = totalValue - principal;

            return earned;
        };

        const newBenchmarkData: BenchmarkData[] = [];

        // Superfund data
        const superfundApy = calculateSuperfundAverageApy(superfundData);
        newBenchmarkData.push({
            platform: 'Superfund',
            apy: superfundApy,
            totalEarned: calculateEarningsForCurrentPeriod(superfundApy),
            color: CHART_CONFIG.superfund.color,
            logo: 'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/superlend.svg'
        });

        // Aave data
        const aaveApy = calculateAverageApy(aaveData) + (selectedChain === ChainId.Sonic ? aaveRewardApy : 0);
        newBenchmarkData.push({
            platform: 'Aave',
            apy: aaveApy,
            totalEarned: calculateEarningsForCurrentPeriod(aaveApy),
            color: CHART_CONFIG.aave.color,
            logo: 'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/aave.svg'
        });

        // Base chain specific protocols
        if (selectedChain === ChainId.Base) {
            // Add Fluid
            const fluidApy = calculateAverageApy(fluidData);
            newBenchmarkData.push({
                platform: 'Fluid',
                apy: fluidApy,
                totalEarned: calculateEarningsForCurrentPeriod(fluidApy),
                color: "#00C853", // Fluid color
                logo: 'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/fluid_logo.png'
            });

            // Add Euler
            const eulerApy = calculateAverageApy(eulerData);
            newBenchmarkData.push({
                platform: 'Euler',
                apy: eulerApy,
                totalEarned: calculateEarningsForCurrentPeriod(eulerApy),
                color: CHART_CONFIG.euler.color,
                logo: '/images/logos/euler-symbol.svg'
            });

            // Add top Morpho vault only if we found one
            const topMorpho = getTopMorphoVault;
            if (topMorpho) {
                newBenchmarkData.push({
                    platform: topMorpho.protocolName,
                    apy: topMorpho.value,
                    totalEarned: calculateEarningsForCurrentPeriod(topMorpho.value),
                    color: topMorpho.color,
                    logo: topMorpho.logo
                });
            }
        }

        // Sort by APY descending
        newBenchmarkData.sort((a, b) => b.apy - a.apy);

        setBenchmarkData(newBenchmarkData);
    }, [
        superfundData,
        aaveData,
        fluidData,
        morphoGauntletPrimeData,
        morphoMoonwellData,
        morphoGauntletCoreData,
        morphoSteakhouseData,
        morphoIonicData,
        morphoRe7Data,
        eulerData,
        superfundLoading,
        isAaveLoading,
        isFluidLoading,
        isMorphoGauntletPrimeLoading,
        isMorphoMoonwellLoading,
        isMorphoGauntletCoreLoading,
        isMorphoSteakhouseLoading,
        isMorphoIonicLoading,
        isMorphoRe7Loading,
        isEulerLoading,
        selectedChain,
        aaveRewardApy,
        selectedRange
    ]);

    // Handle time period change
    const handleRangeChange = (value: string) => {
        // For the "All" filter, use one year period instead for API calls
        if (value === Period.oneYear) {
            setSelectedRange(Period.oneYear); // For UI display
            setApiPeriod("YEAR"); // One year data for API calls
        } else {
            setSelectedRange(value as Period);
            setApiPeriod(value as Period);
        }
    }

    // Table column definitions
    const columns = useMemo<ColumnDef<BenchmarkData>[]>(
        () => [
            {
                accessorKey: 'platform',
                header: 'Platform',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <ImageWithDefault src={row.original.logo} alt={row.original.platform} width={20} height={20} />
                        <BodyText level="body2" weight="medium">
                            {row.original.platform}
                        </BodyText>
                    </div>
                ),
            },
            {
                accessorKey: 'apy',
                header: () => {
                    let periodText = '30D';
                    if (selectedRange === Period.oneDay) periodText = '24H';
                    if (selectedRange === Period.oneWeek) periodText = '7D';
                    if (selectedRange === Period.oneYear) periodText = '1Y';

                    return (
                        <div className="text-center w-full">
                            {periodText} Yield <span className="hidden sm:inline"></span>
                        </div>
                    );
                },
                cell: ({ row }) => (
                    <BodyText level="body2" weight="medium" className="text-gray-800 text-center">
                        {abbreviateNumber(row.original.apy ?? 0, 2)}%
                    </BodyText>
                ),
            },
            {
                accessorKey: 'totalEarned',
                header: () => {
                    let periodText = '30 Days';
                    if (selectedRange === Period.oneDay) periodText = '24 Hours';
                    if (selectedRange === Period.oneWeek) periodText = '7 Days';
                    if (selectedRange === Period.oneYear) periodText = '1 Year';

                    return (
                        <div className="text-center w-full">
                            <span className="hidden sm:inline">Total Earned on </span>$10,000<span className="hidden sm:inline"> ({periodText})</span>
                        </div>
                    );
                },
                cell: ({ row }) => (
                    <BodyText level="body2" weight="medium" className="text-gray-800 text-center">
                        ${abbreviateNumber(row.original.totalEarned ?? 0, 2)}
                    </BodyText>
                ),
            },
        ],
        [selectedRange]
    )

    const table = useReactTable({
        data: benchmarkData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2">
                <div>
                    <CardTitle>
                        <HeadingText level="h4" weight="medium" className="text-gray-800 mb-1">
                            Yield Comparison
                        </HeadingText>
                    </CardTitle>
                    <CardDescription>
                        Compare yields across different platforms
                    </CardDescription>
                </div>
                <TimelineFilterTabs
                    selectedRange={selectedRange}
                    handleRangeChange={handleRangeChange}
                    className="mt-2 sm:mt-0"
                />
            </CardHeader>
            <CardContent className="px-0 px-3 overflow-x-auto">
                {isLoading ? (
                    <div className="px-3 py-4">
                        <Skeleton className="h-64 w-full rounded-4" />
                    </div>
                ) : (
                    <div className="min-w-[320px]">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="font-medium text-xs sm:text-sm">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-3 px-2 sm:px-4">
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 