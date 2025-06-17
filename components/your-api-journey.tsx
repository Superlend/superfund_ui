'use client'

import { motion } from "motion/react"
import React, { useEffect, useMemo, useState } from "react"
import { BodyText, HeadingText } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import InfoTooltip from "@/components/tooltips/InfoTooltip"
import { Trophy, ChartNoAxesCombined, Info } from "lucide-react"
import { useVaultHook } from "@/hooks/vault_hooks/vaultHook"
import { useGetEffectiveApy } from "@/hooks/vault_hooks/useGetEffectiveApy"
import { VAULT_ADDRESS_MAP } from "@/lib/constants"
import { useChain } from "@/context/chain-context"
import { useApyData } from "@/context/apy-data-provider"
import useGetBoostRewards from "@/hooks/useGetBoostRewards"
import { BoostRewardResponse } from "@/queries/get-boost-rewards-api"
import { useWalletConnection } from "@/hooks/useWalletConnection"

export default function YourApiJourney() {
    const { walletAddress } = useWalletConnection()
    const { selectedChain, chainDetails } = useChain()
    const { spotApy, isLoading: isLoadingSpotApy, error: errorSpotApy } = useVaultHook()
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chain_id: selectedChain || 0
    })
    // const { boostApy: BOOST_APY, isLoading: isLoadingBoostApy } = useApyData()
    const { data: boostRewardsData, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
        vaultAddress: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chainId: selectedChain,
        userAddress: walletAddress
    })
    const BOOST_APY = boostRewardsData?.reduce((acc: number, curr: BoostRewardResponse) => acc + (curr.boost_apy / 100), 0) ?? 0
    const TOTAL_SPOT_APY = useMemo(() => {
        return Number(spotApy ?? 0) + Number(effectiveApyData?.rewards_apy ?? 0) + Number(BOOST_APY ?? 0)
    }, [spotApy, effectiveApyData, BOOST_APY])
    const TOTAL_VAULT_APY = Number(effectiveApyData?.total_apy ?? 0) + Number(BOOST_APY ?? 0)

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-4 shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-12 hover:scale-110">
                        <ChartNoAxesCombined className="h-5 w-5 text-green-600 drop-shadow-sm animate-pulse" />
                    </div>
                    <HeadingText level="h5" weight="medium" className="text-gray-800 flex items-center gap-1">
                        Your APY Status
                        <InfoTooltip
                            label={
                                <BodyText level="body2" weight="medium" className="cursor-help">
                                    💡
                                </BodyText>
                            }
                            content={
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-1">
                                        <Info className="text-secondary-500 w-4 h-4" />
                                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                                            Understanding Your APY
                                        </HeadingText>
                                    </div>
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        When you deposit into SuperFund, your earnings (APY) don&apos;t start at the full rate right away.
                                    </BodyText>
                                    <BodyText level="body2" weight="normal" className="text-gray-600">
                                        This is due to our yield ramp-up system, which gradually releases yield over 7 days for stability.
                                    </BodyText>
                                </div>
                            }
                        />
                    </HeadingText>
                </div>
                <BodyText level="body2" weight="normal" className="text-gray-600 mb-6">
                    Your yield may dip or rise temporarily as others deposit or withdraw.
                </BodyText>

                {!isLoadingSpotApy && !isLoadingEffectiveApy && !errorSpotApy && !isErrorEffectiveApy && effectiveApyData ? (
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <motion.div
                            className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="flex flex-col">
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Current: {Number(TOTAL_SPOT_APY).toFixed(2)}%
                                </BodyText>
                                <BodyText level="body3" weight="medium" className="text-gray-600">
                                    Spot APY
                                </BodyText>
                            </div>
                            <div className="flex flex-col text-right">
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Target: {Number(TOTAL_VAULT_APY).toFixed(2)}%
                                </BodyText>
                                <BodyText level="body3" weight="medium" className="text-gray-600">
                                    Vault APY
                                </BodyText>
                            </div>
                        </motion.div>

                        <div className="space-y-3">
                            <div className="relative">
                                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg relative overflow-hidden"
                                        initial={{ width: "0%" }}
                                        whileInView={{ width: `${Math.min((Number(TOTAL_SPOT_APY) / Number(TOTAL_VAULT_APY)) * 100, 100)}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-transparent rounded-full"></div>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{
                                                duration: 2,
                                                delay: 2.0,
                                                ease: "easeInOut",
                                                repeat: Infinity,
                                                repeatDelay: 4
                                            }}
                                        />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                    </motion.div>
                                </div>
                            </div>
                            <motion.div
                                className="flex justify-between"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 1.0 }}
                            >
                                <BodyText level="body2" weight="normal" className="text-gray-500">
                                    0%
                                </BodyText>
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 1.2 }}
                                    className="flex items-center gap-2"
                                >
                                    <BodyText level="body2" weight="medium" className="text-green-600 font-semibold">
                                        {((Number(TOTAL_SPOT_APY) / Number(TOTAL_VAULT_APY)) * 100).toFixed(1)}% Progress
                                    </BodyText>
                                    {(((Number(TOTAL_SPOT_APY) / Number(TOTAL_VAULT_APY)) * 100) > 100) &&
                                        <InfoTooltip
                                            label={
                                                <Trophy className="w-4 h-4 text-yellow-600" />
                                            }
                                            content={
                                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                                    Additional <span className="font-semibold text-yellow-600">{(((Number(TOTAL_SPOT_APY) / Number(TOTAL_VAULT_APY)) * 100) - 100).toFixed(2)}%</span> loyalty bonus APR is being streamed to you
                                                </BodyText>
                                            }
                                        />}
                                </motion.div>
                                <BodyText level="body2" weight="normal" className="text-gray-500">
                                    100%
                                </BodyText>
                            </motion.div>
                        </div>

                        {/* <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 1.3 }}
                                >
                                    // Ignore this tooltip for now
                                    <InfoTooltip
                                        label={
                                            <BodyText level="body3" weight="medium" className="text-blue-600 cursor-help">
                                                💡 Learn about APY ramp-up
                                            </BodyText>
                                        }
                                        content={
                                            <div className="space-y-2">
                                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                                    Vault APY increases over time as your funds get allocated across optimized protocols.
                                                </BodyText>
                                                <BodyText level="body3" weight="normal" className="text-gray-500">
                                                    <a
                                                        href={APY_RAMP_UP_EXPLANATION_DOCUMENTATION_LINK}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Learn more →
                                                    </a>
                                                </BodyText>
                                            </div>
                                        }
                                    />
                                    <ExternalLink
                                        className="text-yellow-600"
                                        href={APY_RAMP_UP_EXPLANATION_DOCUMENTATION_LINK}
                                        suffixIcon={<SquareArrowOutUpRight className="w-3 h-3 text-blue-600" />}
                                        showIcon={false}
                                    >
                                        <span className="text-blue-600 text-sm font-normal">
                                            💡 Learn about APY ramp-up
                                        </span>
                                    </ExternalLink>
                                </motion.div> */}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-4" />
                        <Skeleton className="h-3 w-full rounded-4" />
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-16 rounded-4" />
                            <Skeleton className="h-4 w-20 rounded-4" />
                            <Skeleton className="h-4 w-16 rounded-4" />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
