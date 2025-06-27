'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import ToggleTab, { TTypeToMatch } from '@/components/ToggleTab'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { TActionType, TPositionType } from '@/types'
import { CircleArrowRight, LoaderCircle } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { abbreviateNumberWithoutRounding, getBoostApy, getLowestDisplayValue, getTruncatedTxHash } from '@/lib/utils'
import { BodyText } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    TDepositTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import {
    checkAllowance,
    useUserBalance,
} from '@/hooks/vault_hooks/useUserBalanceHook'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import SuperVaultTxDialog from '@/components/dialogs/SuperVaultTx'
import { useChain } from '@/context/chain-context'
import { USDC_ADDRESS_MAP, VAULT_ADDRESS_MAP } from '@/lib/constants'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { useActiveAccount, useSwitchActiveWalletChain } from "thirdweb/react";
import { base } from "thirdweb/chains";
import WhalesSupportDialog from '@/components/dialogs/WhalesSupportDialog'
import { useWhalesSupportDialog } from '@/hooks/useWhalesSupportDialog'
import { LIQUIDITY_LAND_TARGET_APY } from '@/constants'
import { useGetLiquidityLandUsers } from '@/hooks/useGetLiquidityLandUsers'
import { Input } from '@/components/ui/input'
import { parseUnits } from 'ethers/lib/utils'

export type THelperText = Record<
    string,
    Record<string | 'placeholder' | 'input' | 'error', string | null>
>

