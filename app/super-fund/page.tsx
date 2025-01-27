'use client'

import MainContainer from '@/components/MainContainer'
import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { BodyText } from '@/components/ui/typography'
import DepositAndWithdrawAssets from './deposit-and-withdraw'
import TxProvider from '@/context/super-vault-tx-provider'
import VaultStats from './vault-stats'
import VaultOverview from './vault-overview'
import PageHeader from './page-header'
import useIsClient from '@/hooks/useIsClient'
import { Skeleton } from '@/components/ui/skeleton'

export default function SuperVaultPage() {
    const { isClient } = useIsClient()

    if (!isClient) {
        return (
            <MainContainer>
                <div className="flex flex-col gap-10">
                    <Skeleton className="h-12 w-[80%] md:w-80" />
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                        <div className="flex flex-col gap-8">
                            <div className="flex items-start justify-between gap-4">
                                {[1, 2, 3, 4].map((item) => (
                                    <div
                                        className="flex flex-col items-start w-full max-w-[250px] gap-2"
                                        key={item}
                                    >
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-6 w-[80%]" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col items-start w-full gap-4">
                                <Skeleton className="h-8 w-full md:w-48" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-[300px] w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            </MainContainer>
        )
    }

    return (
        <TxProvider>
            <MainContainer className="flex flex-col flex-wrap gap-[40px] w-full mx-auto my-14">
                <PageHeader />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[16px]">
                    <div className="flex flex-col gap-10">
                        <VaultStats />
                        <VaultOverview />
                    </div>
                    <DepositAndWithdrawAssets />
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
