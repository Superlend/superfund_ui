'use client'

import { motion } from 'framer-motion'
import { TrendingUp, ArrowUpRight, Zap } from 'lucide-react'
import { BodyText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useActiveAccount } from 'thirdweb/react'

interface CrossSellSuggestionProps {
    depositAmount: number
    tokenSymbol: string
}

export default function CrossSellSuggestion({
    depositAmount,
    tokenSymbol,
}: CrossSellSuggestionProps) {
    const { logEvent } = useAnalytics()
    // const { walletAddress } = useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    // const isWalletConnected = !!account

    const handleExploreAggregator = () => {
        logEvent('cross_sell_aggregator_clicked', {
            depositAmount,
            tokenSymbol,
            walletAddress,
            source: 'post_deposit_success',
        })
        
        // Open in new tab
        window.open('https://app.superlend.xyz', '_blank')
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 rounded-5 p-4"
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                    <div>
                        <BodyText level="body2" weight="medium" className="text-blue-800">
                            Maximize Your DeFi Yields
                        </BodyText>
                        <BodyText level="body3" weight="normal" className="text-blue-600">
                            Looking to deposit somewhere else? Check out our aggregator for the best yields across protocols.
                        </BodyText>
                    </div>

                    {/* Features */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <BodyText level="body3" weight="normal" className="text-blue-600">
                                Compare yields across 50+ protocols
                            </BodyText>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <BodyText level="body3" weight="normal" className="text-blue-600">
                                Auto-optimized strategies
                            </BodyText>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <BodyText level="body3" weight="normal" className="text-blue-600">
                                Risk-adjusted returns
                            </BodyText>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExploreAggregator}
                        className="mt-3 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 flex items-center gap-1"
                    >
                        <span>Explore Aggregator</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </motion.div>
    )
} 