'use client'

import React from 'react'
import { motion } from 'motion/react'
import { HeadingText, Label, BodyText } from '@/components/ui/typography'
import ImageWithDefault from '@/components/ImageWithDefault'
import { ExternalLink } from 'lucide-react'
import ChainSelector from '@/components/ChainSelector'
import { useChain } from '@/context/chain-context'
import { cn } from '@/lib/utils'

export default function PageHeader() {
    const { selectedChain, chainDetails } = useChain()
    const currentChainDetails = chainDetails[selectedChain as keyof typeof chainDetails]
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-3"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <ImageWithDefault
                        src={'/images/logos/superlend-rounded.svg'}
                        alt="Bluechip Stable SuperFund"
                        width={28}
                        height={28}
                    />
                    <HeadingText level="h4" weight="medium" className="mr-1 text-gray-800">
                        Bluechip Stable SuperFund
                    </HeadingText>
                </div>
                
                <div className="network-controls inline-flex items-center bg-white rounded-md border border-gray-200 shadow-sm h-8">
                    <div className="flex items-center pl-3 pr-1.5">
                        <BodyText level="body2" weight="medium" className="text-gray-600 mr-1.5 whitespace-nowrap">
                            Network
                        </BodyText>
                        <ChainSelector />
                    </div>
                    
                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                    
                    <a
                        className="flex items-center gap-1.5 hover:bg-gray-50 py-1 px-3 h-full rounded-r-[5px] transition-colors text-secondary-500"
                        href={`${currentChainDetails?.explorerUrl}${currentChainDetails?.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="text-xs font-medium uppercase whitespace-nowrap">
                            View Contract
                        </span>
                        <ExternalLink
                            size={11}
                            className="stroke-current opacity-90"
                        />
                    </a>
                </div>
            </div>
        </motion.div>
    )
}