export default function DepositAndWithdrawAssets() {
    // const { isWalletConnectedForUI, handleSwitchChain } = useWalletConnection()
    const switchChain = useSwitchActiveWalletChain();
    const [positionType, setPositionType] = useState<TActionType>('deposit')
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
        useState<boolean>(false)
    const { depositTx, setDepositTx, isDialogOpen, depositTxCompleted } = useTxContext() as TTxContext

    const [userEnteredDepositAmount, setUserEnteredDepositAmount] =
        useState<string>('')
    const [userEnteredWithdrawAmount, setUserEnteredWithdrawAmount] =
        useState<string>('')
    const [userEnteredTransferAmount, setUserEnteredTransferAmount] =
        useState<string>('')
    const [toWalletAddress, setToWalletAddress] = useState<string>('')

    function handleTransferAmount(amount: string) {
        setUserEnteredTransferAmount(amount)
    }

    const isDepositPositionType = positionType === 'deposit'
    const { selectedChain } = useChain()
    // const { walletAddress } = useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnectedForUI = !!account
    const isDepositTxCompletedAndDialogClosed: boolean =
        depositTxCompleted && !isConfirmationDialogOpen

    const {
        balance,
        userMaxWithdrawAmount,
        shareTokenBalance,
        isLoading: isLoadingBalance,
        error: balanceError,
    } = useUserBalance(walletAddress as `0x${string}`)

    // console.log('result', (((Number(userEnteredTransferAmount ?? 0) * Number(shareTokenBalance ?? 0)) / Number(userMaxWithdrawAmount ?? 0)) * 10 ** 6).toFixed())

    const portfolioValue = Number(userMaxWithdrawAmount ?? 0);

    const { showWhalesSupportDialog, setShowWhalesSupportDialog } = useWhalesSupportDialog({
        portfolioValue,
        lendTxCompleted: isDepositTxCompletedAndDialogClosed,
        walletAddress,
    })

    // const {
    //     spotApy,
    //     isLoading: isLoadingVaultStats,
    //     error: vaultStatsError,
    // } = useVaultHook()
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chain_id: selectedChain
    })
    const { totalAssets, spotApy, isLoading: isLoadingVault, error: errorVault } = useVaultHook()
    const { data: boostRewardsData, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
        vaultAddress: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chainId: selectedChain,
        userAddress: walletAddress
    })
    const GLOBAL_BOOST_APY =
        boostRewardsData?.filter((item) => item.description?.includes('A global boost for all users') ?? false)
            .reduce((acc, curr) => acc + (curr.boost_apy / 100), 0) ?? 0
    const Farcaster_BOOST_APY =
        boostRewardsData?.filter((item) => !item.description?.includes('A global boost for all users'))
            .reduce((acc, curr) => acc + (curr.boost_apy / 100), 0) ?? 0
    // Liquidity Land boost logic
    const { data: liquidityLandUsers, isLoading: isLoadingLiquidityLandUsers } = useGetLiquidityLandUsers()
    const isLiquidityLandUser = useMemo(() => {
        if (!walletAddress || !liquidityLandUsers) return false
        return liquidityLandUsers.some(user =>
            user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        )
    }, [walletAddress, liquidityLandUsers])

    const baseAPY = Number((effectiveApyData?.rewards_apy ?? 0)) + Number(effectiveApyData?.base_apy ?? 0) + Number(GLOBAL_BOOST_APY ?? 0) + Number(Farcaster_BOOST_APY ?? 0)
    const LIQUIDITY_LAND_BOOST_APY = useMemo(() => {
        if (!isLiquidityLandUser) return 0
        const targetAPY = LIQUIDITY_LAND_TARGET_APY
        const boost = Math.max(0, targetAPY - baseAPY)
        return boost
    }, [isLiquidityLandUser, baseAPY])
    const TOTAL_APY = Number(effectiveApyData?.rewards_apy ?? 0) + Number(GLOBAL_BOOST_APY ?? 0) + Number(Farcaster_BOOST_APY ?? 0) + Number(effectiveApyData?.base_apy ?? 0) + Number(LIQUIDITY_LAND_BOOST_APY ?? 0)

    useEffect(() => {
        // Only run this effect when the transaction dialog is open to prevent unwanted state changes during resets
        if (depositTx.status === 'approve' &&
            depositTx.isRefreshingAllowance &&
            isDialogOpen
        ) {
            setDepositTx((prev: TDepositTx) => ({
                ...prev,
                isConfirming: true,
            }))

            checkAllowance(walletAddress as `0x${string}`, selectedChain).then((allowance) => {
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
    }, [depositTx.isRefreshingAllowance, isDialogOpen])

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
        } else if (positionType === 'withdraw') {
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
        } else {
            if (toWalletAddress.length !== 0 && toWalletAddress.length !== 42) {
                return 'To/Receiver address is invalid'
            }
            if (Number(userEnteredTransferAmount) === 0 && userEnteredTransferAmount !== '') {
                return 'Transfer amount must be greater than 0'
            }
            if (
                Number(userEnteredTransferAmount) >
                Number(userMaxWithdrawAmount)
            ) {
                return 'Amount is more than your withdrawable balance'
            }
        }
        return null
    }

    const helperText: THelperText = {
        placeholder: {
            deposit: 'Enter amount to proceed depositing in SuperFund Vault',
            withdraw: 'Enter amount to proceed withdrawing from this vault',
            transfer: `Enter ${!toWalletAddress ? 'To/Receiver address to proceed' : 'amount to proceed transferring USDC from this vault to ' + getTruncatedTxHash(toWalletAddress)}`,
        },
        input: {
            deposit: `You are about to deposit $${userEnteredDepositAmount} worth of USDC to SuperFund Vault`,
            withdraw: `You are about to withdraw $${userEnteredWithdrawAmount} worth of USDC from this vault`,
            transfer: `You are about to transfer $${userEnteredTransferAmount} worth of USDC from this vault to ${getTruncatedTxHash(toWalletAddress)}`,
        },
        error: {
            deposit: getInputErrorText(),
            withdraw: getInputErrorText(),
            transfer: getInputErrorText(),
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
                : positionType === 'withdraw' ?
                    userEnteredWithdrawAmount !== ''
                    : userEnteredTransferAmount !== '' && toWalletAddress.length === 42
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
        } else if (positionType === 'withdraw') {
            return (
                Number(userEnteredWithdrawAmount) >
                Number(userMaxWithdrawAmount) ||
                Number(userEnteredWithdrawAmount) === 0
            )
        }

        return (
            (toWalletAddress.length !== 42) ||
            Number(userEnteredTransferAmount) > Number(userMaxWithdrawAmount) ||
            Number(userEnteredTransferAmount) === 0
        )

    }

    const inputAmountInSlUSD = useMemo(() => {
        return (((Number(userEnteredTransferAmount ?? 0) * Number(shareTokenBalance ?? 0)) / Number(userMaxWithdrawAmount ?? 0)) * 10 ** 6).toFixed()
    }, [userEnteredTransferAmount, shareTokenBalance, userMaxWithdrawAmount])

    // Render component
    return (
        <section className="tx-widget-section-wrapper flex flex-col gap-[12px]">
            <ToggleTab
                type={
                    positionType === 'deposit' ? 'tab1' : positionType === 'withdraw' ? 'tab2' : 'tab3' as TTypeToMatch
                }
                handleToggle={(positionType: TTypeToMatch) => {
                    if (positionType === 'tab1') {
                        setPositionType('deposit')
                    } else if (positionType === 'tab2') {
                        setPositionType('withdraw')
                    } else if (positionType === 'tab3') {
                        setPositionType('transfer')
                    }
                }}
                title={{ tab1: 'Deposit', tab2: 'Withdraw', tab3: 'Transfer' }}
                showTab={{ tab1: true, tab2: true, tab3: true }}
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600"
                    >
                        {isDepositPositionType ? 'Deposit' : positionType === 'withdraw' ? `Withdraw` : `Transfer`}
                    </BodyText>
                    {isWalletConnectedForUI && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            {isDepositPositionType ? 'Bal' : 'Available'}:{' '}
                            {isLoadingBalance ? (
                                <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                            ) : (
                                abbreviateNumberWithoutRounding(
                                    Number(
                                        isDepositPositionType
                                            ? (balance ?? 0)
                                            : (userMaxWithdrawAmount ?? 0)
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
                    {positionType === 'transfer' &&
                        <div
                            className={cn(
                                'border rounded-5 rounded-b-none shadow-[0px_4px_16px_rgba(0,0,0,0.04)]',
                                'border-gray-200 py-[12px] px-[20px] flex items-center gap-[12px]'
                            )}
                        >
                            {/* Single token */}
                            <CircleArrowRight
                                className="shrink-0 w-[24px] h-[24px] rounded-full text-gray-500"
                            />
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="capitalize text-gray-500"
                            >
                                |
                            </BodyText>
                            <div className="flex flex-col flex-1 gap-[4px] truncate">
                                <Input
                                    type="text"
                                    className="w-full pl-0 truncate"
                                    value={toWalletAddress}
                                    onChange={(e) => setToWalletAddress(e.target.value)}
                                    placeholder="Enter To/Receiver address"
                                />
                            </div>
                        </div>}
                    <div
                        className={cn(
                            true
                                ? 'border rounded-5 rounded-t-none shadow-[0px_4px_16px_rgba(0,0,0,0.04)]'
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
                                        : positionType === 'withdraw' ? userEnteredWithdrawAmount
                                            : userEnteredTransferAmount
                                }
                                setAmount={
                                    isDepositPositionType
                                        ? setUserEnteredDepositAmount
                                        : positionType === 'withdraw' ? setUserEnteredWithdrawAmount
                                            : setUserEnteredTransferAmount
                                }
                            />
                        </div>
                        {isWalletConnectedForUI && (
                            <Button
                                variant="link"
                                onClick={() =>
                                    isDepositPositionType
                                        ? setUserEnteredDepositAmount(balance)
                                        : positionType === 'withdraw' ? setUserEnteredWithdrawAmount(
                                            userMaxWithdrawAmount
                                        )
                                            : setUserEnteredTransferAmount(
                                                userMaxWithdrawAmount
                                            )
                                }
                                className="uppercase text-[14px] font-medium w-fit"
                            >
                                max
                            </Button>
                        )}
                    </div>
                    {isWalletConnectedForUI && (
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
                    {!isWalletConnectedForUI && <ConnectWalletButton />}
                    {isWalletConnectedForUI && (
                        <SuperVaultTxDialog
                            disabled={isDiasableActionBtn()}
                            positionType={positionType}
                            assetDetails={{
                                asset: {
                                    address: USDC_ADDRESS_MAP[selectedChain as keyof typeof USDC_ADDRESS_MAP] as `0x${string}`,
                                    token: {
                                        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg',
                                        symbol: 'USDC',
                                    },
                                    effective_apy: TOTAL_APY,
                                    toWalletAddress: toWalletAddress,
                                    amountInSlUSD: inputAmountInSlUSD,
                                },
                                chain_id: selectedChain,
                            }}
                            amount={
                                isDepositPositionType
                                    ? userEnteredDepositAmount
                                    : positionType === 'withdraw' ? userEnteredWithdrawAmount
                                        : userEnteredTransferAmount
                            }
                            balance={
                                isDepositPositionType
                                    ? balance
                                    : positionType === 'withdraw' ? userMaxWithdrawAmount
                                        : shareTokenBalance
                            }
                            setAmount={
                                isDepositPositionType
                                    ? setUserEnteredDepositAmount
                                    : positionType === 'withdraw' ? setUserEnteredWithdrawAmount
                                        : setUserEnteredTransferAmount
                            }
                            open={isConfirmationDialogOpen}
                            setOpen={setIsConfirmationDialogOpen}
                            userMaxWithdrawAmount={
                                positionType === 'withdraw' ? Number(userMaxWithdrawAmount) : 0
                            }
                        />
                    )}
                </CardFooter>
            </Card>
            <WhalesSupportDialog
                open={showWhalesSupportDialog}
                setOpen={setShowWhalesSupportDialog}
                portfolioValue={portfolioValue}
            />
        </section>
    )
}
