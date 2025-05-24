'use client'

import CustomAlert from '@/components/alerts/CustomAlert'
import { AnimatedNumber } from '@/components/animations/animated_number'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import TooltipText from '@/components/tooltips/TooltipText'
import { Skeleton } from '@/components/ui/skeleton'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { useApyData } from '@/context/apy-data-provider'
import { useChain } from '@/context/chain-context'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import useGetDailyEarningsHistory from '@/hooks/useGetDailyEarningsHistory'
import useIsClient from '@/hooks/useIsClient'
import useTransactionHistory from '@/hooks/useTransactionHistory'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import { useHistoricalData } from '@/hooks/vault_hooks/useHistoricalDataHook'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useHistoricalDataCompat } from '@/hooks/vault_hooks/useVaultCompat'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { useRewardsHook } from '@/hooks/vault_hooks/vaultHook'
import { starVariants } from '@/lib/animations'
import { VAULT_ADDRESS, VAULT_ADDRESS_MAP } from '@/lib/constants'
import { getRewardsTooltipContent } from '@/lib/ui/getRewardsTooltipContent'
import { abbreviateNumber, convertNegativeToZero, getBoostApy, hasNoDecimals } from '@/lib/utils'
import { Period } from '@/types/periodButtons'
import { Expand, Lock, Maximize2, Minimize2, Percent } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'

type VaultStatsProps = {
    days_7_avg_total_apy: number
    days_7_avg_base_apy: number
    days_7_avg_rewards_apy: number
}

