'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { LoaderCircle, SendHorizontal, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    abbreviateNumberWithoutRounding,
    getTruncatedTxHash,
} from '@/lib/utils'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import {
    TTxContext,
    TTransferTx,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import {
    useUserBalance,
} from '@/hooks/vault_hooks/useUserBalanceHook'
import SuperVaultTxDialog from '@/components/dialogs/SuperVaultTx'
import { useChain } from '@/context/chain-context'
import {
    USDC_ADDRESS_MAP,
    USDC_DECIMALS,
    VAULT_ADDRESS_MAP,
} from '@/lib/constants'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import { useActiveAccount } from 'thirdweb/react'
import { LIQUIDITY_LAND_TARGET_APY } from '@/constants'
import { useGetLiquidityLandUsers } from '@/hooks/useGetLiquidityLandUsers'
import { Input } from '@/components/ui/input'
import { parseUnits } from 'ethers/lib/utils'
import WalletIcon from '@/components/icons/wallet-icon'
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from '@/components/ui/dialog'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
} from '@/components/ui/drawer'
import useDimensions from '@/hooks/useDimensions'
import { useMemo } from 'react'

interface TransferDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export default function TransferDialog({ open, setOpen }: TransferDialogProps) {
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    const [userEnteredTransferAmount, setUserEnteredTransferAmount] = useState<string>('')
    const [toWalletAddress, setToWalletAddress] = useState<string>('')
    const [inputAmountInSlUSD, setInputAmountInSlUSD] = useState<string>('0')
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState<boolean>(false)

    const { selectedChain } = useChain()
    const account = useActiveAccount()
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnectedForUI = !!account

    const {
        userMaxWithdrawAmount,
        isLoading: isLoadingBalance,
        getShareAmountFromTokenAmount,
    } = useUserBalance(walletAddress as `0x${string}`)

    const portfolioValue = Number(userMaxWithdrawAmount ?? 0)

