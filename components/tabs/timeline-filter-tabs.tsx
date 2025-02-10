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
        < Tabs
            defaultValue={Period.oneMonth}
            value={selectedRange}
            onValueChange={handleRangeChange}
            className="w-fit absolute top-3 left-[60px] z-10"
        >
            <TabsList className="bg-gray-200 rounded-md py-0.5">
                {PERIOD_LIST.map((item) => (
                    <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className="px-[12px] py-[2px] rounded-2 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground/50"
                    >
                        <BodyText level="body2" weight="medium" className="data-[state=active]:text-inherit data-[state=active]:bg-inherit data-[state=active]:shadow-inherit text-inherit">
                            {item.label}
                        </BodyText>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs >
    )
}