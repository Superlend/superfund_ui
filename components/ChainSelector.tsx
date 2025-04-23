'use client'

import React from 'react'
import { useChain } from '@/context/chain-context'
import ImageWithDefault from '@/components/ImageWithDefault'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChainSelector() {
  const { selectedChain, isChangingChain, chainDetails } = useChain()
  
  // Get current chain details
  const currentChainDetails = chainDetails[selectedChain as keyof typeof chainDetails]
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 h-6 px-1.5 rounded-md",
      isChangingChain ? "opacity-70" : ""
    )}>
      {isChangingChain ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" />
      ) : (
        <ImageWithDefault
          src={currentChainDetails?.logo}
          alt={currentChainDetails?.name}
          width={16}
          height={16}
          className="rounded-full h-4 w-4 object-contain"
        />
      )}
      <span className="text-xs font-medium">{currentChainDetails?.name}</span>
    </div>
  )
} 