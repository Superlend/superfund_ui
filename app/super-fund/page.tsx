'use client'

import MainContainer from '@/components/MainContainer'
import React, { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { BodyText, HeadingText } from '@/components/ui/typography'
import DepositAndWithdrawAssets from './deposit-and-withdraw'
import TxProvider from '@/context/super-vault-tx-provider'
import VaultStats from './vault-stats'
import PageHeader from './page-header'
import useIsClient from '@/hooks/useIsClient'
import { Skeleton } from '@/components/ui/skeleton'
import FlatTabs from '@/components/tabs/flat-tabs'
import PositionDetails from './position-details'
import FundOverview from './fund-overview'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useHistoricalData, useRebalanceHistory } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { Period } from '@/types/periodButtons'
import ClaimRewards from './claim-rewards'

export default function SuperVaultPage() {
    const { isClient } = useIsClient()
    const { isWalletConnected, isConnectingWallet } = useWalletConnection()
    const [selectedTab, setSelectedTab] = useState('position-details')

    const { historicalData, days_7_avg_base_apy, days_7_avg_rewards_apy, days_7_avg_total_apy, isLoading, error } = useHistoricalData(Period.oneDay)

    // const { rebalanceHistory, isLoading: isLoading2, error: error2 } = useRebalanceHistory(Period.oneDay)


    const tabs = [
        {
            label: 'Position Details',
            value: 'position-details',
            content: <PositionDetails />,
            show: isWalletConnected,
        },
        {
            label: 'Fund Overview',
            value: 'fund-overview',
            content: <FundOverview />,
            show: true,
        },
    ]

    // useEffect(() => {
    //     setSelectedTab(tabs.filter(tab => tab.show)[0].value)
    // }, [isWalletConnected])

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab)
    }

    if (!isClient) {
        return (
            <LoadingPageSkeleton />
        )
    }

    return (
        <TxProvider>
            <MainContainer className="flex flex-col flex-wrap gap-[40px] w-full mx-auto my-14">
                <PageHeader />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[16px]">
                    <div className="flex flex-col gap-10">
                        <VaultStats
                            last_7_day_avg_total_apy={days_7_avg_total_apy}
                            days_7_avg_base_apy={days_7_avg_base_apy}
                            days_7_avg_rewards_apy={days_7_avg_rewards_apy}
                        />
                        <div className="block lg:hidden">
                            <DepositAndWithdrawAssets />
                        </div>
                        {isConnectingWallet &&
                            <LoadingTabs />
                        }
                        {!isConnectingWallet &&
                            <FlatTabs
                                tabs={tabs}
                                activeTab={selectedTab}
                                onTabChange={handleTabChange}
                            />
                        }
                    </div>
                    <div className="hidden lg:block">
                        <DepositAndWithdrawAssets />
                    </div>
                </div>
            </MainContainer>
        </TxProvider>
    )
}

function BlogCard() {
    return (
        <div className="blog-card-wrapper">
            <Card className="group">
                <CardContent className="relative h-[262px] w-full p-0 overflow-hidden rounded-6 flex items-center justify-center">
                    <div className="absolute top-0 left-0 h-full w-full bg-primary bg-opacity-40 blur-md"></div>
                    <BodyText
                        level="body1"
                        weight="medium"
                        className="group-hover:scale-125 transition-all relative text-white font-bold text-[32px]"
                    >
                        Coming soon
                    </BodyText>
                </CardContent>
                <CardFooter className="py-[16px] blur-[2px]">
                    <div className="flex flex-col gap-[6px]">
                        <BodyText level="body1" weight="medium">
                            Introduction to Lending & Borrowing with Superlend
                        </BodyText>
                        <BodyText level="body2">
                            Understanding: What is Superlend, How does it work,
                            Key benefits of using Superlend and more.
                        </BodyText>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

function LoadingTabs() {
    return (
        <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
    )
}

function LoadingPageSkeleton() {
    return (
        <MainContainer>
            <div className="flex flex-col gap-12">
                <Skeleton className='h-12 w-[80%] md:w-80 rounded-2xl' />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-start justify-between gap-4">
                            {[1, 2, 3, 4].map(item => (
                                <div className="flex flex-col items-start w-full max-w-[250px] gap-2" key={item}>
                                    <Skeleton className='h-8 w-full rounded-2xl' />
                                    <Skeleton className='h-6 w-[80%] rounded-2xl' />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-start w-full gap-4">
                            <Skeleton className='h-8 w-full md:w-48 rounded-2xl' />
                            <Skeleton className='h-40 w-full rounded-2xl' />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Skeleton className='h-[50px] w-full rounded-2xl' />
                        <Skeleton className='h-[240px] w-full rounded-2xl' />
                    </div>
                </div>
            </div>
        </MainContainer>
    )
}