export default function VaultStats() {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const { selectedChain, chainDetails } = useChain()
    // const { data: boostRewardsData, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
    //     vaultAddress: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
    //     chainId: selectedChain
    // })
    const { boostApy: BOOST_APY, isLoading: isLoadingBoostApy } = useApyData()
    const { userMaxWithdrawAmount, isLoading: isLoadingUserMaxWithdrawAmount, error: errorUserMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chain_id: selectedChain
    })
    const { isClient } = useIsClient()
    const getProtocolIdentifier = () => {
        if (!selectedChain) return ''
        return chainDetails[selectedChain as keyof typeof chainDetails]?.contractAddress || ''
    }
    const protocolId = getProtocolIdentifier()
    const { data: { capital, interest_earned }, isLoading: isLoadingPositionDetails } = useTransactionHistory({
        protocolIdentifier: protocolId,
        chainId: selectedChain || 0,
        walletAddress: walletAddress || '',
        refetchOnTransaction: true
    })
    const {
        data: dailyEarningsHistoryData,
        isLoading: isLoadingDailyEarningsHistory,
        isError: isErrorDailyEarningsHistory
    } = useGetDailyEarningsHistory({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        user_address: walletAddress?.toLowerCase() as `0x${string}`,
    })
    const totalInterestEarned = useMemo(() => {
        return dailyEarningsHistoryData?.reduce((acc: number, item: any) => acc + item.earnings, 0) ?? 0
    }, [dailyEarningsHistoryData])
    // const { rewards, totalRewardApy, isLoading: isLoadingRewards, error: errorRewards } = useRewardsHook()
    // const { days_7_avg_base_apy, days_7_avg_rewards_apy, days_7_avg_total_apy, isLoading: isLoading7DayAvg, error: error7DayAvg } = useHistoricalData({
    //     chain_id: selectedChain
    // })
    const isLoadingSection = !isClient;
    const TOTAL_APY = Number((effectiveApyData?.rewards_apy ?? 0)) + Number(effectiveApyData?.base_apy ?? 0) + Number(BOOST_APY ?? 0)
    const positionBreakdownList = [
        {
            id: 'capital',
            label: 'Capital',
            value: abbreviateNumber(convertNegativeToZero(Number(capital ?? 0)))
        },
        {
            id: 'interest-earned',
            label: 'Interest earned',
            value: abbreviateNumber(convertNegativeToZero(Number(totalInterestEarned ?? 0))),
            description: 'Total interest earned since your first deposit.',
            tooltipContent: () => {
                return (
                    <BodyText level="body2" weight="normal" className="text-gray-600">
                        Total interest earned since your first deposit.
                    </BodyText>
                )
            }
        }
    ]

    const vaultStats = [
        {
            id: 'my-position',
            title: 'My Position',
            value: isWalletConnected ? `$${Number(userMaxWithdrawAmount).toFixed(4)}` : '',
            show: true,
            isLoading: isWalletConnected && isLoadingUserMaxWithdrawAmount,
            error: errorUserMaxWithdrawAmount,
            positionDetailsTooltipContent: () => {
                return (
                    <div className="flex flex-col divide-y divide-gray-400">
                        <BodyText
                            level="body1"
                            weight="medium"
                            className="py-2 text-gray-800"
                        >
                            Position details
                        </BodyText>
                        {positionBreakdownList.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-[100px] py-2"
                            >
                                <div className="flex items-center gap-1">
                                    <Label weight="medium" className="text-gray-800 shrink-0">
                                        {item.label}
                                    </Label>
                                    {item.tooltipContent &&
                                        <InfoTooltip
                                            content={item.tooltipContent && item.tooltipContent()}
                                        />}
                                </div>
                                <BodyText level="body3" weight="medium" className="text-gray-800 shrink-0">
                                    {index > 0 ? '+' : ''}{' '}${item.value}
                                </BodyText>
                            </div>
                        ))}
                        <div
                            className="flex items-center justify-between gap-[100px] py-2"
                        >
                            <div className="flex items-center gap-1">
                                <Label weight="medium" className="text-gray-800">
                                    Position
                                </Label>
                            </div>
                            <BodyText level="body3" weight="medium" className="text-gray-800">
                                ={' '}${Number(userMaxWithdrawAmount).toFixed(4)}
                            </BodyText>
                        </div>
                    </div>
                )
            },
        },
        {
            id: 'effective-apy',
            title: 'APY',
            titleTooltipContent: () => {
                return (
                    <>
                        <BodyText level="body2" weight="normal" className="text-gray-600 mb-2">
                            The Vault APY is calculated as the weighted average of the spot APYs from the underlying protocols where liquidity is deployed.
                        </BodyText>
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            The displayed APY is an estimate and may fluctuate based on the performance of these protocols. It is not fixed or guaranteed.
                        </BodyText>
                    </>
                )
            },
            value: `${(TOTAL_APY).toFixed(2)}%`,
            show: true,
            hasRewards: true,
            rewardsTooltipContent: getRewardsTooltipContent({
                baseRateFormatted: abbreviateNumber(effectiveApyData?.base_apy),
                rewardsCustomList: [
                    {
                        key: 'rewards_apy',
                        key_name: 'Rewards APY',
                        value: abbreviateNumber(effectiveApyData?.rewards_apy),
                    },
                    {
                        key: 'superlend_rewards_apy',
                        key_name: 'Superlend USDC Reward',
                        value: abbreviateNumber(BOOST_APY ?? 0, 0),
                        logo: "/images/tokens/usdc.webp"
                    },
                ],
                apyCurrent: TOTAL_APY,
                positionTypeParam: 'lend',
                note: () => {
                    return (
                        <div className="pt-2">
                            <CustomAlert
                                variant="info"
                                size="xs"
                                description={
                                    <BodyText level="body3" weight="normal" className="text-gray-800">
                                        Note: Superlend Rewards are for a limited period. Please join our <Link href="https://discord.com/invite/superlend" target="_blank" className="text-secondary-500">Discord</Link> to get more info.
                                    </BodyText>
                                }
                            />
                        </div>
                    )
                }
            }),
            boostRewardsTooltipContent: () => {
                return (
                    <div>
                        <BodyText
                            level="body1"
                            weight="medium"
                            className="text-gray-800 flex items-center gap-1 mb-2"
                        >
                            <ImageWithDefault
                                src={'/images/logos/superlend-rounded.svg'}
                                alt="SuperFund logo"
                                width={24}
                                height={24}
                                className="hover:-translate-y-1 transition-all duration-200"
                            />
                            Boosted USDC APY
                        </BodyText>
                        <BodyText level="body2" weight="normal" className="text-gray-600">
                            Boosted USDC APY are additional rewards added to the APY by SuperFund.
                        </BodyText>
                    </div>
                )
            },
            isLoading: isLoadingEffectiveApy,
            error: isErrorEffectiveApy,
        },
        // {
        //     id: 'spot-apy',
        //     title: 'Spot APY',
        //     titleTooltipContent: 'The current interest rate earned by users.',
        //     value: `${(Number(spotApy) + Number(totalRewardApy)).toFixed(2)}%`,
        //     show: true,
        //     hasRewards: true,
        //     rewardsTooltipContent: getRewardsTooltipContent({
        //         baseRateFormatted: spotApy,
        //         rewards: rewards,
        //         apyCurrent: Number(spotApy) + Number(totalRewardApy),
        //         positionTypeParam: 'lend',
        //     }),
        //     // isLoading: isLoadingVault || isLoadingRewards,
        //     error: !!errorVault || !!errorRewards,
        // },
        // {
        //     id: '7d-apy',
        //     title: 'APY',
        //     titleTooltipContent: () => {
        //         return (
        //             <>
        //                 <BodyText level="body2" weight="normal" className="text-gray-600 mb-2">
        //                     The APY is calculated using the trailing one-week average of daily protocol returns, including the rewards from underlying protocols.
        //                 </BodyText>
        //                 <BodyText level="body2" weight="normal" className="text-gray-600">
        //                     The displayed APY is an estimate and may fluctuate based on protocol performance. It is not a fixed or guaranteed rate.
        //                 </BodyText>
        //             </>
        //         )
        //     },
        //     value: `${abbreviateNumber(days_7_avg_total_apy)}%`,
        //     show: true,
        //     hasRewards: true,
        //     rewardsTooltipContent: getRewardsTooltipContent({
        //         baseRateFormatted: days_7_avg_base_apy.toFixed(2),
        //         rewardsCustomList: [{
        //             key: 'rewards_apy',
        //             key_name: 'Rewards APY',
        //             value: days_7_avg_rewards_apy.toFixed(2),
        //         }],
        //         apyCurrent: days_7_avg_total_apy,
        //     }),
        //     isLoading: isLoading7DayAvg,
        //     error: error7DayAvg,
        // },
        // {
        //     id: 'tvl',
        //     title: 'TVL',
        //     value: '$' + Number(totalAssets).toFixed(4),
        //     show: true,
        //     error: !!errorVault,
        // },
    ]

    if (isLoadingSection) {
        return (
            <div className="flex items-center justify-between gap-4">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        className="flex flex-col items-start gap-2 w-full max-w-[250px]"
                        key={item}
                    >
                        <Skeleton className="h-10 w-full rounded-4" />
                        <Skeleton className="h-7 w-[80%] rounded-4" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <section>
            {/* Second row - remaining items with balanced layout */}
            <div className="flex flex-wrap gap-8">
                {vaultStats.map((item, index) => (
                    <motion.div
                        key={index}
                        className="flex-1 basis-[180px]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.2,
                            ease: 'easeOut',
                        }}
                    >
                        {/* For My Position when wallet is not connected, show compact layout */}
                        {(item.id === 'my-position' && !isWalletConnected) ? (
                            <div className="flex flex-col gap-2 h-full justify-between">
                                <BodyText level="body1" weight="normal" className="text-gray-600">
                                    {item.title}
                                </BodyText>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <HeadingText level="h3" weight="medium" className="text-gray-600/40">$</HeadingText>
                                        <Lock className="h-5 w-5 text-gray-600/40" />
                                    </div>
                                    <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
                                        <ConnectWalletButton />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 h-full justify-between">
                                {/* Standard title section for all other cases */}
                                {item.titleTooltipContent &&
                                    <InfoTooltip
                                        label={
                                            <BodyText
                                                level="body1"
                                                weight="normal"
                                                className="text-gray-600"
                                            >
                                                <TooltipText>
                                                    {item.title}
                                                </TooltipText>
                                            </BodyText>
                                        }
                                        content={item.titleTooltipContent()}
                                    />
                                }
                                {!item.titleTooltipContent &&
                                    <BodyText
                                        level="body1"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {item.title}
                                    </BodyText>
                                }

                                {/* My Position with wallet connected */}
                                {(item.id === 'my-position' && isWalletConnected) && (
                                    <HeadingText level="h3" weight="medium">
                                        {!item.isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center">
                                                    <AnimatedNumber value={item.value} />
                                                </div>
                                                <InfoTooltip
                                                    label={
                                                        <div className="group bg-secondary-100/20 rounded-2 h-6 w-6 p-1">
                                                            <Maximize2 className="h-4 w-4 text-secondary-300" />
                                                        </div>
                                                    }
                                                    content={item.positionDetailsTooltipContent && item.positionDetailsTooltipContent()}
                                                />
                                            </div>
                                        ) : (
                                            <Skeleton className="h-10 w-full rounded-4" />
                                        )}
                                    </HeadingText>
                                )}

                                {/* APY with rewards */}
                                {item.hasRewards &&
                                    <div className="flex items-center gap-2">
                                        <HeadingText level="h3" weight="medium">
                                            {!item.isLoading &&
                                                <div className="flex items-center">
                                                    <AnimatedNumber value={item.value} />
                                                </div>
                                            }
                                            {item.isLoading &&
                                                <Skeleton className="h-7 w-full min-w-[60px] rounded-4 mt-1" />
                                            }
                                        </HeadingText>
                                        <InfoTooltip
                                            label={
                                                <motion.svg width="22" height="22" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <motion.path
                                                        variants={starVariants}
                                                        animate="first"
                                                        d="M3.98987 0C3.98987 0 4.2778 1.45771 4.90909 2.08475C5.54037 2.71179 7 2.98987 7 2.98987C7 2.98987 5.54229 3.2778 4.91525 3.90909C4.28821 4.54037 4.01013 6 4.01013 6C4.01013 6 3.7222 4.54229 3.09091 3.91525C2.45963 3.28821 1 3.01013 1 3.01013C1 3.01013 2.45771 2.7222 3.08475 2.09091C3.71179 1.45963 3.98987 0 3.98987 0Z"
                                                        fill="#FFC007"
                                                    />
                                                    <motion.path
                                                        variants={starVariants}
                                                        animate="second"
                                                        d="M1.49493 4C1.49493 4 1.6389 4.72886 1.95454 5.04238C2.27019 5.35589 3 5.49493 3 5.49493C3 5.49493 2.27114 5.6389 1.95762 5.95454C1.64411 6.27019 1.50507 7 1.50507 7C1.50507 7 1.3611 6.27114 1.04546 5.95762C0.729813 5.64411 0 5.50507 0 5.50507C0 5.50507 0.728857 5.3611 1.04238 5.04546C1.35589 4.72981 1.49493 4 1.49493 4Z"
                                                        fill="#FFC007"
                                                    />
                                                    <motion.path
                                                        variants={starVariants}
                                                        animate="third"
                                                        d="M0.498311 3C0.498311 3 0.5463 3.24295 0.651514 3.34746C0.756729 3.45196 1 3.49831 1 3.49831C1 3.49831 0.757048 3.5463 0.652542 3.65151C0.548035 3.75673 0.501689 4 0.501689 4C0.501689 4 0.4537 3.75705 0.348486 3.65254C0.243271 3.54804 0 3.50169 0 3.50169C0 3.50169 0.242952 3.4537 0.347458 3.34849C0.451965 3.24327 0.498311 3 0.498311 3Z"
                                                        fill="#FFC007"
                                                    />
                                                </motion.svg>
                                            }
                                            content={item.rewardsTooltipContent}
                                        />
                                        {/* {(!item.isLoading && (item.id === 'effective-apy') && (BOOST_APY > 0)) && (
                                            <>
                                                <HeadingText level="h3" weight="medium">+</HeadingText>
                                                <div className="flex items-center gap-2">
                                                    <HeadingText level="h3" weight="medium">
                                                        <div className="flex items-center">
                                                            <AnimatedNumber value={BOOST_APY.toFixed(hasNoDecimals(BOOST_APY) ? 0 : 2)} />%
                                                        </div>
                                                    </HeadingText>
                                                    <InfoTooltip
                                                        label={
                                                            <ImageWithDefault
                                                                src={'/images/tokens/usdc.webp'}
                                                                alt="SuperFund logo"
                                                                width={22}
                                                                height={22}
                                                                className="mt-0.5 sm:mt-0 hover:-translate-y-1 transition-all duration-200 -mb-1.5"
                                                            />
                                                        }
                                                        content={item.boostRewardsTooltipContent && item.boostRewardsTooltipContent()}
                                                    />
                                                </div>
                                            </>
                                        )} */}
                                    </div>
                                }

                                {/* Standard value display for non-special cases */}
                                {!item.hasRewards && item.id !== 'my-position' &&
                                    <HeadingText level="h3" weight="medium">
                                        {!item.isLoading &&
                                            <AnimatedNumber value={item.value} />
                                        }
                                        {item.isLoading &&
                                            <Skeleton className="h-7 w-full min-w-[60px] rounded-4 mt-1" />
                                        }
                                    </HeadingText>
                                }
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* First row - only first item with larger font size */}
            {/* <div className="flex justify-start ml-4">
                {vaultStats.slice(0, 1).map((item, index) => (
                    <motion.div
                        key={index}
                        className="block w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.2,
                            ease: 'easeOut',
                        }}
                    >
                        {item.titleTooltipContent &&
                            <InfoTooltip
                                label={
                                    <BodyText
                                        level="body1"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        <TooltipText>
                                            {item.title}
                                        </TooltipText>
                                    </BodyText>
                                }
                                content={item.titleTooltipContent}
                            />
                        }
                        {!item.titleTooltipContent &&
                            <BodyText
                                level="body1"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {item.title}
                            </BodyText>
                        }
                        {isWalletConnected ? (
                            <HeadingText level="h1" weight="medium">
                                {!item.isLoading ? (
                                    <AnimatedNumber value={item.value} />
                                ) : (
                                    <Skeleton className="h-10 w-full rounded-4" />
                                )}
                            </HeadingText>
                        ) : (
                            <div className="flex items-center gap-4">
                                <InfoTooltip
                                    label={
                                        <div className="flex items-center gap-1">
                                            <HeadingText level="h1" weight="medium" className="text-gray-600/40">$</HeadingText>
                                            <Lock className="h-6 w-6 text-gray-600/40" />
                                        </div>
                                    }
                                    content="Connect your wallet to view your position."
                                />
                                <div className="mt-1 transform transition-all duration-200 hover:translate-y-[-2px]">
                                    <ConnectWalletButton />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div> */}
        </section>
    )
}