    const {
        data: effectiveApyData,
        isLoading: isLoadingEffectiveApy,
    } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[
            selectedChain as keyof typeof VAULT_ADDRESS_MAP
        ] as `0x${string}`,
        chain_id: selectedChain,
    })

    const {
        data: boostRewardsData,
        isLoading: isLoadingBoostRewards,
    } = useGetBoostRewards({
        vaultAddress: VAULT_ADDRESS_MAP[
            selectedChain as keyof typeof VAULT_ADDRESS_MAP
        ] as `0x${string}`,
        chainId: selectedChain,
        userAddress: walletAddress,
    })

    const GLOBAL_BOOST_APY =
        boostRewardsData
            ?.filter(
                (item) =>
                    item.description?.includes(
                        'A global boost for all users'
                    ) ?? false
            )
            .reduce((acc, curr) => acc + curr.boost_apy / 100, 0) ?? 0

    const Farcaster_BOOST_APY =
        boostRewardsData
            ?.filter(
                (item) =>
                    !item.description?.includes('A global boost for all users')
            )
            .reduce((acc, curr) => acc + curr.boost_apy / 100, 0) ?? 0

    // Liquidity Land boost logic
    const { data: liquidityLandUsers } = useGetLiquidityLandUsers()
    const isLiquidityLandUser = useMemo(() => {
        if (!walletAddress || !liquidityLandUsers) return false
        return liquidityLandUsers.some(
            (user) =>
                user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        )
    }, [walletAddress, liquidityLandUsers])

    const baseAPY =
        Number(effectiveApyData?.rewards_apy ?? 0) +
        Number(effectiveApyData?.base_apy ?? 0) +
        Number(GLOBAL_BOOST_APY ?? 0) +
        Number(Farcaster_BOOST_APY ?? 0)

    const LIQUIDITY_LAND_BOOST_APY = useMemo(() => {
        if (!isLiquidityLandUser) return 0
        const targetAPY = LIQUIDITY_LAND_TARGET_APY
        const boost = Math.max(0, targetAPY - baseAPY)
        return boost
    }, [isLiquidityLandUser, baseAPY])

    const TOTAL_APY =
        Number(effectiveApyData?.rewards_apy ?? 0) +
        Number(GLOBAL_BOOST_APY ?? 0) +
        Number(Farcaster_BOOST_APY ?? 0) +
        Number(effectiveApyData?.base_apy ?? 0) +
        Number(LIQUIDITY_LAND_BOOST_APY ?? 0)

    const getInputErrorText = (): string | null => {
        if (toWalletAddress.length !== 0 && toWalletAddress.length !== 42) {
            return 'To/Receiver address is invalid'
        }
        if (
            Number(userEnteredTransferAmount) === 0 &&
            userEnteredTransferAmount !== ''
        ) {
            return 'Transfer amount must be greater than 0'
        }
        if (
            Number(userEnteredTransferAmount) >
            Number(userMaxWithdrawAmount)
        ) {
            return 'Amount is more than your withdrawable balance'
        }
        return null
    }

    const errorText = getInputErrorText()

    const placeholderText = !toWalletAddress
        ? 'Enter To/Receiver address to proceed'
        : `Enter amount to proceed transferring USDC from this vault to ${getTruncatedTxHash(toWalletAddress)}`

    const inputText = `You are about to transfer $${userEnteredTransferAmount} worth of USDC from this vault to ${getTruncatedTxHash(toWalletAddress)}`

    function getHelperText() {
        if (!!errorText) {
            return errorText
        } else if (
            userEnteredTransferAmount !== '' &&
            toWalletAddress.length === 42
        ) {
            return inputText
        } else {
            return placeholderText
        }
    }

    const isDiasableActionBtn = () => {
        return (
            toWalletAddress.length !== 42 ||
            Number(userEnteredTransferAmount) > Number(userMaxWithdrawAmount) ||
            Number(userEnteredTransferAmount) === 0
        )
    }

    useEffect(() => {
        // Only calculate share amount if we have a valid transfer amount and user balance
        // if (!userEnteredTransferAmount || userEnteredTransferAmount === '' || Number(userEnteredTransferAmount) === 0) {
        //     setInputAmountInSlUSD('0')
        //     return
        // }

        // Avoid calling contract function if user balance is not available yet
        // if (!userMaxWithdrawAmount || Number(userMaxWithdrawAmount) === 0) {
        //     setInputAmountInSlUSD('0')
        //     return
        // }

        try {
            const _transferAmount = parseUnits(
                userEnteredTransferAmount,
                USDC_DECIMALS
            )
            getShareAmountFromTokenAmount(_transferAmount.toString()).then(
                (result) => {
                    setInputAmountInSlUSD(result.toString())
                }
            ).catch((error) => {
                console.warn('Error calculating share amount:', error)
                setInputAmountInSlUSD('0')
            })
        } catch (error) {
            console.warn('Error parsing transfer amount:', error)
            setInputAmountInSlUSD('0')
        }
    }, [userEnteredTransferAmount, userMaxWithdrawAmount])

    // Get transfer transaction context to monitor completion
    const { setTransferTx } = useTxContext() as TTxContext

        // iOS-specific keyboard handling
    useEffect(() => {
        if (!isDesktop && open) {
            // Store original values
            const originalBodyStyle = document.body.style.cssText
            const originalHtmlStyle = document.documentElement.style.cssText
            
            // Prevent body scroll and fix iOS issues
            document.body.style.overflow = 'hidden'
            document.body.style.position = 'fixed'
            document.body.style.width = '100%'
            document.body.style.height = '100%'
            
            // Set viewport meta to prevent zoom on iOS
            let viewport = document.querySelector('meta[name="viewport"]')
            const originalViewport = viewport?.getAttribute('content')
            
            if (!viewport) {
                viewport = document.createElement('meta')
                viewport.setAttribute('name', 'viewport')
                document.head.appendChild(viewport)
            }
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
            
            // Prevent iOS auto-scroll and zoom
            const handleFocus = (e: FocusEvent) => {
                const target = e.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    // Prevent scrollIntoView
                    e.preventDefault()
                    
                    // Keep focus but prevent scroll
                    setTimeout(() => {
                        target.focus({ preventScroll: true })
                        window.scrollTo(0, 0)
                    }, 100)
                }
            }
            
            // Enable VirtualKeyboard API if available
            if ('virtualKeyboard' in navigator) {
                (navigator as any).virtualKeyboard.overlaysContent = true
            }
            
            // Handle Visual Viewport API for modern iOS
            const handleViewportChange = () => {
                const vv = (window as any).visualViewport
                if (vv) {
                    const drawer = document.querySelector('[data-state="open"]') as HTMLElement
                    if (drawer) {
                        const keyboardHeight = Math.max(0, window.innerHeight - vv.height)
                        if (keyboardHeight > 0) {
                            drawer.style.transform = `translateY(-${Math.min(keyboardHeight, 150)}px)`
                        } else {
                            drawer.style.transform = 'translateY(0)'
                        }
                    }
                }
            }
            
            document.addEventListener('focusin', handleFocus, { passive: false })
            
            const vv = (window as any).visualViewport
            if (vv) {
                vv.addEventListener('resize', handleViewportChange)
            }
            
            return () => {
                // Restore everything
                document.body.style.cssText = originalBodyStyle
                document.documentElement.style.cssText = originalHtmlStyle
                
                if (viewport && originalViewport) {
                    viewport.setAttribute('content', originalViewport)
                }
                
                document.removeEventListener('focusin', handleFocus)
                
                const vv = (window as any).visualViewport
                if (vv) {
                    vv.removeEventListener('resize', handleViewportChange)
                }
                
                // Reset any transforms
                const drawer = document.querySelector('[data-state="open"]') as HTMLElement
                if (drawer) {
                    drawer.style.transform = ''
                }
            }
        }
    }, [open, isDesktop])

    function handleOpenChange(open: boolean) {
        setOpen(open)
        if (!open) {
            // Reset form when closing
            setUserEnteredTransferAmount('')
            setToWalletAddress('')
            setInputAmountInSlUSD('0')

            // Reset transfer transaction state to prevent interference
            setTransferTx((prev: TTransferTx) => ({
                ...prev,
                status: 'transfer',
                hash: '',
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: '',
                isFailed: false,
            }))
        }
    }

    // Close button component
    const closeContentButton = (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black shrink-0" />
            <span className="sr-only">Close</span>
        </Button>
    )

    // Content header
    const contentHeader = (
        <HeadingText
            level="h4"
            weight="medium"
            className="text-gray-800 text-center capitalize"
        >
            Send USDC
        </HeadingText>
    )

    // Content body
    const contentBody = (
        <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between px-3 lg:px-4">
                <BodyText
                    level="body2"
                    weight="normal"
                    className="capitalize text-gray-600"
                >
                    Send
                </BodyText>
                {isWalletConnectedForUI && (
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600 flex items-center gap-[4px]"
                    >
                        Available:{' '}
                        {isLoadingBalance ? (
                            <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                        ) : (
                            abbreviateNumberWithoutRounding(
                                Number(userMaxWithdrawAmount ?? 0),
                                2
                            )
                        )}
                        <span className="inline-block truncate max-w-[70px]">
                            USDC
                        </span>
                    </BodyText>
                )}
            </div>
            <Card className="flex flex-col gap-[12px] p-[16px] bg-transparent shadow-none p-0 lg:px-2">
                <CardContent className="p-0 bg-white rounded-5">
                    {/* Wallet Address Input */}
                    <div
                        className={cn(
                            'border rounded-5 rounded-b-none shadow-[0px_4px_16px_rgba(0,0,0,0.04)]',
                            'border-gray-200 py-[12px] px-[20px] flex items-center gap-[12px]'
                        )}
                    >
                        <WalletIcon className="shrink-0 w-6 h-6 stroke-gray-600" />
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
                                onChange={(e) =>
                                    setToWalletAddress(e.target.value)
                                }
                                placeholder="Enter To/Receiver address"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div
                        className={cn(
                            'border rounded-5 rounded-t-none shadow-[0px_4px_16px_rgba(0,0,0,0.04)]',
                            'border-gray-200 py-[12px] px-[20px] flex items-center gap-[12px]'
                        )}
                    >
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
                                key={'transfer'}
                                amount={userEnteredTransferAmount}
                                setAmount={setUserEnteredTransferAmount}
                            />
                        </div>
                        {isWalletConnectedForUI && (
                            <Button
                                variant="link"
                                onClick={() =>
                                    setUserEnteredTransferAmount(
                                        userMaxWithdrawAmount
                                    )
                                }
                                className="uppercase text-[14px] font-medium w-fit"
                            >
                                max
                            </Button>
                        )}
                    </div>

                    {/* Helper Text */}
                    {!isWalletConnectedForUI && (
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

                {/* Transfer Button */}
                <CardFooter className="p-0 justify-center">
                    <SuperVaultTxDialog
                        disabled={isDiasableActionBtn()}
                        positionType="transfer"
                        assetDetails={{
                            asset: {
                                address: USDC_ADDRESS_MAP[
                                    selectedChain as keyof typeof USDC_ADDRESS_MAP
                                ] as `0x${string}`,
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
                        amount={userEnteredTransferAmount}
                        balance={userMaxWithdrawAmount}
                        setAmount={setUserEnteredTransferAmount}
                        open={isConfirmationDialogOpen}
                        setOpen={setIsConfirmationDialogOpen}
                        setToWalletAddress={setToWalletAddress}
                        userMaxWithdrawAmount={0}
                        onDialogClose={() => handleOpenChange(false)}
                    />
                </CardFooter>
            </Card>
        </div>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    aria-describedby={undefined}
                    className="pt-[25px] max-w-[450px] max-h-[100vh] flex flex-col"
                    showCloseButton={false}
                >
                    {closeContentButton}
                    <DialogHeader className="flex-shrink-0">{contentHeader}</DialogHeader>
                    <div className="flex-shrink-0">
                        {contentBody}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent 
                className="w-full p-5 pt-2 flex flex-col gap-3"
                style={{
                    maxHeight: '70vh',
                    minHeight: '300px',
                    bottom: 'env(keyboard-inset-height, 0px)',
                    transform: 'translateY(0)',
                    transition: 'transform 0.3s ease-out'
                }}
            >
                {closeContentButton}
                <DrawerHeader className="flex-shrink-0">{contentHeader}</DrawerHeader>
                <div className="flex-shrink-0">
                    {contentBody}
                </div>
            </DrawerContent>
        </Drawer>
    )
} 