'use client'

import React from 'react'
import { motion } from 'motion/react'
import { HeadingText, Label } from '@/components/ui/typography'
import useIsClient from '@/hooks/useIsClient'
import { Skeleton } from '@/components/ui/skeleton'
import ImageWithDefault from '@/components/ImageWithDefault'
import { Badge } from '@/components/ui/badge'
import { ArrowRightIcon } from 'lucide-react'

export default function PageHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
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
                <Badge
                    size="md"
                    className="border-0 flex items-center justify-between gap-[16px] px-[6px] w-fit max-w-[400px]"
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src={
                                'https://superlend-assets.s3.ap-south-1.amazonaws.com/base.svg'
                            }
                            alt={`Base`}
                            width={16}
                            height={16}
                            className="object-contain shrink-0 max-w-[16px] max-h-[16px]"
                        />
                        <Label
                            weight="medium"
                            className="leading-[0] shrink-0 capitalize"
                        >
                            Base
                        </Label>
                        <a
                            className="inline-flex w-fit h-full rounded-2 ring-1 ring-gray-300 items-center gap-1 hover:bg-secondary-100/15 py-1 px-2"
                            href={"https://basescan.org/address/0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B"}
                            target="_blank"
                        >
                            <span className="uppercase text-secondary-500 font-medium text-[11px] leading-[1]">
                                vault
                            </span>
                            <ArrowRightIcon
                                height={14}
                                width={14}
                                className="stroke-secondary-500 -rotate-45"
                            />
                        </a>
                    </div>
                </Badge>
            </div>
        </motion.div>
    )
}
