import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FlatTabs({
    tabs,
    activeTab,
    onTabChange,
}: {
    tabs: {
        label: string;
        value: string;
        content: React.ReactNode;
        disabled?: boolean;
        show?: boolean;
    }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}) {
    return (
        <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="w-full"
        >
            <TabsList className="w-full border-b-[1px] border-gray-500">
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1 bg-transparent text-gray-500 data-[state=active]:text-primary border-b-2 data-[state=inactive]:border-transparent data-[state=active]:border-primary uppercase">
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="w-full pt-6">
                    {tab.content}
                </TabsContent>
            ))}
        </Tabs>
    )
}