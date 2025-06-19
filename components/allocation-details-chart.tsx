'use client'

import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label, Sector } from "recharts";
import { BodyText, HeadingText } from "./ui/typography";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { VAULT_STRATEGIES_MAP, VAULT_STRATEGIES_COLORS_MAP } from "@/lib/constants";
import ExternalLink from "./ExternalLink";
import InfoTooltip from "./tooltips/InfoTooltip";
import { useChain } from "@/context/chain-context";
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook";
import { abbreviateNumberWithoutRounding } from "@/lib/utils";

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">{payload[0].name}</p>
                <p className="text-sm text-muted-foreground">
                    {payload[0].value}%
                </p>
            </div>
        )
    }
    return null
}

export default function AllocationDetailsChart({
    allocationPoints,
}: {
    allocationPoints: { name: string; value: number }[]
}) {
    const { totalAssets, isLoading: isLoadingVault, error: errorVault } = useVaultHook()
    const allocatedAssetDetails = {
        name: 'Loading...',
        value: '0',
    }

    const { selectedChain } = useChain()
    const vaultStrategies = VAULT_STRATEGIES_MAP[selectedChain as keyof typeof VAULT_STRATEGIES_MAP]
    const vaultStrategiesColors = VAULT_STRATEGIES_COLORS_MAP[selectedChain as keyof typeof VAULT_STRATEGIES_COLORS_MAP]

    const getHighestValueAssetDetails = allocationPoints?.length
        ? allocationPoints.reduce(
            (max, current) => (current.value > max.value ? current : max),
            allocationPoints[0]
        )
        : { name: 'Loading...', value: 0 }

    const highestAllocation = getHighestValueAssetDetails

    allocatedAssetDetails.name = highestAllocation.name
    allocatedAssetDetails.value = highestAllocation.value.toString()

    const truncatedAssetName = allocatedAssetDetails.name.length > 15 ? allocatedAssetDetails.name.slice(0, 15) + '...' : allocatedAssetDetails.name;

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card>
                <div className="flex justify-between items-center mb-4 p-6 pb-0">
                    <HeadingText level="h4" weight="medium" className="text-gray-800">
                        Allocation Details
                    </HeadingText>
                    <HeadingText level="h5" weight="medium" className="text-muted-foreground">
                        TVL{" "}:{" "}<span className="text-gray-800">${abbreviateNumberWithoutRounding(Number(totalAssets), 4)}</span>
                    </HeadingText>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 w-full bg-white rounded-4 px-4 pb-4 sm:px-12">
                    <div className="h-[340px] w-[300px] max-w-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart
                                margin={{
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                }}
                            >
                                <Pie
                                    data={allocationPoints}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={0}
                                    dataKey="value"
                                    isAnimationActive={true}
                                    startAngle={90}
                                    endAngle={450}
                                    minAngle={0}
                                    nameKey="name"
                                    cornerRadius={4}
                                    activeShape={({
                                        outerRadius = 0,
                                        ...props
                                    }: PieSectorDataItem) => (
                                        <Sector
                                            {...props}
                                            outerRadius={outerRadius + 10}
                                            className="cursor-pointer transition-all duration-300 hover:opacity-80"
                                        />
                                    )}
                                >
                                    {allocationPoints
                                        .sort((a, b) => b.value - a.value)
                                        .map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={vaultStrategiesColors[entry.name as keyof typeof vaultStrategiesColors]}
                                            />
                                        ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (
                                                viewBox &&
                                                'cx' in viewBox &&
                                                'cy' in viewBox
                                            ) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={
                                                                (viewBox?.cy ||
                                                                    0) - 2
                                                            }
                                                            className="fill-foreground text-2xl font-medium"
                                                        >
                                                            {allocatedAssetDetails.value.toLocaleString()}
                                                            %
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={
                                                                (viewBox.cy ||
                                                                    0) + 24
                                                            }
                                                            className="fill-muted-foreground text-sm"
                                                        >
                                                            {truncatedAssetName.toString()}
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <ScrollArea type="always" className="h-[200px] w-[300px] pr-4">
                        <div className="flex flex-col gap-2">
                            {allocationPoints
                                .sort((a, b) => b.value - a.value)
                                .map((item, index) => (
                                    <div key={item.name} className="flex items-center space-x-2 hover:bg-gray-200 rounded-4 p-2">
                                        <div
                                            className="w-4 h-4 rounded-2"
                                            style={{ backgroundColor: vaultStrategiesColors[item.name as keyof typeof vaultStrategiesColors] }}
                                        />
                                        <div className="flex items-center gap-1 w-full">
                                            {/* <InfoTooltip
                                                label={
                                                    <BodyText level="body2" weight="medium" className="truncate max-w-[200px]">
                                                        {item.name}
                                                    </BodyText>
                                                }
                                                content={item.name}
                                            /> */}
                                            <BodyText level="body2" weight="medium" className="truncate max-w-[200px]" title={item.name}>
                                                {item.name}
                                            </BodyText>
                                            {vaultStrategies && vaultStrategies[item.name as keyof typeof vaultStrategies] && (
                                                <ExternalLink
                                                    href={vaultStrategies[item.name as keyof typeof vaultStrategies].details_url}
                                                    className="text-xs text-muted-foreground"
                                                >
                                                </ExternalLink>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </ScrollArea>
                </div>
            </Card>
        </motion.section>
    )
}
