import { FC, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { Card } from '../ui/card'
import Image from 'next/image'
import useDimensions from '@/hooks/useDimensions'
import { BodyText, HeadingText, Label } from '../ui/typography'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { copyToClipboard, hasLowestDisplayValuePrefix, clearApprovedWallet } from '@/lib/utils'
import { getLowestDisplayValue } from '@/lib/utils'
import { isLowestValue } from '@/lib/utils'
import { abbreviateNumber } from '@/lib/utils'
import { Button } from '../ui/button'
import { ArrowRightLeft, Check, Copy, LoaderCircle, LogOut, X } from 'lucide-react'
import AccessDialog from '../AccessDialog'
import { useRouter } from 'next/navigation'
import { useChain } from '@/context/chain-context'
import { ChainId } from '@/types/chain'

interface ProfileMenuDropdownProps {
    open: boolean
    setOpen: (open: boolean) => void
    displayText: string
    logout: () => Promise<void>
    walletAddress: string
    showOptions?: {
        disconnect?: boolean
        viewTransactions?: boolean
    }
}

const defaultShowOptions = {
    disconnect: true,
    viewTransactions: true
}

export const ProfileMenuDropdown: FC<ProfileMenuDropdownProps> = ({
    open,
    setOpen,
    displayText,
    walletAddress,
    logout,
    showOptions = defaultShowOptions
}) => {
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const [addressIsCopied, setAddressIsCopied] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [connectionError, setConnectionError] = useState(false)
    const { selectedChain } = useChain()
    const router = useRouter()

    // Get the chain name for routing
    const getChainName = () => {
        if (selectedChain === ChainId.Base) return 'base'
        if (selectedChain === ChainId.Sonic) return 'sonic'
        return 'sonic'
    }

    function handleAddressCopy() {
        copyToClipboard(walletAddress)
        setAddressIsCopied(true)
        setTimeout(() => {
            setAddressIsCopied(false)
        }, 1000)
    }

    const handleLogout = async () => {
        clearApprovedWallet()
        setIsLoggingOut(true)
        try {
            await logout()
            setOpen(false)
        } catch (error) {
            console.error('Profile menu logout error:', error)
            // Still close the menu even if logout fails
            setOpen(false)
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handleViewTransactions = () => {
        router.push(`/super-fund/${getChainName()}/txs`)
        setOpen(false)
    }

    const handleError = () => {
        setConnectionError(true)
        setTimeout(() => {
            setConnectionError(false)
        }, 3000)
    }

    const handleAddWalletClick = () => {
        setOpen(false)
        setDialogOpen(true)
    }

    const triggerButton = (
        <Button
            variant="default"
            size="lg"
            className="rounded-4 py-2 capitalize w-full"
            onClick={() => setOpen(!open)}
        >
            {displayText}
        </Button>
    )

    // const content = (
    //     <Card className="w-full pt-6 pb-1.5 border-0 shadow-none bg-white bg-opacity-100 divide-y divide-gray-200">
    //         <div className="flex items-center gap-2 mb-6 px-6">
    //             <Button
    //                 variant={'outline'}
    //                 className="capitalize rounded-4 py-2 border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25"
    //                 size={'lg'}
    //             >
    //                 All Chains
    //             </Button>
    //             <ScrollArea className="w-full h-[200px] whitespace-nowrap">
    //                 <div className="flex gap-2">
    //                     {chains.map((chain: any) => (
    //                         <Button
    //                             key={chain.name}
    //                             variant={'outline'}
    //                             className={`px-3 py-2 rounded-4 flex items-center justify-center border-gray-300 bg-gray-200/50 hover:bg-gray-200/90 active:bg-gray-300/25`}
    //                         >
    //                             <Image
    //                                 src={chain.logo}
    //                                 alt={chain.name}
    //                                 width={28}
    //                                 height={28}
    //                                 className="rounded-full"
    //                             />
    //                         </Button>
    //                     ))}
    //                     <ScrollBar orientation="horizontal" />
    //                 </div>
    //             </ScrollArea>
    //         </div>
    //         <ScrollArea className="max-h-[60vh] h-[60vh] w-full pb-0">
    //             <div className="space-y-2 px-4">
    //                 {tokens.map((token: any, index: number) => (
    //                     <div
    //                         key={index}
    //                         className="flex items-center justify-between py-2 pl-2 pr-6 hover:bg-gray-200 hover:rounded-4"
    //                     >
    //                         <div className="flex items-center gap-3 select-none">
    //                             <div
    //                                 className={`w-8 h-8 rounded-full flex items-center justify-center`}
    //                             >
    //                                 <Image
    //                                     src={token.logo}
    //                                     alt={token.symbol}
    //                                     width={28}
    //                                     height={28}
    //                                     className="rounded-full"
    //                                 />
    //                             </div>
    //                             <div>
    //                                 <BodyText level="body2" weight="medium">
    //                                     {token.symbol}
    //                                 </BodyText>
    //                                 <Label className="text-gray-700">{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</Label>
    //                             </div>
    //                         </div>
    //                         <div className="text-right select-none">
    //                             <BodyText
    //                                 level="body2"
    //                                 weight="medium"
    //                             >{`${hasLowestDisplayValuePrefix(Number(token.positionAmount))} ${formatAmountToDisplay(token.positionAmount)}`}</BodyText>
    //                             <Label className="text-gray-700">{`${hasLowestDisplayValuePrefix(Number(token.positionAmountInUsd))} $${formatAmountToDisplay(token.positionAmountInUsd)}`}</Label>
    //                         </div>
    //                     </div>
    //                 ))}
    //             </div>
    //         </ScrollArea>
    //     </Card>
    // )

    // SUB_COMPONENT: Close button to close the dialog
    const closeButton = (
        <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    )

    const content = (
        <div className="flex flex-col gap-8 md:gap-6 pt-2">
            <div className="flex items-center justify-center gap-2">
                <div className="rounded-full w-6 h-6 bg-gradient-to-r from-[#f9b16e] to-[#f68080]"></div>
                <BodyText level={isDesktop ? 'body2' : 'body1'} weight="bold">
                    {displayText}
                </BodyText>
                <Button
                    variant="ghost"
                    onClick={handleAddressCopy}
                    className={`p-0 ${addressIsCopied ? 'select-none' : ''}`}
                >
                    {addressIsCopied ? (
                        <Check className="w-4 h-4 stroke-green-700" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </Button>
            </div>
            <div className="flex flex-col gap-3">
                {/* <Button
                    variant="secondaryOutline"
                    size="lg"
                    className="w-full capitalize rounded-4"
                    onClick={handleAddWalletClick}
                >
                    Add new wallet
                </Button> */}
                {showOptions.viewTransactions && (
                    <Button
                        variant="secondaryOutline"
                        size="lg"
                        className="w-full capitalize rounded-4 flex items-center justify-center gap-2"
                        onClick={handleViewTransactions}
                    >
                        View transactions
                        <ArrowRightLeft className="w-4 h-4 text-secondary-500" />
                    </Button>
                )}
                {showOptions.disconnect && (
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-4 py-3 md:py-2 capitalize w-full flex items-center justify-center gap-2 hover:border-red-500 hover:text-red-500"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'Disconnecting...' : 'Disconnect'}
                        {isLoggingOut ? (
                            <LoaderCircle className="text-primary w-4 h-4 animate-spin" />
                        ) : (
                            <LogOut className="w-4 h-4" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    )

    if (isDesktop) {
        return (
            <>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        {triggerButton}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-full rounded-7 p-4 bg-opacity-40 min-w-[300px]"
                    >
                        {content}
                    </DropdownMenuContent>
                </DropdownMenu>
                <AccessDialog
                    open={dialogOpen}
                    setOpen={setDialogOpen}
                    onError={handleError}
                />
            </>
        )
    }

    return (
        <>
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
                <DrawerContent className="w-full p-4 dismissible-false">
                    <DrawerHeader>
                        {/* <DrawerTitle>Token Balances</DrawerTitle> */}
                        {closeButton}
                        <DrawerDescription>
                            <VisuallyHidden.Root asChild>
                                View connected wallet details
                            </VisuallyHidden.Root>
                        </DrawerDescription>
                    </DrawerHeader>
                    {content}
                </DrawerContent>
            </Drawer>
            <AccessDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                onError={handleError}
            />
        </>
    )
}

function formatAmountToDisplay(amount: string) {
    if (isLowestValue(Number(amount ?? 0))) {
        return getLowestDisplayValue(Number(amount ?? 0))
    } else {
        return abbreviateNumber(Number(amount ?? 0))
    }
}
