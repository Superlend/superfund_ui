'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { HeadingText, BodyText } from '@/components/ui/typography'
import ImageWithDefault from '@/components/ImageWithDefault'
import ChainSelector from '@/components/ChainSelector'
import { useChain } from '@/context/chain-context'
import ExternalLink from '@/components/ExternalLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRightIcon, ReceiptText, SendHorizontal } from 'lucide-react'
import { useActiveAccount } from 'thirdweb/react'
import TransferDialog from '@/components/dialogs/TransferDialog'

export default function PageHeader() {
    const { selectedChain, chainDetails } = useChain()
    const currentChainDetails = chainDetails[selectedChain as keyof typeof chainDetails]
    const activeAccount = useActiveAccount();
    const isWalletConnected = !!activeAccount;

    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-3"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col sm:flex-row items-start gap-2">
                    <ImageWithDefault
                        src={'/images/logos/superlend-rounded.svg'}
                        alt="SuperFund"
                        width={28}
                        height={28}
                        className="mt-0.5 sm:mt-0"
                    />
                    <div className="w-full">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <HeadingText level="h4" weight="medium" className="mr-1 text-gray-800">
                                USDC SuperFund
                            </HeadingText>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="green" size="md">
                                    Low Risk
                                </Badge>
                                <div className="network-controls inline-flex items-center bg-white rounded-3 border border-gray-200 shadow-sm h-6 gap-1 pr-1 w-fit">
                                    <ChainSelector />
                                </div>
                            </div>
                        </div>
                        <BodyText level="body2" weight="medium" className="text-gray-600 max-sm:mt-2">
                            Your stablecoin savings account, optimized for yield.
                        </BodyText>
                    </div>
                </div>
                {isWalletConnected && (
                    <div className="flex items-center gap-2 max-md:mt-4 max-md:mb-2">
                        <Button
                            variant="primaryOutline"
                            size="sm"
                            onClick={() => setIsTransferDialogOpen(true)}
                            className="flex items-center gap-1 group max-md:flex-1"
                        >
                            <SendHorizontal className="w-4 h-4" />
                            Send
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            asChild
                        >
                            <Link
                                href={`/super-fund/${currentChainDetails.name.toLowerCase()}/statement`}
                                className="flex items-center gap-1 group max-md:flex-1"
                            >
                                <ReceiptText className="w-4 h-4" />
                                View Statement
                                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
            <TransferDialog
                open={isTransferDialogOpen}
                setOpen={setIsTransferDialogOpen}
            />
        </motion.div>
    )
}
