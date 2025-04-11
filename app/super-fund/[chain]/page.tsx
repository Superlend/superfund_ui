'use client'

import MainContainer from '@/components/MainContainer'
import React, { useState, useEffect, useRef } from 'react'
import DepositAndWithdrawAssets from '../deposit-and-withdraw'
import VaultStats from '../vault-stats'
import PageHeader from '../page-header'
import useIsClient from '@/hooks/useIsClient'
import { Skeleton } from '@/components/ui/skeleton'
import FlatTabs from '@/components/tabs/flat-tabs'
import PositionDetails from '../position-details'
import FundOverview from '../fund-overview'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useRouter, notFound } from 'next/navigation'
import { ChainProvider } from '@/context/chain-context'
import { ChainId } from '@/types/chain'

interface ChainPageProps {
  params: {
    chain: string
  }
}

export default function SuperVaultChainPage({ params }: ChainPageProps) {
  const { isClient } = useIsClient()
  const { isWalletConnected, isConnectingWallet, walletAddress } = useWalletConnection()
  const router = useRouter()
  const initialized = useRef(false)
  
  // Validate chain parameter only once
  useEffect(() => {
    if (!isClient || initialized.current) return;
    initialized.current = true;
    
    // Log chain parameter for debugging
    console.log(`Chain page initialized with param: ${params.chain}`)
  }, [isClient, params.chain]);
  
  // Determine chain ID directly from the URL without side effects
  let chainId: ChainId;
  if (params.chain.toLowerCase() === 'base') {
    chainId = ChainId.Base
  } else if (params.chain.toLowerCase() === 'sonic') {
    chainId = ChainId.Sonic
  } else {
    // This will be caught and redirected to the not-found page
    notFound()
    // TypeScript needs a value, but this line is never executed
    chainId = ChainId.Sonic
  }
  
  const [selectedTab, setSelectedTab] = useState('fund-overview')

  const tabs = [
    {
      label: 'Fund Overview',
      value: 'fund-overview',
      content: <FundOverview />,
      show: true,
    },
    {
      label: 'Position Details',
      value: 'position-details',
      content: <PositionDetails />,
      show: isWalletConnected,
    },
  ]

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
  }

  if (!isClient) {
    return <LoadingPageSkeleton />
  }

  // Wrap content in a chain provider with forced chain ID from URL
  return (
    <ChainProvider initialChain={chainId}>
      <MainContainer className="flex flex-col flex-wrap gap-[40px] w-full mx-auto my-14">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[16px]">
          <div className="flex flex-col gap-10">
            <VaultStats />
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
    </ChainProvider>
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