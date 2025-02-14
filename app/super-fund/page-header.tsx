'use client'

import React from 'react'
import { motion } from 'motion/react'
import { HeadingText, Label } from '@/components/ui/typography'
import useIsClient from '@/hooks/useIsClient'
import { Skeleton } from '@/components/ui/skeleton'
import ImageWithDefault from '@/components/ImageWithDefault'
import { Badge } from '@/components/ui/badge'

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
                    </div>
                </Badge>
            </div>
        </motion.div>
    )
}
