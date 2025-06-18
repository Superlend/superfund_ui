'use client'

import { Button } from '@/components/ui/button'
import { TPositionType } from '@/types'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    Check,
    InfoIcon,
    LoaderCircle,
    Trophy,
    TrendingUp,
    X,
    Zap,
    Lightbulb,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    abbreviateNumber,
    decimalPlacesCount,
    getExplorerLink,
    getLowestDisplayValue,
    getTruncatedTxHash,
    hasExponent,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import ActionButton from '@/components/common/ActionButton'
import {
    TDepositTx,
    TWithdrawTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import { BigNumber } from 'ethers'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import ImageWithBadge from '@/components/ImageWithBadge'
import ExternalLink from '@/components/ExternalLink'
import { useChain } from '@/context/chain-context'
import sdk from '@farcaster/frame-sdk'
import Image from 'next/image'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import { VAULT_ADDRESS_MAP } from '@/lib/constants'
import SubscribeWithEmail from '../subscribe-with-email'
import { motion, AnimatePresence } from 'framer-motion'
import { checkUserPointsClaimStatus } from '@/app/actions/points'
import toast from 'react-hot-toast'
import FirstDepositToast from '@/components/toasts/FirstDepositToast'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import WithdrawalAlertFlow from '../WithdrawalRetention/WithdrawalAlertFlow'
import PostDepositEngagementToast from '@/components/toasts/PostDepositEngagementToast'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { UNDERSTAND_EARNINGS_ON_SUPERFUND_BLOG_URL } from '@/constants'
import { useActiveAccount, useSwitchActiveWalletChain } from "thirdweb/react"
import { base } from 'thirdweb/chains'

// Function to calculate days until next Tuesday
function getDaysUntilNextTuesday(): number {
    const currentDate = new Date()
    const currentDay = currentDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const tuesday = 2

    // Calculate days until next Tuesday
    let daysUntilTuesday = (tuesday - currentDay + 7) % 7

    // If today is Tuesday, show next Tuesday (7 days)
    if (daysUntilTuesday === 0) {
        daysUntilTuesday = 7
    }

    return daysUntilTuesday
}

export default function SuperVaultTxDialog({
    disabled,
    positionType,
    assetDetails,
    amount,
    setAmount,
    balance,
    open,
    setOpen,
    setActionType,
    userMaxWithdrawAmount,
}: {
    disabled: boolean
    positionType: TPositionType
    assetDetails: any
    amount: string
    balance: string
    setAmount: (amount: string) => void
    open: boolean
    setOpen: (open: boolean) => void
    setActionType?: (actionType: TPositionType) => void
    userMaxWithdrawAmount?: number
}) {
    const {
        depositTx,
        setDepositTx,
        withdrawTx,
        setWithdrawTx,
        initialPosition,
        setInitialPosition,
    } = useTxContext() as TTxContext
    // const { walletAddress, isWalletConnected, handleSwitchChain } =
    //     useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnected = !!account
    const switchChain = useSwitchActiveWalletChain();
    const { selectedChain, chainDetails } = useChain()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isDepositPositionType = positionType === 'deposit'
    const [miniappUser, setMiniAppUser] = useState<any>(null)
    const [pendingEmail, setPendingEmail] = useState('')
    const [showEmailReminder, setShowEmailReminder] = useState(false)
    const [hasSubscribed, setHasSubscribed] = useState(false)
    const [isPointsClaimed, setIsPointsClaimed] = useState(false)
    const [hasShownFirstDepositToast, setHasShownFirstDepositToast] =
        useState(false)
    const [hasEverSeenFirstDepositToast, setHasEverSeenFirstDepositToast] =
        useState(false)
    const { logEvent } = useAnalytics()
    const router = useRouter()

    // Simple scroll state
    const [showScrollButton, setShowScrollButton] = useState(false)

    // Withdrawal retention flow state
    const [hasConsentedToWithdrawal, setHasConsentedToWithdrawal] = useState(false)
    const [showWithdrawalRetention, setShowWithdrawalRetention] = useState(false)

    // Post-deposit engagement flow state - now for toast trigger only
    const [hasTriggeredPostDepositToast, setHasTriggeredPostDepositToast] = useState(false)

    // Simple scroll check
    const checkScroll = (element: HTMLElement) => {
        const canScroll = element.scrollHeight > element.clientHeight
        const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 10
        setShowScrollButton(canScroll && !isAtBottom)
    }

    const scrollToBottom = (element: HTMLElement) => {
        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
    }

    const getScrollableHeight = () => {
        if (isDepositPositionType) {
            return isDepositTxInSuccess ? isDesktop ? 'h-[180px]' : 'h-[200px]' : ''
        }

        return 'h-[320px]'
    }

    useEffect(() => {
        if (open) {
            try {
                const hasEverSubscribed =
                    localStorage.getItem('hasSubscribedToNewsletter') === 'true'
                setHasSubscribed(hasEverSubscribed)

                // Check if user has ever seen the first deposit toast
                const hasSeenToast =
                    localStorage.getItem('hasSeenFirstDepositToast') === 'true'
                setHasEverSeenFirstDepositToast(hasSeenToast)

                // Show withdrawal retention flow for withdrawals
                if (!isDepositPositionType && Number(amount) > 0) {
                    setShowWithdrawalRetention(true)
                } else {
                    setShowWithdrawalRetention(false)
                    setHasConsentedToWithdrawal(false)
                }
            } catch (error) {
                console.warn(
                    'Failed to read subscription status from localStorage:',
                    error
                )
            }
        } else {
            // Reset withdrawal retention state when dialog closes
            setShowWithdrawalRetention(false)
            setHasConsentedToWithdrawal(false)
            // Reset post-deposit toast trigger state when dialog closes
            setHasTriggeredPostDepositToast(false)
        }
    }, [open, isDepositPositionType, amount])

    // Separate useEffect to monitor deposit success state for post-deposit toast
    // useEffect(() => {
    //     if (open &&
    //         isDepositPositionType &&
    //         depositTx.status === 'view' &&
    //         depositTx.isConfirmed &&
    //         depositTx.hash &&
    //         Number(amount) > 0 &&
    //         !hasTriggeredPostDepositToast) {

    //         const timer = setTimeout(() => {
    //             toast.custom((t) => (
    //                 <PostDepositEngagementToast
    //                     depositAmount={Number(amount)}
    //                     currentApy={assetDetails?.asset?.effective_apy || 0}
    //                     tokenSymbol={assetDetails?.asset?.token?.symbol || 'USDC'}
    //                     walletAddress={walletAddress}
    //                     onDismiss={() => toast.dismiss(t.id)}
    //                 />
    //             ), {
    //                 position: 'bottom-right',
    //                 duration: Infinity,
    //             })

    //             setHasTriggeredPostDepositToast(true)
    //         }, 2000)

    //         return () => clearTimeout(timer)
    //     }
    // }, [open, isDepositPositionType, depositTx.status, depositTx.isConfirmed, depositTx.hash, amount, hasTriggeredPostDepositToast, assetDetails, walletAddress])

    useEffect(() => {
        if (
            open &&
            isDepositPositionType &&
            userMaxWithdrawAmount !== undefined
        ) {
            setInitialPosition(userMaxWithdrawAmount)
            setHasShownFirstDepositToast(false)
        }
    }, [open, isDepositPositionType, userMaxWithdrawAmount, setInitialPosition])

    useEffect(() => {
        if (
            !hasShownFirstDepositToast &&
            !hasEverSeenFirstDepositToast &&
            isDepositPositionType &&
            depositTx.status === 'view' &&
            depositTx.isConfirmed &&
            depositTx.hash &&
            initialPosition < 0.01
        ) {
            logEvent('first_deposit_toast_viewed', {
                walletAddress,
                amount,
                positionType,
            })
            const showFirstDepositToast = () => {
                toast.custom((t) => (
                    <FirstDepositToast
                        onDismiss={() => toast.dismiss(t.id)}
                    />
                ), {
                    position: 'bottom-right',
                })

                setHasShownFirstDepositToast(true)

                try {
                    localStorage.setItem('hasSeenFirstDepositToast', 'true')
                    setHasEverSeenFirstDepositToast(true)
                } catch (error) {
                    console.warn(
                        'Failed to save first deposit toast status to localStorage:',
                        error
                    )
                }
            }

            const timeoutId = setTimeout(showFirstDepositToast, 1000)
            return () => clearTimeout(timeoutId)
        }
    }, [
        hasShownFirstDepositToast,
        hasEverSeenFirstDepositToast,
        isDepositPositionType,
        depositTx.status,
        depositTx.isConfirmed,
        depositTx.hash,
        initialPosition,
    ])

    const handleSubscriptionSuccess = () => {
        try {
            localStorage.setItem('hasSubscribedToNewsletter', 'true')
        } catch (error) {
            console.warn(
                'Failed to save subscription status to localStorage:',
                error
            )
            setHasSubscribed(true)
        }
    }

    useEffect(() => {
        const initializeMiniappContext = async () => {
            await sdk.actions.ready()
            const context = await sdk.context
            if (context && context.user) {
                const user = context.user
                setMiniAppUser(user)
            } else {
                setMiniAppUser(null)
            }
        }

        void initializeMiniappContext()
    }, [])

    useEffect(() => {
        const checkPointsStatus = async () => {
            if (walletAddress) {
                const claimed = await checkUserPointsClaimStatus(
                    walletAddress,
                    walletAddress
                )
                setIsPointsClaimed(claimed)
            }
        }
        void checkPointsStatus()
    }, [walletAddress])

    useEffect(() => {
        if (!open) {
            resetDepositWithdrawTx()
        }
        // Reset the tx status when the dialog is closed
        return () => {
            resetDepositWithdrawTx()
        }
    }, [])

    useEffect(() => {
        switchChain(base)
    }, [])

    function resetDepositWithdrawTx() {
        setDepositTx((prev: TDepositTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
            allowanceBN: BigNumber.from(0),
            isRefreshingAllowance: false,
            errorMessage: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
        }))
        setWithdrawTx((prev: TWithdrawTx) => ({
            ...prev,
            status: 'withdraw',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
        }))
        // Reset withdrawal retention state
        setHasConsentedToWithdrawal(false)
        setShowWithdrawalRetention(false)
        // Reset post-deposit toast trigger state
        // setHasTriggeredPostDepositToast(false)
    }

    function handleOpenChange(open: boolean) {
        // If trying to close AND there's an unsaved email in a successful deposit/withdraw state
        if (
            !open &&
            pendingEmail &&
            isDepositPositionType &&
            depositTx.status === 'view' &&
            depositTx.isConfirmed
        ) {
            setShowEmailReminder(true)
            return // Prevent dialog from closing
        }

        // When opening the dialog, reset the amount and the tx status
        setOpen(open)
        // When closing the dialog, reset the amount and the tx status
        if (
            !open &&
            (depositTx.status !== 'approve' || withdrawTx.status !== 'withdraw')
        ) {
            setAmount('')
            setTimeout(() => {
                resetDepositWithdrawTx()
            }, 1000)
            setPendingEmail('') // Reset pendingEmail when closing
        }
    }

    function handleFinalClose() {
        setShowEmailReminder(false)
        setPendingEmail('')
        setOpen(false)
        setAmount('')
        resetDepositWithdrawTx()
    }

    function isShowBlock(status: { deposit: boolean; withdraw: boolean }) {
        return isDepositPositionType ? status.deposit : status.withdraw
    }

    const inputUsdAmount = Number(amount)
    // Number(amount) * Number(assetDetails?.asset?.token?.price_usd)

    function handleInputUsdAmount(amount: string) {
        const amountFormatted = hasExponent(amount)
            ? Math.abs(Number(amount)).toFixed(10)
            : amount.toString()
        const amountFormattedForLowestValue = getLowestDisplayValue(
            Number(amountFormatted)
        )
        return `${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
    }

    const isDepositTxInProgress = depositTx.isPending || depositTx.isConfirming
    const isWithdrawTxInProgress =
        withdrawTx.isPending || withdrawTx.isConfirming

    const isDepositTxInSuccess =
        depositTx.isConfirmed && !!depositTx.hash && depositTx.status === 'view'
    const isWithdrawTxInSuccess =
        withdrawTx.isConfirmed &&
        !!withdrawTx.hash &&
        withdrawTx.status === 'view'

    const isTxInProgress = isDepositTxInProgress || isWithdrawTxInProgress
    const isTxInSuccess = isDepositTxInSuccess || isWithdrawTxInSuccess
    const isTxFailed = false

    const hasDepositTxStarted = depositTx.status === 'view'
    const hasWithdrawTxStarted = withdrawTx.status === 'view'

    const depositTxSpinnerColor = depositTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const withdrawTxSpinnerColor = withdrawTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'

    const canDisplayExplorerLinkWhileLoading = isDepositPositionType
        ? depositTx.hash.length > 0 &&
        (depositTx.isConfirming || depositTx.isPending)
        : withdrawTx.hash.length > 0 &&
        (withdrawTx.isConfirming || withdrawTx.isPending)

    const disableActionButton = disabled || (!isDepositPositionType && showWithdrawalRetention && !hasConsentedToWithdrawal)



    // SUB_COMPONENT: Trigger button to open the dialog
    const triggerButton = (
        <Button
            onClick={() => handleOpenChange(true)}
            disabled={disabled}
            variant="primary"
            className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
        >
            <span className="uppercase leading-[0]">
                {positionType === 'deposit' ? 'Deposit' : 'Withdraw'}
            </span>
            <ArrowRightIcon
                width={16}
                height={16}
                className="stroke-white group-[:disabled]:opacity-50"
            />
        </Button>
    )

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = !isTxInProgress ? (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black shrink-0" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // SHARE SCREEN BUTTONS FOR MINI APP:
    const shareScreenButtons = [
        {
            buttonText:
                positionType === 'withdraw' || isPointsClaimed
                    ? 'Share on Warpcast'
                    : 'Share for a surprise',
            imageSrc: '/icons/share.svg',
            onClick: () => {
                const text = `Just deposited into Superfund by @superlend 📈\nEarning ${assetDetails?.asset?.effective_apy.toFixed(2)}% APY on USDC with intelligent, risk-adjusted vaults.\nLet your capital work smarter.`

                sdk.actions.composeCast({
                    text,
                    embeds:
                        positionType === 'withdraw'
                            ? []
                            : [
                                `https://funds.superlend.xyz?info=${depositTx.hash}:${walletAddress}`,
                            ],
                })
            },
        },
        {
            buttonText: 'Follow us on X',
            imageSrc: '/icons/x.svg',
            onClick: () => sdk.actions.openUrl('https://x.com/SuperlendHQ'),
        },
        {
            buttonText: 'Explore More',
            imageSrc: '/icons/globe.svg',
            onClick: () =>
                sdk.actions.openUrl('https://app.superlend.xyz/discover'),
        },
        {
            buttonText: 'Add to Warpcast',
            imageSrc: '/icons/warpcast.svg',
            onClick: async () => {
                await sdk.actions.addFrame()
                return
            },
        },
    ]

    const handleExploreAggregator = () => {
        logEvent('cross_sell_aggregator_clicked', {
            depositAmount: Number(amount),
            tokenSymbol: assetDetails?.asset?.token?.symbol,
            walletAddress,
            source: 'post_deposit_alert',
        })
        window.open('https://app.superlend.xyz', '_blank')
    }

    const handleSetReminder = () => {
        const depositAmount = Number(amount)
        const tokenSymbol = assetDetails?.asset?.token?.symbol

        logEvent('calendar_reminder_clicked', {
            depositAmount,
            tokenSymbol,
            walletAddress,
            source: 'post_deposit_alert',
        })

        // Create calendar event
        const reminderDate = new Date()
        reminderDate.setDate(reminderDate.getDate() + getDaysUntilNextTuesday())
        const eventTitle = `Claim SuperFund Rewards - ${depositAmount} ${tokenSymbol}`
        const eventDescription = `Time to claim your accrued rewards from your SuperFund deposit.`
        const startDate = reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent('https://funds.superlend.xyz')}`

        window.open(googleCalendarUrl, '_blank')
    }

    const handleViewPortfolioClick = () => {
        router.push('/super-fund/base/?tab=position-details#start')
        setOpen(false)
        return;
    }

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                deposit: true,
                withdraw: true,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        {isDepositPositionType
                            ? `${isDepositTxInSuccess ? 'Deposit Successful' : 'Review Deposit'}`
                            : `${isWithdrawTxInSuccess ? 'Withdraw Successful' : 'Review Withdraw'}`}
                    </HeadingText>
                    // </DialogTitle>
                )}
            {/* Confirmation details UI */}
            {/* {isShowBlock({
                deposit: true,
                withdraw: true,
            }) && (
                    <div className="flex flex-col items-center justify-center gap-[6px]">
                        <ImageWithDefault
                            src={assetDetails?.asset?.token?.logo}
                            alt={assetDetails?.asset?.token?.symbol}
                            width={40}
                            height={40}
                            className="rounded-full max-w-[40px] max-h-[40px]"
                        />
                        <HeadingText
                            level="h3"
                            weight="medium"
                            className="text-gray-800"
                        >
                            {amount} {assetDetails?.asset?.token?.symbol}
                        </HeadingText>
                        {isShowBlock({
                            deposit: depositTx.status === 'view',
                            withdraw: withdrawTx.status === 'view',
                        }) && (
                                <Badge
                                    variant={isTxFailed ? 'destructive' : 'green'}
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isDepositPositionType(positionType) &&
                                        depositTx.status === 'view'
                                        ? 'Deposit'
                                        : 'Withdraw'}{' '}
                                    {isTxFailed ? 'Failed' : 'Successful'}
                                    {!isTxFailed && (
                                        <CircleCheckIcon
                                            width={16}
                                            height={16}
                                            className="stroke-[#00AD31]"
                                        />
                                    )}
                                    {isTxFailed && (
                                        <CircleXIcon
                                            width={16}
                                            height={16}
                                            className="stroke-danger-500"
                                        />
                                    )}
                                </Badge>
                            )}
                        {isShowBlock({
                            deposit:
                                depositTx.status === 'deposit' &&
                                !isDepositTxInProgress,
                            withdraw: false,
                        }) && (
                                <Badge
                                    variant="green"
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    Token approved
                                    <CircleCheckIcon
                                        width={16}
                                        height={16}
                                        className="stroke-[#00AD31]"
                                    />
                                </Badge>
                            )}
                    </div>
                )} */}
        </>
    )

    // SUB_COMPONENT: Content body UI
    const contentBody = (
        <>
            <div className="flex flex-col gap-[12px] justify-start">
                {/* Block 1 */}
                {isShowBlock({
                    deposit: true,
                    withdraw: true,
                }) && (
                        <div className="flex items-center gap-4 px-6 py-2 bg-gray-200 lg:bg-white rounded-5 w-full">
                            <ImageWithBadge
                                mainImg={assetDetails?.asset?.token?.logo || ''}
                                badgeImg={
                                    chainDetails[
                                        selectedChain as keyof typeof chainDetails
                                    ]?.logo
                                }
                                mainImgAlt={assetDetails?.asset?.token?.symbol}
                                badgeImgAlt={
                                    chainDetails[
                                        selectedChain as keyof typeof chainDetails
                                    ]?.name
                                }
                                mainImgWidth={'32'}
                                mainImgHeight={'32'}
                                badgeImgWidth={'12'}
                                badgeImgHeight={'12'}
                                badgeCustomClass={'bottom-[-2px] right-[1px]'}
                            />
                            <div className="flex flex-col items-start gap-0 w-full">
                                <HeadingText
                                    level="h3"
                                    weight="normal"
                                    className="text-gray-800 flex items-center gap-1"
                                >
                                    {Number(amount).toFixed(
                                        decimalPlacesCount(amount)
                                    )}
                                    <span
                                        className="inline-block truncate max-w-[150px]"
                                        title={assetDetails?.asset?.token?.symbol}
                                    >
                                        {assetDetails?.asset?.token?.symbol}
                                    </span>
                                </HeadingText>
                                <div className="flex items-center justify-start gap-1.5">
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        {handleInputUsdAmount(
                                            inputUsdAmount.toString()
                                        )}
                                    </BodyText>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-600 flex items-center gap-1"
                                    >
                                        {
                                            chainDetails[
                                                selectedChain as keyof typeof chainDetails
                                            ]?.name
                                        }
                                    </BodyText>
                                    {/* <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        {PlatformTypeMap[assetDetails?.protocol_type as keyof typeof PlatformTypeMap]}
                                    </BodyText> */}
                                </div>
                            </div>
                        </div>
                    )}
                {/* Block 2 */}
                {isShowBlock({
                    deposit: true,
                    withdraw: false,
                }) &&
                    (<div className="flex flex-col items-center justify-between px-6 bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300 py-1">
                        <div
                            className={`flex items-center justify-between w-full py-1`}
                        >
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                APY
                            </BodyText>
                            <Badge variant="green" size="lg">
                                {abbreviateNumber(
                                    Number(
                                        assetDetails?.asset?.effective_apy
                                    ) ?? 0
                                )}
                                %
                            </Badge>
                        </div>
                        {/* <div
                            className={`flex items-center justify-between gap-1 w-full py-3`}
                        >
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Remaining Balance
                            </BodyText>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-800"
                            >
                                {handleSmallestValue(
                                    (
                                        Number(balance) - Number(amount)
                                    ).toString()
                                )}{' '}
                                {assetDetails?.asset?.token?.symbol}
                            </BodyText>
                        </div> */}
                    </div>)}
                {/* Block 3 */}
                {/* Email subscription for successful deposits */}
                {/* {isShowBlock({
                    deposit:
                        depositTx.status === 'view' &&
                        depositTx.isConfirmed &&
                        !!depositTx.hash,
                    withdraw: false,
                }) && !hasSubscribed && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="bg-gray-200/50 bg-opacity-50 backdrop-blur-sm rounded-5 p-4 w-full my-2"
                        >
                            <SubscribeWithEmail
                                onEmailChange={setPendingEmail}
                                onSubscriptionSuccess={handleSubscriptionSuccess}
                            />
                        </motion.div>
                    )} */}
            </div>
        </>
    )

    // SUB_COMPONENT: Transaction progress and status sections
    const transactionStatusContent = (isTxInProgress || hasDepositTxStarted || hasWithdrawTxStarted) ? (
        <div className="flex-shrink-0 flex flex-col gap-[12px]">
            {/* Block 3 - Deposit and withdraw loading state */}
            {isShowBlock({
                deposit:
                    (depositTx.status === 'approve' &&
                        (isDepositTxInProgress ||
                            (!isDepositTxInProgress &&
                                depositTx.isConfirmed))) ||
                    depositTx.status === 'deposit' ||
                    depositTx.status === 'view',
                withdraw: false,
            }) && (
                    <div className="py-1">
                        {isDepositTxInProgress &&
                            depositTx.status === 'approve' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: 'easeOut',
                                    }}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center justify-start gap-2">
                                        <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className="text-gray-600"
                                        >
                                            {depositTx.isPending &&
                                                'Waiting for confirmation...'}
                                            {depositTx.isConfirming &&
                                                'Approving...'}
                                        </BodyText>
                                    </div>
                                    {depositTx.hash &&
                                        depositTx.status === 'approve' && (
                                            <ExternalLink
                                                href={getExplorerLink(
                                                    depositTx.hash,
                                                    assetDetails?.chain_id ||
                                                    assetDetails?.platform
                                                        ?.chain_id
                                                )}
                                            >
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="text-inherit"
                                                >
                                                    View on explorer
                                                </BodyText>
                                            </ExternalLink>
                                        )}
                                </motion.div>
                            )}
                        {((!isDepositTxInProgress && depositTx.isConfirmed) ||
                            depositTx.status === 'deposit' ||
                            depositTx.status === 'view') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center justify-start gap-2">
                                        <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                            <Check
                                                className="w-5 h-5 stroke-[#013220]/75"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <BodyText
                                            level="body2"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Approval successful
                                        </BodyText>
                                    </div>
                                    {depositTx.hash &&
                                        depositTx.status === 'approve' && (
                                            <ExternalLink
                                                href={getExplorerLink(
                                                    depositTx.hash,
                                                    assetDetails?.chain_id ||
                                                    assetDetails?.platform
                                                        ?.chain_id
                                                )}
                                            >
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="text-inherit"
                                                >
                                                    View on explorer
                                                </BodyText>
                                            </ExternalLink>
                                        )}
                                </motion.div>
                            )}
                    </div>
                )}

            {/* Deposit flow continued - Core transaction status only */}
            {isShowBlock({
                deposit:
                    (depositTx.status === 'deposit' &&
                        (isDepositTxInProgress ||
                            (!isDepositTxInProgress &&
                                depositTx.isConfirmed))) ||
                    depositTx.status === 'view',
                withdraw: false,
            }) && (
                    <div className="py-1">
                        {isDepositTxInProgress && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="flex items-center justify-between gap-2 w-full"
                            >
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {depositTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {depositTx.isConfirming &&
                                            'Depositing...'}
                                    </BodyText>
                                </div>
                                {depositTx.hash &&
                                    (depositTx.isConfirming ||
                                        depositTx.isConfirmed) && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                depositTx.hash,
                                                assetDetails?.chain_id ||
                                                assetDetails?.platform
                                                    ?.chain_id
                                            )}
                                        >
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="text-inherit"
                                            >
                                                View on explorer
                                            </BodyText>
                                        </ExternalLink>
                                    )}
                            </motion.div>
                        )}
                        {((!isDepositTxInProgress && depositTx.isConfirmed) ||
                            (depositTx.status === 'view' &&
                                depositTx.isConfirmed)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="flex items-center justify-between gap-2 w-full"
                                >
                                    <div className="flex items-center justify-start gap-2">
                                        <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                            <Check
                                                className="w-5 h-5 stroke-[#013220]/75"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <BodyText
                                            level="body2"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Deposit successful
                                        </BodyText>
                                    </div>
                                    {depositTx.hash &&
                                        (depositTx.isConfirming ||
                                            depositTx.isConfirmed) && (
                                            <ExternalLink
                                                href={getExplorerLink(
                                                    depositTx.hash,
                                                    assetDetails?.chain_id ||
                                                    assetDetails?.platform
                                                        ?.chain_id
                                                )}
                                            >
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="text-inherit"
                                                >
                                                    View on explorer
                                                </BodyText>
                                            </ExternalLink>
                                        )}
                                </motion.div>
                            )}
                    </div>
                )}

            {/* Withdrawal flow - Core transaction status only */}
            {isShowBlock({
                deposit: false,
                withdraw:
                    (withdrawTx.status === 'view' &&
                        withdrawTx.isConfirmed) ||
                    isWithdrawTxInProgress,
            }) && (
                    <div className="py-1">
                        {isWithdrawTxInProgress && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center justify-start gap-2">
                                    <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {withdrawTx.isPending &&
                                            'Waiting for confirmation...'}
                                        {withdrawTx.isConfirming &&
                                            'Withdrawing...'}
                                    </BodyText>
                                </div>
                                {withdrawTx.hash &&
                                    (withdrawTx.isConfirming ||
                                        withdrawTx.isConfirmed) && (
                                        <ExternalLink
                                            href={getExplorerLink(
                                                withdrawTx.hash,
                                                assetDetails?.chain_id ||
                                                assetDetails?.platform
                                                    ?.chain_id
                                            )}
                                        >
                                            <BodyText
                                                level="body2"
                                                weight="normal"
                                                className="text-inherit"
                                            >
                                                View on explorer
                                            </BodyText>
                                        </ExternalLink>
                                    )}
                            </div>
                        )}
                        {withdrawTx.status === 'view' &&
                            withdrawTx.isConfirmed && (
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <div className="flex items-center justify-start gap-2">
                                        <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                            <Check
                                                className="w-5 h-5 stroke-[#013220]/75"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <BodyText
                                            level="body2"
                                            weight="medium"
                                            className="text-gray-800"
                                        >
                                            Withdraw successful
                                        </BodyText>
                                    </div>
                                    {withdrawTx.hash &&
                                        (withdrawTx.isConfirming ||
                                            withdrawTx.isConfirmed) && (
                                            <ExternalLink
                                                href={getExplorerLink(
                                                    withdrawTx.hash,
                                                    assetDetails?.chain_id ||
                                                    assetDetails
                                                        ?.platform
                                                        ?.chain_id
                                                )}
                                            >
                                                <BodyText
                                                    level="body2"
                                                    weight="normal"
                                                    className="text-inherit"
                                                >
                                                    View on explorer
                                                </BodyText>
                                            </ExternalLink>
                                        )}
                                </div>
                            )}
                    </div>
                )}
        </div>
    ) : null;

    // SUB_COMPONENT: Success-specific content (sharing, email subscription) for scrollable area
    const successSpecificContent = (
        <>
            {/* Sharing buttons for successful deposits/withdrawals (miniapp users) */}
            {((isDepositTxInSuccess || isWithdrawTxInSuccess) && miniappUser) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full flex items-center flex-col justify-start gap-3"
                >
                    {shareScreenButtons.map((config, index) => (
                        <Button
                            key={index}
                            variant="primary"
                            size="lg"
                            className="rounded-[16px] gap-1 w-full flex items-center justify-center py-3 px-6 border-2 border-[#FF5B00] shadow-[0px_-1px_2px_0px_#FFFFFF70_inset] bg-gradient-to-b from-[#FF5B00] to-[#F55700]"
                            onClick={config.onClick}
                        >
                            <Image
                                src={config.imageSrc}
                                alt=""
                                width={18}
                                height={18}
                            />
                            {config.buttonText}
                        </Button>
                    ))}
                </motion.div>
            )}

            {isShowBlock({
                deposit: false,
                withdraw:
                    withdrawTx.status === 'view' &&
                    withdrawTx.isConfirmed &&
                    !!withdrawTx.hash,
            }) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-gray-200 backdrop-blur-sm rounded-5 p-4 w-full"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-start gap-2">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-4 shrink-0">
                                    <Trophy className="w-4 h-4 text-blue-600" />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    More Rewards Are on the Way!
                                </BodyText>
                            </div>
                            <BodyText level="body3" weight="normal" className="text-gray-600">
                                Some of your rewards will become claimable in about {getDaysUntilNextTuesday()} {getDaysUntilNextTuesday() === 1 ? 'day' : 'days'}.
                            </BodyText>
                            <div className="bg-amber-50 rounded-4 p-2 border border-amber-100 flex items-start gap-1">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <BodyText level="body3" weight="normal" className="text-amber-800">
                                    Set a reminder so you don&apos;t miss out when they&apos;re ready!
                                </BodyText>
                            </div>
                            <Button
                                variant="primaryOutline"
                                size="sm"
                                onClick={handleSetReminder}
                                className="w-full h-9 rounded-4 capitalize"
                            >
                                Remind Me in {getDaysUntilNextTuesday()} {getDaysUntilNextTuesday() === 1 ? 'Day' : 'Days'}
                            </Button>
                        </div>
                    </motion.div>
                )}

            {isShowBlock({
                deposit: false,
                withdraw:
                    withdrawTx.status === 'view' &&
                    withdrawTx.isConfirmed &&
                    !!withdrawTx.hash,
            }) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-gray-200 backdrop-blur-sm rounded-5 p-4 w-full"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-start gap-2">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-4 shrink-0">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    Looking for Other Yield Opportunities?
                                </BodyText>
                            </div>

                            <BodyText level="body3" weight="normal" className="text-gray-600">
                                Compare top DeFi yields across 350+ markets, all in one place
                            </BodyText>

                            <Button
                                variant="primaryOutline"
                                size="sm"
                                onClick={handleExploreAggregator}
                                className="w-full h-9 rounded-4 capitalize"
                            >
                                Find New Opportunities
                            </Button>
                        </div>
                    </motion.div>
                )}

            {isShowBlock({
                deposit:
                    depositTx.status === 'view' &&
                    depositTx.isConfirmed &&
                    !!depositTx.hash,
                withdraw: false,
            }) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-gray-200 rounded-5 p-4 w-full"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-start gap-2">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-4 shrink-0">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    How Your Yield Accrues
                                </BodyText>
                            </div>

                            <BodyText level="body3" weight="normal" className="text-gray-600">
                                To ensure fair rewards for everyone, your full yield is unlocked gradually over a short period (called the <span className="font-medium">Yield Ramp-up</span>)
                            </BodyText>

                            <div className="bg-amber-50 rounded-4 p-2 border border-amber-100 flex items-start gap-1">
                                <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <BodyText level="body3" weight="normal" className="text-amber-800">
                                    You&apos;ll start earning immediately, and your yield will reach its full potential in the coming days.
                                    <ExternalLink iconSize={12} href={UNDERSTAND_EARNINGS_ON_SUPERFUND_BLOG_URL}>
                                        <BodyText level="body3" weight="normal" className="text-blue-600 ml-1">
                                            Learn more
                                        </BodyText>
                                    </ExternalLink>
                                </BodyText>
                            </div>

                            {/* <Button
                                variant="primaryOutline"
                                size="sm"
                                onClick={handleViewPortfolioClick}
                                className="w-full h-9 rounded-4 capitalize"
                            >
                                View Portfolio
                            </Button> */}
                        </div>
                    </motion.div>
                )}

            {/* Email subscription for successful deposits */}
            {isShowBlock({
                deposit:
                    depositTx.status === 'view' &&
                    depositTx.isConfirmed &&
                    !!depositTx.hash,
                withdraw: false,
            }) && !hasSubscribed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-gray-200 backdrop-blur-sm rounded-5 p-4 w-full"
                    >
                        <SubscribeWithEmail
                            onEmailChange={setPendingEmail}
                            onSubscriptionSuccess={handleSubscriptionSuccess}
                        />
                    </motion.div>
                )}
        </>
    )

    // SUB_COMPONENT: Scrollable withdrawal retention content
    const withdrawalAlertContent = (
        <>
            {!isDepositPositionType && showWithdrawalRetention && (
                <WithdrawalAlertFlow
                    withdrawalAmount={Number(amount)}
                    currentApy={assetDetails?.asset?.effective_apy || 0}
                    tokenSymbol={assetDetails?.asset?.token?.symbol || 'USDC'}
                    onConsentChange={setHasConsentedToWithdrawal}
                    isVisible={showWithdrawalRetention}
                />
            )}
        </>
    )

    // SUB_COMPONENT: Action button section
    const actionButtonContent = (
        <ActionButton
            disabled={disableActionButton}
            handleCloseModal={handleOpenChange}
            asset={assetDetails}
            amount={amount}
            setActionType={setActionType}
            actionType={positionType}
            cta={
                (isDepositTxInSuccess && isDepositPositionType) ? {
                    text: 'View Portfolio',
                    onClick: handleViewPortfolioClick,
                } : undefined
            }
            walletAddress={walletAddress as `0x${string}`}
        />
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <>
                <Dialog open={open}>
                    <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                    <DialogContent
                        aria-describedby={undefined}
                        className="pt-[25px] max-w-[450px] max-h-[100vh] flex flex-col"
                        showCloseButton={false}
                    >
                        {/* X Icon to close the dialog */}
                        {closeContentButton}

                        {/* Fixed Header */}
                        <DialogHeader className="flex-shrink-0">{contentHeader}</DialogHeader>

                        {/* Fixed Top - Transaction Details */}
                        <div className="flex-shrink-0">
                            {contentBody}
                        </div>

                        {/* Scrollable Middle - Withdrawal Retention Flow OR Success Content */}
                        <div className="relative flex-1">
                            <div
                                className={`${getScrollableHeight()} overflow-y-auto rounded-3`}
                                onScroll={(e) => checkScroll(e.currentTarget)}
                                ref={(el) => {
                                    if (el) {
                                        setTimeout(() => checkScroll(el), 100)
                                    }
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {(!isDepositPositionType && !isWithdrawTxInSuccess) && (
                                        <motion.div
                                            key="withdrawal-alert"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="flex flex-col gap-3"
                                        >
                                            {withdrawalAlertContent}
                                        </motion.div>
                                    )}
                                    {(isDepositTxInSuccess || isWithdrawTxInSuccess) && (
                                        <motion.div
                                            key="success-content"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="flex flex-col gap-3"
                                        >
                                            {successSpecificContent}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Simple scroll button */}
                            {showScrollButton && (
                                <button
                                    onClick={(e) => {
                                        const scrollContainer = e.currentTarget.previousElementSibling as HTMLElement
                                        scrollToBottom(scrollContainer)
                                    }}
                                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary-500">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Fixed Bottom - Action Button */}
                        {transactionStatusContent}
                        <div className={`flex-shrink-0`}>
                            {actionButtonContent}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add email reminder dialog */}
                {showEmailReminder && (
                    <Dialog
                        open={showEmailReminder}
                        onOpenChange={setShowEmailReminder}
                    >
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <HeadingText
                                    level="h4"
                                    weight="medium"
                                    className="text-gray-800 text-center w-fit mx-auto flex items-center gap-2"
                                >
                                    <InfoIcon className="w-5 h-5 text-secondary-500" />
                                    Don&apos;t miss out!
                                </HeadingText>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-800"
                                >
                                    You&apos;ve entered an email but haven&apos;t
                                    submitted it. Would you like to submit now to
                                    stay updated on SuperFund?
                                </BodyText>
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleFinalClose}
                                        className="flex-1"
                                    >
                                        Close anyway
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowEmailReminder(false)
                                            // Find and click the submit button in the email form
                                            setTimeout(() => {
                                                const submitButton =
                                                    document.querySelector(
                                                        '.subscribe-email-form button[type="submit"]'
                                                    )
                                                if (
                                                    submitButton instanceof
                                                    HTMLElement
                                                ) {
                                                    submitButton.click()
                                                }
                                            }, 100)
                                        }}
                                    >
                                        Submit email
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </>
        )
    }

    // Mobile UI
    return (
        <>
            <Drawer open={open} dismissible={false}>
                <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
                <DrawerContent className="w-full p-5 pt-2 dismissible-false max-h-[100vh] flex flex-col gap-3">
                    {/* X Icon to close the drawer */}
                    {closeContentButton}

                    {/* Fixed Header */}
                    <DrawerHeader className="flex-shrink-0">{contentHeader}</DrawerHeader>

                    {/* Fixed Top - Transaction Details */}
                    <div className="flex-shrink-0">
                        {contentBody}
                    </div>

                    {/* Scrollable Middle - Withdrawal Retention Flow OR Success Content */}
                    <div className="relative flex-1">
                        <div
                            className={`${getScrollableHeight()} overflow-y-auto rounded-3`}
                            onScroll={(e) => checkScroll(e.currentTarget)}
                            ref={(el) => {
                                if (el) {
                                    setTimeout(() => checkScroll(el), 100)
                                }
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {(!isDepositPositionType && !isWithdrawTxInSuccess) && (
                                    <motion.div
                                        key="withdrawal-alert-mobile"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="flex flex-col gap-3"
                                    >
                                        {withdrawalAlertContent}
                                    </motion.div>
                                )}
                                {(isDepositTxInSuccess || isWithdrawTxInSuccess) && (
                                    <motion.div
                                        key="success-content-mobile"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="flex flex-col gap-3"
                                    >
                                        {successSpecificContent}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Simple scroll button */}
                        {showScrollButton && (
                            <button
                                onClick={(e) => {
                                    const scrollContainer = e.currentTarget.previousElementSibling as HTMLElement
                                    scrollToBottom(scrollContainer)
                                }}
                                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary-500">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Fixed Bottom - Action Button */}
                    {transactionStatusContent}
                    <div className={`flex-shrink-0`}>
                        {actionButtonContent}
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Add email reminder dialog */}
            {showEmailReminder && (
                <Dialog
                    open={showEmailReminder}
                    onOpenChange={setShowEmailReminder}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <HeadingText
                                level="h4"
                                weight="medium"
                                className="text-gray-800 text-center"
                            >
                                Don&apos;t miss out!
                            </HeadingText>
                        </DialogHeader>
                        <div className="flex flex-col gap-4">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-800"
                            >
                                You&apos;ve entered an email but haven&apos;t
                                submitted it. Would you like to submit now to
                                stay updated on SuperFund?
                            </BodyText>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleFinalClose}
                                >
                                    Close anyway
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowEmailReminder(false)
                                        // Find and click the submit button in the email form
                                        setTimeout(() => {
                                            const submitButton =
                                                document.querySelector(
                                                    '.subscribe-email-form button[type="submit"]'
                                                )
                                            if (
                                                submitButton instanceof
                                                HTMLElement
                                            ) {
                                                submitButton.click()
                                            }
                                        }, 100)
                                    }}
                                >
                                    Submit email
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

export function handleSmallestValue(
    amount: string,
    maxDecimalsToDisplay: number = 2
) {
    const amountFormatted = hasExponent(amount)
        ? Math.abs(Number(amount)).toFixed(10)
        : amount.toString()
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted), maxDecimalsToDisplay)} ${getLowestDisplayValue(Number(amountFormatted), maxDecimalsToDisplay)}`
}