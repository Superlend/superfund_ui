'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { TActionType, TPositionType } from '@/types'
import {
    LoaderCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    abbreviateNumber,
    getLowestDisplayValue,
} from '@/lib/utils'
import { BodyText } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    TDepositTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import { ChainId } from '@/types/chain'
import {
    checkAllowance,
    useUserBalance,
} from '@/hooks/vault_hooks/useUserBalanceHook'
import { usePrivy } from '@privy-io/react-auth'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import SuperVaultTxDialog from '@/components/dialogs/SuperVaultTx'
import { useChain } from '@/context/chain-context'

export type THelperText = Record<string, Record<string | 'placeholder' | 'input' | 'error', string | null>>

export default function DepositAndWithdrawAssets() {
    const { isWalletConnected, handleSwitchChain } = useWalletConnection()
    const [positionType, setPositionType] = useState<TActionType>('deposit')
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

    const { selectedChain } = useChain()

    useEffect(() => {
        if (isWalletConnected) {
            handleSwitchChain(selectedChain)
        }
    }, [isWalletConnected, selectedChain, handleSwitchChain])

    useEffect(() => {
        if (depositTx.status === 'approve' && depositTx.isRefreshingAllowance) {
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

    const helperText: THelperText = {
        placeholder: {
            deposit: 'Enter amount to proceed depositing in SuperFund Vault',
            withdraw: 'Enter amount to proceed withdrawing from this vault',
        },
        input: {
            deposit: `You are about to deposit $${userEnteredDepositAmount} worth of USDC to SuperFund Vault`,
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
                        <SuperVaultTxDialog
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
                                chain_id: selectedChain,
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
