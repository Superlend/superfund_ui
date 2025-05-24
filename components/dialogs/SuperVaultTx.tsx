'use client'

import { Button } from '@/components/ui/button'
import { TPositionType } from '@/types'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    Check,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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
import { motion } from 'framer-motion'

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
}) {
    const { depositTx, setDepositTx, withdrawTx, setWithdrawTx } =
        useTxContext() as TTxContext
    const { walletAddress, isWalletConnected, handleSwitchChain } =
        useWalletConnection()
    const { selectedChain, chainDetails } = useChain()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isDepositPositionType = positionType === 'deposit'
    const [miniappUser, setMiniAppUser] = useState<any>(null)
    const [pendingEmail, setPendingEmail] = useState('')
    const [showEmailReminder, setShowEmailReminder] = useState(false)

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
        // Reset the tx status when the dialog is closed
        return () => {
            resetDepositWithdrawTx()
        }
    }, [])

    useEffect(() => {
        if (isWalletConnected) {
            handleSwitchChain(selectedChain)
        }
    }, [isWalletConnected, selectedChain, handleSwitchChain])

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
            resetDepositWithdrawTx()
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
        depositTx.isConfirmed && depositTx.hash && depositTx.status === 'view'
    const isWithdrawTxInSuccess =
        withdrawTx.isConfirmed &&
        withdrawTx.hash &&
        withdrawTx.status === 'view'

    const isTxInProgress = isDepositTxInProgress || isWithdrawTxInProgress
    const isTxInSuccess = isDepositTxInSuccess || isWithdrawTxInSuccess
    const isTxFailed = false

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

    const disableActionButton = disabled

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
            buttonText: 'Share on Warpcast',
            imageSrc: '/icons/share.svg',
            onClick: () => {
                // I just deposited $10,
                const text = `I just ${positionType === 'withdraw' ? 'withdrew' : 'deposited'} into Superfund. I am earning up to ${assetDetails?.asset?.effective_apy.toFixed(2)}% APY on my USDC deposit with the best adjusted risk.`
                sdk.actions.composeCast({
                    text,
                    embeds: ['https://funds.superlend.xyz/'],
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
                        ? `${isDepositTxInSuccess ? 'Deposit' : 'Review Deposit'}`
                        : `${isWithdrawTxInSuccess ? 'Withdraw' : 'Review Withdraw'}`}
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
            <div className="flex flex-col gap-[12px]">
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
                <div className="flex flex-col items-center justify-between px-6 bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        deposit: true,
                        withdraw: false,
                    }) && (
                        <div
                            className={`flex items-center justify-between w-full py-4`}
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
                    )}
                    {isShowBlock({
                        deposit: true,
                        withdraw: false,
                    }) && (
                        <div
                            className={`flex items-center justify-between gap-1 w-full py-4`}
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
                        </div>
                    )}
                    {/* {isShowBlock({
                        deposit: false,
                        withdraw: false,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    View on explorer
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-800 flex items-center gap-[4px]"
                                    >
                                        <a
                                            href={getExplorerLink(
                                                isDepositPositionType(positionType)
                                                    ? depositTx.hash
                                                    : withdrawTx.hash,
                                                assetDetails?.chain_id
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-secondary-500"
                                        >
                                            {getTruncatedTxHash(
                                                isDepositPositionType(positionType)
                                                    ? depositTx.hash
                                                    : withdrawTx.hash
                                            )}
                                        </a>
                                        <ArrowUpRightIcon
                                            width={16}
                                            height={16}
                                            className="stroke-secondary-500"
                                        />
                                    </BodyText>
                                </div>
                            </div>
                        )} */}
                </div>
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
                                <div className="flex items-center justify-between gap-2">
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
                                </div>
                            )}
                        {((!isDepositTxInProgress && depositTx.isConfirmed) ||
                            depositTx.status === 'deposit' ||
                            depositTx.status === 'view') && (
                            <div className="flex items-center justify-between gap-2">
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
                            </div>
                        )}
                    </div>
                )}
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
                            <div className="flex items-center justify-between gap-2 w-full">
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
                            </div>
                        )}
                        {((!isDepositTxInProgress && depositTx.isConfirmed) ||
                            (depositTx.status === 'view' &&
                                depositTx.isConfirmed)) && (
                            <div
                                className={`flex flex-col items-center justify-start gap-3 w-full`}
                            >
                                <div
                                    className={`flex w-full items-center flex-row justify-between gap-2`}
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
                                </div>
                                {miniappUser && (
                                    <div className="w-full flex items-center flex-col justify-start gap-5 my-4 mb-8 ">
                                        {shareScreenButtons.map(
                                            (config, index) => (
                                                <Button
                                                    key={index}
                                                    variant="primary"
                                                    size="lg"
                                                    className={`rounded-[16px] gap-1 w-full flex items-center justify-center py-3 px-6 border-2 border-[#FF5B00] shadow-[0px_-1px_2px_0px_#FFFFFF70_inset] bg-gradient-to-b from-[#FF5B00] to-[#F55700]`}
                                                    onClick={config.onClick}
                                                >
                                                    <Image
                                                        src={config.imageSrc}
                                                        alt={''}
                                                        width={18}
                                                        height={18}
                                                    />
                                                    {config.buttonText}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
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
                                <div
                                    className={`flex flex-col items-center justify-start gap-3 w-full`}
                                >
                                    <div
                                        className={`flex items-center flex-row justify-between gap-2 w-full`}
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
                                    {miniappUser && (
                                        <div className="w-full flex items-center flex-col justify-start gap-5 my-4 mb-8 ">
                                            {shareScreenButtons.map(
                                                (config, index) => (
                                                    <Button
                                                        key={index}
                                                        variant="primary"
                                                        size="lg"
                                                        className={`rounded-[16px] gap-1 w-full flex items-center justify-center py-3 px-6 border-2 border-[#FF5B00] shadow-[0px_-1px_2px_0px_#FFFFFF70_inset] bg-gradient-to-b from-[#FF5B00] to-[#F55700]`}
                                                        onClick={config.onClick}
                                                    >
                                                        <Image
                                                            src={
                                                                config.imageSrc
                                                            }
                                                            alt={''}
                                                            width={18}
                                                            height={18}
                                                        />
                                                        {config.buttonText}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        {((!isDepositTxInProgress && depositTx.isConfirmed) ||
                            (depositTx.status === 'view' &&
                                depositTx.isConfirmed)) && (
                            <div
                                className={`flex flex-col items-center justify-start gap-3 w-full`}
                            >
                                <div
                                    className={`flex w-full items-center flex-row justify-between gap-2`}
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
                                </div>
                                {miniappUser && (
                                    <div className="w-full flex items-center flex-col justify-start gap-5 my-4 mb-8 ">
                                        {shareScreenButtons.map(
                                            (config, index) => (
                                                <Button
                                                    key={index}
                                                    variant="primary"
                                                    size="lg"
                                                    className={`rounded-[16px] gap-1 w-full flex items-center justify-center py-3 px-6 border-2 border-[#FF5B00] shadow-[0px_-1px_2px_0px_#FFFFFF70_inset] bg-gradient-to-b from-[#FF5B00] to-[#F55700]`}
                                                    onClick={config.onClick}
                                                >
                                                    <Image
                                                        src={config.imageSrc}
                                                        alt={''}
                                                        width={18}
                                                        height={18}
                                                    />
                                                    {config.buttonText}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {/* {isShowBlock({
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
                                <div
                                    className={`flex flex-col items-center justify-start gap-3 w-full`}
                                >
                                    <div
                                        className={`flex items-center flex-row justify-between gap-2 w-full`}
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
                                    {miniappUser && (
                                        <div className="w-full flex items-center flex-col justify-start gap-5 my-4 mb-8 ">
                                            {shareScreenButtons.map(
                                                (config, index) => (
                                                    <Button
                                                        key={index}
                                                        variant="primary"
                                                        size="lg"
                                                        className={`rounded-[16px] gap-1 w-full flex items-center justify-center py-3 px-6 border-2 border-[#FF5B00] shadow-[0px_-1px_2px_0px_#FFFFFF70_inset] bg-gradient-to-b from-[#FF5B00] to-[#F55700]`}
                                                        onClick={config.onClick}
                                                    >
                                                        <Image
                                                            src={
                                                                config.imageSrc
                                                            }
                                                            alt={''}
                                                            width={18}
                                                            height={18}
                                                        />
                                                        {config.buttonText}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                )} */}
                {isShowBlock({
                    deposit:
                        depositTx.status === 'view' &&
                        depositTx.isConfirmed &&
                        !!depositTx.hash,
                    withdraw: false,
                }) && (
                    <div className="flex flex-col items-center gap-3 my-1 w-full">
                        {/* {!showSubscription &&
                                <Button
                                    variant="secondaryOutline"
                                    onClick={() => setShowSubscription(true)}
                                    className="w-full py-3 uppercase"
                                >
                                    Stay updated on SuperFund
                                    <ArrowRightIcon className="w-4 h-4 stroke-secondary-500 ml-2" />
                                </Button>
                            } */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="bg-gray-200/50 bg-opacity-50 backdrop-blur-sm rounded-5 p-4 w-full"
                        >
                            <SubscribeWithEmail onEmailChange={setPendingEmail} />
                        </motion.div>
                    </div>
                )}
                {/* Block 4 */}
                {miniappUser &&
                ((withdrawTx.status === 'view' && withdrawTx.isConfirmed) ||
                    (depositTx.status === 'view' &&
                        depositTx.isConfirmed)) ? null : (
                    <ActionButton
                        disabled={false}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        setActionType={setActionType}
                        actionType={positionType}
                        walletAddress={walletAddress as `0x${string}`}
                    />
                )}
            </div>

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

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent
                    aria-describedby={undefined}
                    className="pt-[25px] max-w-[450px]"
                    showCloseButton={false}
                >
                    {/* X Icon to close the dialog */}
                    {closeContentButton}
                    {/* Tx in progress - Loading state UI */}
                    {/* {txInProgressLoadingState} */}
                    {/* Initial Confirmation UI */}
                    <DialogHeader>{contentHeader}</DialogHeader>

                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={open} dismissible={false}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                {/* X Icon to close the drawer */}
                {closeContentButton}
                {/* Tx in progress - Loading state UI */}
                {/* {txInProgressLoadingState} */}
                <DrawerHeader>{contentHeader}</DrawerHeader>
                {/* <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter> */}
                {contentBody}
            </DrawerContent>
        </Drawer>
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
