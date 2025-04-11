'use client'

import React from 'react'
import { motion } from 'motion/react'
import { HeadingText, BodyText } from '@/components/ui/typography'
import ImageWithDefault from '@/components/ImageWithDefault'
import ChainSelector from '@/components/ChainSelector'
import { useChain } from '@/context/chain-context'
import ExternalLink from '@/components/ExternalLink'
import { Badge } from '@/components/ui/badge'

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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

                <div className="network-controls inline-flex items-center bg-white rounded-3 border border-gray-200 shadow-sm h-8 gap-1 pr-1 w-fit">
                    <ChainSelector />
                    <Badge variant="outline" size="sm" className="flex items-center gap-1">
                        <ExternalLink
                            href={`${currentChainDetails?.explorerUrl}${currentChainDetails?.contractAddress}`}
                            className="leading-none"
                            iconSize={14}
                        >
                            <span className="-mb-0.5">Contract</span>
                        </ExternalLink>
                    </Badge>
                </div>
            </div>
        </motion.div>
    )
}
