import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Period } from '@/types/periodButtons'
import { PERIOD_LIST } from '@/constants'
import { BodyText } from '@/components/ui/typography'

export function TimelineFilterTabs({
    selectedRange,
    handleRangeChange,
}: {
    selectedRange: string;
    handleRangeChange: (value: string) => void;
}) {
    {/* Timeline Filters Tab */ }
    return (
        <Tabs
            defaultValue={Period.oneMonth}
            value={selectedRange}
            onValueChange={handleRangeChange}
            className="w-fit"
        >
            <TabsList className="bg-gray-200 rounded-2 p-0.5">
                {PERIOD_LIST.map((item) => (
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