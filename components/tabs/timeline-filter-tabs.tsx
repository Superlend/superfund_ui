import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { cn } from '@/lib/utils'

export function TimelineFilterTabs({
    selectedRange,
    handleRangeChange,
    filterPeriodList,
    className,
}: {
    selectedRange: string;
    handleRangeChange: (value: string) => void;
    filterPeriodList?: (item: { value: Period }) => boolean;
    className?: string;
}) {
    function handleFilterPeriodList(item: { value: Period }) {
        return filterPeriodList ? filterPeriodList(item) : true
    }
    {/* Timeline Filters Tab */ }
    return (
        <Tabs
            defaultValue={Period.oneMonth}
            value={selectedRange}
            onValueChange={handleRangeChange}
            className={cn("w-fit", className)}
        >
            <TabsList className="bg-gray-200 rounded-2 p-0.5">
                {PERIOD_LIST
                    .filter(handleFilterPeriodList)
                    .map((item) => (
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
    )
}