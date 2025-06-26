'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import ImageWithDefault from '@/components/ImageWithDefault'
import ExternalLink from '@/components/ExternalLink'
import { ArrowUpRight } from 'lucide-react'
import useIsClient from '@/hooks/useIsClient'

export default function LiquidityLandBanner() {
    const { isClient } = useIsClient()

    if (!isClient) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full -mt-6 -mb-4"
        >
            <Card className="relative overflow-hidden border-0 shadow-sm h-[72px] sm:h-[72px] bg-gradient-to-r from-blue-500/5 via-teal-500/5 to-cyan-500/5">
                {/* Immersive background with glassmorphism */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-teal-50/80 to-cyan-50/60" />

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-emerald-200/20 to-transparent rounded-full -translate-x-8 -translate-y-8" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-radial from-teal-200/20 to-transparent rounded-full translate-x-6 translate-y-6" />
                </div>

                {/* Liquidity Land logo as background element */}
                <div className="absolute left-1/2 top-1/2 max-md:-translate-x-1/2 -translate-y-1/2 opacity-25 scale-[600%]">
                    <ImageWithDefault
                        src="/icons/liquidity-land.svg"
                        alt=""
                        width={48}
                        height={48}
                        className="text-blue-600"
                    />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 flex items-center justify-between h-full px-3 sm:px-6">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Prominent logo */}
                        <ImageWithDefault
                            src="/icons/liquidity-land.svg"
                            alt="Liquidity Land"
                            width={20}
                            height={20}
                            className="text-blue-600 flex-shrink-0 mt-0.5 sm:w-6 sm:h-6"
                        />

                        {/* Content */}
                        <div className="flex flex-col min-w-0 flex-1">
                            <HeadingText
                                level="h5"
                                weight="semibold"
                                className="text-gray-900 text-xs sm:text-sm leading-tight"
                            >
                                <span className="hidden sm:inline">Boost Your Yield with Liquidity Land</span>
                                <span className="sm:hidden">Boost Your Yield<br />with Liquidity Land</span>
                            </HeadingText>
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-600 text-xs leading-tight hidden sm:block"
                            >
                                Get additional points and boosted yield
                            </BodyText>
                        </div>
                    </div>

                    {/* CTA positioned on the right */}
                    <div className="flex-shrink-0 ml-1 sm:ml-0">
                        <ExternalLink
                            showIcon={false}
                            href="https://app.liquidity.land/project/Superlend"
                            className="hover:no-underline"
                        >
                            <Button
                                size="sm"
                                className="bg-white/90 hover:bg-white text-blue-700 hover:text-blue-800 border-2 md:border-1 border-blue-400 md:border-blue-200/75 hover:border-blue-300 shadow-sm hover:shadow transition-all duration-200 backdrop-blur-sm px-2 sm:px-3"
                                variant="outline"
                            >
                                <span className="flex items-center gap-1 sm:gap-1.5">
                                    <span className="text-xs font-medium">Visit Platform</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </Button>
                        </ExternalLink>
                    </div>
                </div>

                {/* Bottom subtle glow */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" />
            </Card>
        </motion.div>
    )
} 