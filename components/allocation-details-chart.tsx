"use client";

import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label, Sector } from "recharts";
import { BodyText } from "./ui/typography";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

const data = [
    { name: "Morpho - MEV Capital Usual USDC", value: 35 },
    { name: "Euler Resolv Marketplace by Apostro", value: 15 },
    { name: "Aave v3 USDC Market", value: 38.41 },
    { name: "Fluid USDC Vault", value: 11.59 },
];

const totalCount = 34;

const COLORS = ["#3b82f6", "#ef4444", "#8b5cf6", "#0891b2"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">{payload[0].name}</p>
                <p className="text-sm text-muted-foreground">
                    {payload[0].value}%
                </p>
            </div>
        );
    }
    return null;
};

export default function AllocationDetailsChart({ allocationPoints }: { allocationPoints: { name: string, value: number }[] }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card>
                <div className="flex justify-between items-center mb-4 p-6 pb-0">
                    <h2 className="text-lg font-semibold">Allocation Details</h2>
                    <BodyText level="body2" weight="medium" className="text-muted-foreground">
                        Last Rebalance: <span className="text-gray-700">2 hrs 34 mins ago</span>
                    </BodyText>
                </div>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:h-[340px] w-full bg-white rounded-4 max-lg:pb-8 px-12">
                    <div className="h-[340px] w-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <Pie
                                    data={allocationPoints}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    isAnimationActive={true}
                                    startAngle={90}
                                    endAngle={450}
                                    minAngle={0}
                                    nameKey="name"
                                    cornerRadius={12}
                                    activeShape={({
                                        outerRadius = 0,
                                        ...props
                                    }: PieSectorDataItem) => (
                                        <Sector {...props} outerRadius={outerRadius + 10} className="cursor-pointer transition-all duration-300 hover:opacity-80" />
                                    )}
                                >
                                    {allocationPoints.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox?.cy || 0) - 2}
                                                            className="fill-foreground text-2xl font-medium"
                                                        >
                                                            {totalCount.toLocaleString()}%
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground text-sm"
                                                        >
                                                            Allocated to Aave
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
                    <div className="flex flex-col gap-6">
                        {allocationPoints.map((item, index) => (
                            <div key={item.name} className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index] }}
                                />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </motion.section>
    );
}