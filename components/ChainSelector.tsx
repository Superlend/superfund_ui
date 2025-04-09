'use client'

import React from 'react'
import { useChain } from '@/context/chain-context'
import { Button } from '@/components/ui/button'
import ImageWithDefault from '@/components/ImageWithDefault'
import { LoaderCircle, ChevronDown, Check } from 'lucide-react'
import { ChainId } from '@/types/chain'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function ChainSelector() {
  const { selectedChain, setSelectedChain, supportedChains, isChangingChain, chainDetails } = useChain()
  
  // Get current chain details
  const currentChainDetails = chainDetails[selectedChain as keyof typeof chainDetails]
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "flex items-center gap-1.5 h-6 px-1.5 rounded-md bg-transparent hover:bg-gray-100",
            isChangingChain ? "cursor-not-allowed opacity-70" : ""
          )}
          disabled={isChangingChain}
        >
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
          <ChevronDown className="h-3 w-3 opacity-70 transition duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[140px] p-1.5 border border-gray-200 shadow-md rounded-md animate-in fade-in-80 zoom-in-95"
      >
        {supportedChains.map((chainId) => {
          if (chainDetails[chainId as keyof typeof chainDetails]) {
            const details = chainDetails[chainId as keyof typeof chainDetails]
            const isSelected = selectedChain === chainId
            
            return (
              <DropdownMenuItem
                key={chainId}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 cursor-pointer rounded-sm text-sm transition-colors",
                  isSelected ? "bg-gray-100" : "hover:bg-gray-50",
                  (isChangingChain || isSelected) ? "cursor-default" : "cursor-pointer"
                )}
                disabled={isChangingChain || isSelected}
                onClick={() => setSelectedChain(chainId)}
              >
                <ImageWithDefault
                  src={details.logo}
                  alt={details.name}
                  width={16}
                  height={16}
                  className="rounded-full h-4 w-4 object-contain"
                />
                <span className="flex-1 text-sm">{details.name}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-secondary-500 opacity-90" />
                )}
              </DropdownMenuItem>
            )
          }
          return null
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 