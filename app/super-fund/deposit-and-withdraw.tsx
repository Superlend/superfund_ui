'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { TPositionType } from '@/types'
import { TPlatformAsset } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CircleCheckIcon,
    CircleXIcon,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    abbreviateNumber,
    decimalPlacesCount,
    getLowestDisplayValue,
    hasExponent,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { TX_EXPLORER_LINKS } from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import {
    TDepositTx,
    TWithdrawTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import { BigNumber } from 'ethers'
import { ScrollArea } from '@/components/ui/scroll-area'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { ChainId } from '@/types/chain'
import {
    checkAllowance,
    useUserBalance,
} from '@/hooks/vault_hooks/useUserBalanceHook'
import { usePrivy } from '@privy-io/react-auth'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useWalletConnection } from '@/hooks/useWalletConnection'

export default function DepositAndWithdrawAssets() {
    const { isWalletConnected, handleSwitchChain } = useWalletConnection()
    const [positionType, setPositionType] = useState<TPositionType>('deposit')
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
        useState<boolean>(false)
    const { depositTx, setDepositTx } = useTxContext() as TTxContext

    const [userEnteredDepositAmount, setUserEnteredDepositAmount] =
        useState<string>('')
    const [userEnteredWithdrawAmount, setUserEnteredWithdrawAmount] =
        useState<string>('')

    const isDepositPositionType = positionType === 'deposit'

    const { user } = usePrivy()
    const walletAddress = user?.wallet?.address

    const {
        balance,
        userMaxWithdrawAmount,
        isLoading: isLoadingBalance,
        error: balanceError,
    } = useUserBalance(walletAddress as `0x${string}`)
    const {
        spotApy,
        isLoading: isLoadingVaultStats,
        error: vaultStatsError,
    } = useVaultHook()

    useEffect(() => {
        if (isWalletConnected) {
            handleSwitchChain(ChainId.Base)
        }
    }, [isWalletConnected])

    useEffect(() => {
        if (depositTx.status === 'approve' && depositTx.isRefreshingAllowance) {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                isConfirming: true,
            }))

            checkAllowance(walletAddress as `0x${string}`).then((allowance) => {
                if (
                    Number(allowance) > 0 &&
                    Number(allowance) >= Number(userEnteredDepositAmount)
                ) {
                    setDepositTx((prev: TDepositTx) => ({
                        ...prev,
                        status: 'deposit',
                        isConfirming: false,
                    }))
                } else {
                    setDepositTx((prev: TDepositTx) => ({
                        ...prev,
                        status: 'approve',
                        isConfirming: false,
                    }))
                }
            })
        }
        // TODO: Add logic for approval of withdraw tx
    }, [depositTx.isRefreshingAllowance])

    const getInputErrorText = (): string | null => {
        if (isDepositPositionType) {
            if (Number(userEnteredDepositAmount) > Number(balance)) {
                return 'Amount is more than your balance'
            }
            if (
                Number(userEnteredDepositAmount) === 0 &&
                userEnteredDepositAmount !== ''
            ) {
                return 'Amount must be greater than 0'
            }
        } else {
            if (
                Number(userEnteredWithdrawAmount) >
                Number(userMaxWithdrawAmount)
            ) {
                return 'Amount is more than your available limit'
            }
            if (
                Number(userEnteredWithdrawAmount) === 0 &&
                userEnteredWithdrawAmount !== ''
            ) {
                return 'Amount must be greater than 0'
            }
        }
        return null
    }

    const helperText = {
        placeholder: {
            deposit: 'Enter amount to proceed depositing in SuperUSD Vault',
            withdraw: 'Enter amount to proceed withdrawing from this vault',
        },
        input: {
            deposit: `You are about to deposit $${userEnteredDepositAmount} worth of USDC to SuperUSD Vault`,
            withdraw: `You are about to withdraw $${userEnteredWithdrawAmount} worth of USDC from this vault`,
        },
        error: {
            deposit: getInputErrorText(),
            withdraw: getInputErrorText(),
        },
    }

    const placeholderText = helperText.placeholder[positionType]
    const inputText = helperText.input[positionType]
    const errorText = helperText.error[positionType]

    function getHelperText() {
        if (!!errorText) {
            return errorText
        } else if (
            isDepositPositionType
                ? userEnteredDepositAmount !== ''
                : userEnteredWithdrawAmount !== ''
        ) {
            return inputText
        } else {
            return placeholderText
        }
    }

    const isDiasableActionBtn = () => {
        if (isDepositPositionType) {
            return (
                Number(userEnteredDepositAmount) > Number(balance) ||
                Number(userEnteredDepositAmount) === 0
            )
        } else {
            return (
                Number(userEnteredWithdrawAmount) >
                    Number(userMaxWithdrawAmount) ||
                Number(userEnteredWithdrawAmount) === 0
            )
        }
    }

    // Render component
    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px] lg:sticky top-24 left-0 right-0">
            <LendBorrowToggle
                type={positionType}
                handleToggle={setPositionType}
                title={{ deposit: 'Deposit', withdraw: 'Withdraw' }}
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600"
                    >
                        {isDepositPositionType ? 'Deposit' : `Withdraw`}
                    </BodyText>
                    {isWalletConnected && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            {isDepositPositionType ? 'Bal' : 'Available'}:{' '}
                            {isLoadingBalance ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                abbreviateNumber(
                                    Number(
                                        getLowestDisplayValue(
                                            Number(
                                                isDepositPositionType
                                                    ? (balance ?? 0)
                                                    : (userMaxWithdrawAmount ??
                                                          0)
                                            ),
                                            2
                                        )
                                    ),
                                    2
                                )
                            )}
                            <span className="inline-block truncate max-w-[70px]">
                                USDC
                            </span>
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div
                        className={cn(
                            true
                                ? 'border rounded-5 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]'
                                : 'border-t rounded-t-5',
                            'border-gray-200 py-[12px] px-[20px] flex items-center gap-[12px]'
                        )}
                    >
                        {/* Single token */}
                        <ImageWithDefault
                            src={
                                'https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg'
                            }
                            alt={''}
                            className="shrink-0 w-[24px] h-[24px] rounded-full"
                            width={24}
                            height={24}
                        />
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-500"
                        >
                            |
                        </BodyText>
                        <div className="flex flex-col flex-1 gap-[4px]">
                            <CustomNumberInput
                                key={'true'}
                                amount={
                                    isDepositPositionType
                                        ? userEnteredDepositAmount
                                        : userEnteredWithdrawAmount
                                }
                                setAmount={
                                    isDepositPositionType
                                        ? setUserEnteredDepositAmount
                                        : setUserEnteredWithdrawAmount
                                }
                            />
                        </div>
                        {isWalletConnected && (
                            <Button
                                variant="link"
                                onClick={() =>
                                    isDepositPositionType
                                        ? setUserEnteredDepositAmount(balance)
                                        : setUserEnteredWithdrawAmount(
                                              userMaxWithdrawAmount
                                          )
                                }
                                className="uppercase text-[14px] font-medium w-fit"
                            >
                                max
                            </Button>
                        )}
                    </div>
                    {isWalletConnected && (
                        <div className="card-content-bottom max-md:px-2 py-3 max-w-[250px] mx-auto">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="w-full text-gray-500 text-center"
                            >
                                {getHelperText()}
                            </BodyText>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {!isWalletConnected && <ConnectWalletButton />}
                    {isWalletConnected && (
                        <ConfirmationDialogForSuperVault
                            disabled={isDiasableActionBtn()}
                            positionType={positionType}
                            assetDetails={{
                                asset: {
                                    token: {
                                        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg',
                                        symbol: 'USDC',
                                    },
                                    spot_apy: spotApy,
                                },
                                chain_id: ChainId.Base,
                            }}
                            amount={
                                isDepositPositionType
                                    ? userEnteredDepositAmount
                                    : userEnteredWithdrawAmount
                            }
                            balance={
                                isDepositPositionType
                                    ? balance
                                    : userMaxWithdrawAmount
                            }
                            setAmount={
                                isDepositPositionType
                                    ? setUserEnteredDepositAmount
                                    : setUserEnteredWithdrawAmount
                            }
                            open={isConfirmationDialogOpen}
                            setOpen={setIsConfirmationDialogOpen}
                        />
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}

// Child components
function SelectTokensDropdown({
    options,
    selectedItemDetails,
    setSelectedItemDetails,
}: {
    options: TPlatformAsset[]
    selectedItemDetails: TPlatformAsset | null
    setSelectedItemDetails: (token: TPlatformAsset) => void
}) {
    useEffect(() => {
        setSelectedItemDetails(options[0])
    }, [])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="md"
                    variant="ghost"
                    className="group flex items-center gap-1 text-gray-800 px-0"
                >
                    <ImageWithDefault
                        src={selectedItemDetails?.token?.logo}
                        alt={selectedItemDetails?.token?.symbol}
                        width={24}
                        height={24}
                        className="rounded-full max-w-[24px] max-h-[24px]"
                    />
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                <ScrollArea className="h-[200px]">
                    {options?.map((asset: any) => (
                        <DropdownMenuItem
                            key={asset?.token?.address}
                            onClick={() => setSelectedItemDetails(asset)}
                            className={cn(
                                'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
                                selectedItemDetails?.token?.address ===
                                    asset?.token?.address && 'bg-gray-400'
                            )}
                        >
                            <ImageWithDefault
                                src={asset?.token?.logo || ''}
                                alt={asset?.token?.symbol || ''}
                                width={24}
                                height={24}
                                className="rounded-full max-w-[24px] max-h-[24px]"
                            />
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-800"
                            >
                                {asset?.token?.symbol || ''}
                            </BodyText>
                        </DropdownMenuItem>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function ConfirmationDialogForSuperVault({
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
    const { isWalletConnected, handleSwitchChain } = useWalletConnection()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    useEffect(() => {
        // Reset the tx status when the dialog is closed
        return () => {
            resetDepositWithdrawTx()
        }
    }, [])

    useEffect(() => {
        if (isWalletConnected) {
            handleSwitchChain(ChainId.Base)
        }
    }, [isWalletConnected])

    const { user } = usePrivy()
    const walletAddress = user?.wallet?.address

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
        // When opening the dialog, reset the amount and the tx status
        setOpen(open)
        // When closing the dialog, reset the amount and the tx status
        if (
            !open &&
            (depositTx.status !== 'approve' || withdrawTx.status !== 'withdraw')
        ) {
            setAmount('')
            resetDepositWithdrawTx()
        }
    }

    function isShowBlock(status: { deposit: boolean; withdraw: boolean }) {
        return isDepositPositionType(positionType)
            ? status.deposit
            : status.withdraw
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
        return `~${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
    }

    const isDepositTxInProgress = depositTx.isPending || depositTx.isConfirming
    const isWithdrawTxInProgress =
        withdrawTx.isPending || withdrawTx.isConfirming

    const isTxInProgress = isDepositTxInProgress || isWithdrawTxInProgress
    const isTxFailed = false

    const depositTxSpinnerColor = depositTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const withdrawTxSpinnerColor = withdrawTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'

    const canDisplayExplorerLinkWhileLoading = isDepositPositionType(
        positionType
    )
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
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // SUB_COMPONENT: Tx in progress - Loading state UI
    const txInProgressLoadingState = isTxInProgress ? (
        <div className="flex flex-col items-center justify-center gap-6 mt-6">
            <LoaderCircle
                className={`text-secondary-500 w-28 h-28 animate-spin rounded-full`}
                strokeWidth={2.5}
            />
            <BodyText
                level="body1"
                weight="normal"
                className="text-gray-800 text-center max-w-[400px]"
            >
                {getTxInProgressText({
                    amount,
                    tokenName: assetDetails?.asset?.token?.symbol,
                    txStatus: isDepositPositionType(positionType)
                        ? depositTx
                        : withdrawTx,
                    positionType,
                    actionTitle: isDepositPositionType(positionType)
                        ? 'deposit'
                        : 'withdraw',
                })}
            </BodyText>
            {canDisplayExplorerLinkWhileLoading && (
                <div className="flex items-center justify-between w-full py-[16px] bg-gray-200 lg:bg-white rounded-5 px-[24px]">
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
            )}
        </div>
    ) : null

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                deposit:
                    depositTx.status === 'approve' && !isDepositTxInProgress,
                withdraw:
                    withdrawTx.status === 'withdraw' && !isWithdrawTxInProgress,
            }) && (
                // <DialogTitle asChild>
                <HeadingText
                    level="h4"
                    weight="medium"
                    className="text-gray-800 text-center capitalize"
                >
                    Confirm{' '}
                    {isDepositPositionType(positionType)
                        ? 'Deposit'
                        : `Withdraw`}
                </HeadingText>
                // </DialogTitle>
            )}
            {/* Confirmation details UI */}
            {isShowBlock({
                deposit:
                    (depositTx.status === 'deposit' &&
                        !isDepositTxInProgress) ||
                    (depositTx.status === 'view' && !isDepositTxInProgress),
                withdraw:
                    // (borrowTx.status === 'borrow' && !isBorrowTxInProgress) ||
                    withdrawTx.status === 'view' && !isWithdrawTxInProgress,
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
            )}
        </>
    )

    // SUB_COMPONENT: Content body UI
    const contentBody = (
        <>
            <div className="flex flex-col gap-[12px]">
                {/* Block 1 */}
                {isShowBlock({
                    deposit:
                        depositTx.status === 'approve' &&
                        !isDepositTxInProgress,
                    withdraw:
                        withdrawTx.status === 'withdraw' &&
                        !isWithdrawTxInProgress,
                }) && (
                    <div className="flex items-center gap-[8px] px-[24px] py-[18.5px] bg-gray-200 lg:bg-white rounded-5 w-full">
                        <ImageWithDefault
                            src={assetDetails?.asset?.token?.logo}
                            alt={assetDetails?.asset?.token?.symbol}
                            width={24}
                            height={24}
                            className="rounded-full max-w-[24px] max-h-[24px]"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                            <HeadingText
                                level="h3"
                                weight="normal"
                                className="text-gray-800"
                            >
                                {Number(amount).toFixed(
                                    decimalPlacesCount(amount)
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
                {/* Block 2 */}
                {isShowBlock({
                    deposit:
                        depositTx.status === 'approve' &&
                        !isDepositTxInProgress,
                    withdraw: false,
                }) && (
                    <div
                        className={`flex items-center ${isDepositPositionType(positionType) ? 'justify-end' : 'justify-between'} px-[24px] mb-[4px] gap-1`}
                    >
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600"
                        >
                            Bal:
                        </BodyText>
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-gray-600"
                        >
                            {handleSmallestValue(
                                (Number(balance) - Number(amount)).toString()
                            )}{' '}
                            {assetDetails?.asset?.token?.symbol}
                        </BodyText>
                    </div>
                )}
                {/* Block 3 */}
                <div className="flex flex-col items-center justify-between px-[24px] bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        deposit: !isDepositTxInProgress,
                        withdraw: !isWithdrawTxInProgress,
                    }) && (
                        <div className="flex items-center justify-between w-full py-[16px]">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Spot APY
                            </BodyText>
                            <Badge variant="green">
                                {abbreviateNumber(
                                    Number(assetDetails?.asset?.spot_apy) ?? 0
                                )}
                                %
                            </Badge>
                        </div>
                    )}
                    {isShowBlock({
                        deposit:
                            (depositTx.status === 'approve' ||
                                depositTx.status === 'view') &&
                            depositTx.hash.length > 0 &&
                            !isDepositTxInProgress,
                        withdraw:
                            withdrawTx.status === 'view' &&
                            withdrawTx.hash.length > 0 &&
                            !isWithdrawTxInProgress,
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
                    )}
                </div>
                {/* Block 4 */}
                <div className={`${isTxInProgress ? 'invisible h-0' : ''}`}>
                    <ActionButton
                        disabled={false}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        setActionType={setActionType}
                        actionType={positionType}
                        walletAddress={walletAddress as `0x${string}`}
                    />
                </div>
            </div>
        </>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent
                    aria-describedby={undefined}
                    className="pt-[25px]"
                    showCloseButton={false}
                >
                    {/* X Icon to close the dialog */}
                    {closeContentButton}
                    {/* Tx in progress - Loading state UI */}
                    {txInProgressLoadingState}
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
                {txInProgressLoadingState}
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

function isDepositPositionType(positionType: TPositionType) {
    return positionType === 'deposit'
}

function getExplorerLink(hash: string, chainId: ChainId) {
    return `${TX_EXPLORER_LINKS[chainId]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

function getTxInProgressText({
    amount,
    tokenName,
    txStatus,
    positionType,
    actionTitle,
}: {
    amount: string
    tokenName: string
    txStatus: TDepositTx | TWithdrawTx
    positionType: TPositionType
    actionTitle: string
}) {
    const formattedText = `${amount} ${tokenName}`
    const isPending = txStatus.isPending
    const isConfirming = txStatus.isConfirming
    let textByStatus: any = {}

    if (isPending) {
        textByStatus = {
            approve: `Approve spending ${formattedText} from your wallet`,
            deposit: `Approve transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            withdraw: `Approve transaction for ${actionTitle}ing ${formattedText} from your wallet`,
        }
    } else if (isConfirming) {
        textByStatus = {
            approve: `Confirming transaction for spending ${formattedText} from your wallet`,
            deposit: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            withdraw: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            view: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
        }
    }
    return textByStatus[txStatus.status]
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

function getMaxDecimalsToDisplay(tokenSymbol: string): number {
    return tokenSymbol?.toLowerCase().includes('btc') ||
        tokenSymbol?.toLowerCase().includes('eth')
        ? 4
        : 2
}
