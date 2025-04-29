'use client'

import MainContainer from '@/components/MainContainer'
import React, { useEffect } from 'react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import useIsClient from '@/hooks/useIsClient'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, notFound } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import AllTransactions from '@/app/components/all-transactions'
import { ChainProvider } from '@/context/chain-context'
import { ChainId } from '@/types/chain'

interface ChainTxsPageProps {
  params: {
    chain: string
  }
}

export default function ChainTransactionsPage({ params }: ChainTxsPageProps) {
  const { isWalletConnected } = useWalletConnection()
  const { isClient } = useIsClient()
  const router = useRouter()
  
  // Determine chain ID from the URL without side effects
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

  if (!isClient) {
    return <LoadingPageSkeleton />
  }

  // For Base chain, show a message that transactions are not available yet
  const isBaseChain = chainId === ChainId.Base;

  return (
    <ChainProvider initialChain={chainId}>
      <MainContainer className="flex flex-col gap-[40px] w-full mx-auto my-14">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Transactions</h1>
        </div>

        {isBaseChain ? (
          <div className="bg-card rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-center">Transaction history for Base chain is coming soon.</p>
            <Button 
              variant="outline"
              className="mt-4 text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        ) : (
          <AllTransactions />
        )}
      </MainContainer>
    </ChainProvider>
  )
}

function LoadingPageSkeleton() {
  return (
    <MainContainer>
      <div className="flex flex-col gap-8 my-14">
        <Skeleton className='h-10 w-[180px] rounded-2xl' />
        <Skeleton className='h-[500px] w-full rounded-2xl' />
      </div>
    </MainContainer>
  )
} 