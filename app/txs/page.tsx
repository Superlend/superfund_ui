'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import MainContainer from '@/components/MainContainer'
import { useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'

// This is a redirect page that sends users to the chain-specific txs page
export default function TransactionsRedirectPage() {
  const router = useRouter()
  const { selectedChain } = useChain()

  useEffect(() => {
    const redirectToChainSpecificPage = () => {
      // Determine which chain to redirect to
      const chainName = selectedChain === ChainId.Base 
        ? 'base' 
        : selectedChain === ChainId.Sonic
          ? 'sonic'
          : 'sonic' // Default to Sonic if not set
      
      router.replace(`/super-fund/${chainName}/txs`)
    }

    // Small timeout to ensure the router is ready
    const timer = setTimeout(redirectToChainSpecificPage, 100)
    return () => clearTimeout(timer)
  }, [router, selectedChain])

  return <LoadingPageSkeleton />
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