'use client'

import { Button } from '@/components/ui/button'
import { TActionType, TPositionType } from '@/types'
import {
    ArrowRightIcon,
    Check,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useEffect } from 'react'
import {
    abbreviateNumber,
    decimalPlacesCount,
    getExplorerLink,
    getLowestDisplayValue,
    hasExponent,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { BodyText, HeadingText } from '@/components/ui/typography'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import ActionButton from '@/components/common/ActionButton'
import {
    TTxContext,
    useTxContext,
    TClaimRewardsTx,
} from '@/context/super-vault-tx-provider'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { ChainId } from '@/types/chain'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import ImageWithBadge from '@/components/ImageWithBadge'
import ExternalLink from '@/components/ExternalLink'
import ImageWithDefault from '../ImageWithDefault'

export default function ClaimRewardsTxDialog({
    disabled,
    positionType,
    assetDetails,
    open,
    setOpen,
    setActionType,
}: {
    disabled: boolean
    positionType: TActionType
    assetDetails: any
    open: boolean
    setOpen: (open: boolean) => void
    setActionType?: (actionType: TPositionType) => void
}) {

    const { claimRewardsTx, setClaimRewardsTx } =
        useTxContext() as TTxContext
    const { isWalletConnected, handleSwitchChain } = useWalletConnection()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    useEffect(() => {
        // Reset the tx status when the dialog is closed
        return () => {
            resetClaimRewardsTx()
        }
    }, [])

    useEffect(() => {
        if (isWalletConnected) {
            handleSwitchChain(ChainId.Base)
        }
    }, [isWalletConnected])

    const { user } = usePrivy()
    const walletAddress = user?.wallet?.address

    function resetClaimRewardsTx() {
        setClaimRewardsTx((prev: TClaimRewardsTx) => ({
            ...prev,
            status: 'claim',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
        }))
    }

    function handleOpenChange(open: boolean) {
        setOpen(open)
        // When closing the dialog, reset the tx status
        if (!open) {
            resetClaimRewardsTx()
        }
    }

    function isShowBlock(status: { claim: boolean }) {
        return status.claim
    }

    const inputUsdAmount = Number(assetDetails?.reward?.availabeToClaimFormatted) * Number(assetDetails?.reward?.price_usd)

    function handleInputUsdAmount(amount: string) {
        const amountFormatted = hasExponent(amount)
            ? Math.abs(Number(amount)).toFixed(10)
            : amount.toString()
        const amountFormattedForLowestValue = getLowestDisplayValue(
            Number(amountFormatted)
        )
        return `${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
    }

    const isClaimRewardsTxInProgress = claimRewardsTx.isPending || claimRewardsTx.isConfirming

    const isTxInProgress = isClaimRewardsTxInProgress

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = !isTxInProgress ? (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                claim: true,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        Claim Rewards
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
                    claim: false,
                }) && (
                        <div className="flex items-center gap-4 px-6 py-2 bg-gray-200 lg:bg-white rounded-5 w-full">
                            <ImageWithBadge
                                mainImg={assetDetails?.reward?.token?.logo || ''}
                                badgeImg={'https://superlend-assets.s3.ap-south-1.amazonaws.com/base.svg'}
                                mainImgAlt={assetDetails?.reward?.token?.symbol}
                                badgeImgAlt={'Base'}
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
                                    {Number(assetDetails?.reward?.availabeToClaimFormatted).toFixed(
                                        decimalPlacesCount(assetDetails?.reward?.token?.amount || '0')
                                    )}
                                    <span className="inline-block truncate max-w-[150px]" title={assetDetails?.asset?.token?.symbol}>
                                        {assetDetails?.asset?.token?.symbol}
                                    </span>
                                </HeadingText>
                                <div className="flex items-center justify-start gap-1">
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600"
                                    >
                                        {handleInputUsdAmount(
                                            inputUsdAmount.toString()
                                        )}
                                    </BodyText>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <BodyText
                                        level="body3"
                                        weight="medium"
                                        className="text-gray-600 flex items-center gap-1"
                                    >
                                        Base
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
                        claim: true,
                    }) && (
                            <div className={`flex items-center justify-between w-full gap-1 py-4`}>
                                <ImageWithDefault
                                    src={assetDetails?.reward?.token?.logo}
                                    alt={assetDetails?.reward?.token?.symbol}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                                    <HeadingText
                                        level="h4"
                                        weight="medium"
                                        className="text-gray-800"
                                    >
                                        {Number(assetDetails?.reward?.availabeToClaimFormatted).toFixed(
                                            decimalPlacesCount(assetDetails?.reward?.availabeToClaimFormatted || '0')
                                        )}
                                    </HeadingText>
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-600"
                                    >
                                        {handleInputUsdAmount(
                                            inputUsdAmount.toString()
                                        )}
                                    </BodyText>
                                </div>
                            </div>
                        )}
                </div>
                {/* Block 3 - Claim Rewards loading state */}
                {isShowBlock({
                    claim: ((claimRewardsTx.status === 'view' && claimRewardsTx.isConfirmed) || isClaimRewardsTxInProgress),
                }) && (
                        <div className="py-1">
                            {isClaimRewardsTxInProgress && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center justify-start gap-2">
                                        <LoaderCircle className="animate-spin w-8 h-8 text-secondary-500" />
                                        <BodyText level="body2" weight="normal" className="text-gray-600">
                                            {claimRewardsTx.isPending && (
                                                'Waiting for confirmation...'
                                            )}
                                            {claimRewardsTx.isConfirming && (
                                                'Claiming...'
                                            )}
                                        </BodyText>
                                    </div>
                                    {(claimRewardsTx.hash && (claimRewardsTx.isConfirming || claimRewardsTx.isConfirmed)) && (
                                        <ExternalLink href={getExplorerLink(claimRewardsTx.hash, assetDetails?.chain_id || assetDetails?.platform?.chain_id)}>
                                            <BodyText level="body2" weight="normal" className="text-inherit">
                                                View on explorer
                                            </BodyText>
                                        </ExternalLink>
                                    )}
                                </div>
                            )}
                            {(claimRewardsTx.status === 'view' && claimRewardsTx.isConfirmed) && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center justify-start gap-2">
                                        <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                                            <Check className="w-5 h-5 stroke-[#013220]/75" strokeWidth={1.5} />
                                        </div>
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            Claim successful
                                        </BodyText>
                                    </div>
                                    {(claimRewardsTx.hash && (claimRewardsTx.isConfirming || claimRewardsTx.isConfirmed)) && (
                                        <ExternalLink href={getExplorerLink(claimRewardsTx.hash, assetDetails?.chain_id || assetDetails?.platform?.chain_id)}>
                                            <BodyText level="body2" weight="normal" className="text-inherit">
                                                View on explorer
                                            </BodyText>
                                        </ExternalLink>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                {/* Block 4 */}
                <ActionButton
                    disabled={false}
                    handleCloseModal={handleOpenChange}
                    asset={assetDetails}
                    amount={assetDetails?.reward?.availabeToClaimFormatted}
                    setActionType={setActionType}
                    actionType={positionType}
                    walletAddress={walletAddress as `0x${string}`}
                />
            </div>
        </>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open}>
                {/* <DialogTrigger asChild>{triggerButton}</DialogTrigger> */}
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
            {/* <DrawerTrigger asChild>{triggerButton}</DrawerTrigger> */}
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