import { FC, useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
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
import { formatAmountToDisplay, hasLowestDisplayValuePrefix } from '@/lib/utils'
import { getLowestDisplayValue } from '@/lib/utils'
import { isLowestValue } from '@/lib/utils'
import { abbreviateNumber } from '@/lib/utils'
import { Button } from '../ui/button'
import ImageWithBadge from '../ImageWithBadge'
import { Skeleton } from '../ui/skeleton'
// import { useAssetsDataContext } from '@/context/data-provider'
import ImageWithDefault from '../ImageWithDefault'
import { ArrowLeft, SearchX, X } from 'lucide-react'
import SearchInput from '../inputs/SearchInput'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { Badge } from '../ui/badge'
import { STABLECOINS_NAMES_LIST } from '@/constants'
import { useActiveAccount } from "thirdweb/react"

interface TokenDetails {
    symbol: string
    address: string
    amount: string
    price_usd: string
    logo?: string
    decimals: number
    chain_id?: number
    chain_logo?: string
    chain_name?: string
}

interface NetworkDetails {
    name: string
    logo: string
    chainId: number
}

interface ChainDetails {
    chain_id: number
    logo: string
}

interface SelectTokenDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    tokens: TokenDetails[]
    onSelectToken: (token: any) => void
    isLoading?: boolean
    filterByChain?: boolean
    showChainBadge?: boolean
}

export const SelectTokenDialog: FC<SelectTokenDialogProps> = ({
    open,
    setOpen,
    tokens,
    onSelectToken,
    isLoading,
    filterByChain = true,
    showChainBadge = true,
}: SelectTokenDialogProps) => {
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const maxChainsToShow = isDesktop ? 4 : 3
    const [selectedChains, setSelectedChains] = useState<string[]>([])
    const [showAllChains, setShowAllChains] = useState(false);
    const [keywords, setKeywords] = useState<string>('')
    // const { isWalletConnected } = useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnected = !!account

    useEffect(() => {
        if (open) {
            setKeywords('')
            setSelectedChains([])
            setShowAllChains(false)
        }
    }, [open])

    useEffect(() => {
        setKeywords('')
    }, [showAllChains])

    function handleKeywordChange(e: any) {
        setKeywords(e.target.value)
    }

    function handleClearSearch() {
        setKeywords('')
    }

    const handleSelectChain = (chainId: number) => {
        setSelectedChains((prev) => {
            if (prev.includes(chainId.toString())) {
                return prev.filter((id) => id !== chainId.toString())
            } else {
                return [...prev, chainId.toString()]
            }
        })
    }

    function isChainSelected(chainId: number) {
        return selectedChains.includes(chainId.toString())
    }

    function handleSelectChainClick(chainId: number) {
        handleSelectChain(chainId)
        setShowAllChains(false)
    }

    function sortTokensByBalance(a: any, b: any) {
        if (!isWalletConnected) {
            const aIndex = STABLECOINS_NAMES_LIST.indexOf(a.symbol);
            const bIndex = STABLECOINS_NAMES_LIST.indexOf(b.symbol);

            // If both tokens are stablecoins, sort by their order in the list
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            // If only a is a stablecoin, it should come first
            if (aIndex !== -1) return -1;
            // If only b is a stablecoin, it should come first  
            if (bIndex !== -1) return 1;
            // If neither are stablecoins, maintain original order
            return 0;
        }
        return (b.balance || 0) - (a.balance || 0);
    }

    const filteredTokens = ((selectedChains.length > 0 && filterByChain) ?
        tokens.filter((token: any) =>
            selectedChains.includes(token.chain_id.toString()) &&
            token?.symbol?.toLowerCase().includes(keywords.toLowerCase())
        ).sort(sortTokensByBalance) :
        tokens.filter((token: any) =>
            token?.symbol?.toLowerCase().includes(keywords.toLowerCase())
        )).sort(sortTokensByBalance);

    const noFilteredTokensFound = tokens.length === 0 || filteredTokens?.length === 0

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = (
        <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.3rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    )

    // SUB_COMPONENT: Back button to close the dialog
    const backButton = (
        <Button
            variant="ghost"
            onClick={() => setShowAllChains(false)}
            className="h-6 w-6 flex items-center justify-center absolute left-6 top-[1.5rem] rounded-full bg-white opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <ArrowLeft strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Back</span>
        </Button>
    )

    // SUB_COMPONENT: Content
    const content = (
        <Card className={`w-full py-2 border-0 shadow-none bg-white bg-opacity-100 ${showAllChains ? '' : 'divide-y divide-gray-200'}`}>
            {showAllChains && backButton}
            {/* UI: List of tokens */}
            <ScrollArea className="h-[300px] lg:h-full w-full max-h-[400px]">
                {/* Search bar UI */}
                <div className="sticky -top-0.5 left-0 right-0 z-10 px-5 py-2 bg-white">
                    <SearchInput
                        onChange={handleKeywordChange}
                        onClear={handleClearSearch}
                        value={keywords}
                        placeholder={`Search by ${showAllChains ? 'chain name' : 'token name'}`}
                        className="bg-gray-200"
                    />
                </div>
                <div className="space-y-2 px-4">
                    {/* UI when loading */}
                    {isLoading &&
                        Array.from({ length: 5 }).map((_, index) => (
                            <LoadingBalanceItemSkeleton key={index} />
                        ))
                    }
                    {/* UI when does not have tokens */}
                    {(!isLoading &&
                        ((!showAllChains && noFilteredTokensFound) ||
                            (showAllChains))) &&
                        <div className="flex items-center justify-center gap-2 h-full py-10">
                            <SearchX className='w-6 h-6 text-gray-500' />
                            <BodyText level="body1" weight="semibold" className="text-gray-500">
                                No {showAllChains ? 'chains' : 'tokens'} found
                            </BodyText>
                        </div>

                    }
                    {/* Tokens List */}
                    {(!isLoading && filteredTokens.length > 0 && !showAllChains) &&
                        filteredTokens
                            .map((token: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between py-2 pl-2 pr-6 cursor-pointer hover:bg-gray-200 active:bg-gray-300 hover:rounded-4 active:rounded-4"
                                    onClick={() => onSelectToken(token)}
                                >
                                    <div className="flex items-center gap-1 select-none">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center`}
                                        >
                                            {showChainBadge &&
                                                <ImageWithBadge
                                                    mainImg={token.logo}
                                                    badgeImg={token.chain_logo}
                                                    mainImgAlt={token.symbol}
                                                    badgeImgAlt={token.chain_id}
                                                />
                                            }
                                            {!showChainBadge &&
                                                <Image
                                                    src={token.logo}
                                                    alt={token.symbol}
                                                    width={28}
                                                    height={28}
                                                    className="rounded-full h-[28px] w-[28px] max-w-[28px] max-h-[28px]"
                                                />
                                            }
                                        </div>
                                        <div className="flex flex-col gap-0">
                                            <BodyText level="body2" weight="medium">
                                                {token.symbol}
                                            </BodyText>
                                            <Label className="text-gray-700">{`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}</Label>
                                        </div>
                                    </div>
                                    {isWalletConnected &&
                                        <div className="text-right select-none flex flex-col gap-0">
                                            <BodyText
                                                level="body2"
                                                weight="medium"
                                            >{`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.amount))} ${formatAmountToDisplay(token.balance ?? token.amount)}`}</BodyText>
                                            <Label className="text-gray-700">{`${hasLowestDisplayValuePrefix(Number(token.balance ?? token.amount) * Number(token.price_usd))} $${formatAmountToDisplay((Number(token.balance ?? token.amount) * Number(token.price_usd)).toString())}`}</Label>
                                        </div>
                                    }
                                </div>
                            ))
                    }
                </div>
            </ScrollArea>

        </Card>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[436px] w-full pt-4 pb-2 px-2">
                    <DialogHeader className="pt-2 select-none">
                        <HeadingText level="h5" weight="medium" className={`text-center`}>
                            Select {showAllChains ? 'Chain' : 'Token'}
                        </HeadingText>
                        <VisuallyHidden.Root asChild>
                            <DialogDescription>
                                Select a token by chain
                            </DialogDescription>
                        </VisuallyHidden.Root>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="dismissible-false">
                {/* X Icon to close the dialog */}
                {closeContentButton}
                <DrawerHeader className="pt-6">
                    <DrawerTitle asChild>
                        <HeadingText level="h5" weight="medium">
                            Select {showAllChains ? 'Chain' : 'Token'}
                        </HeadingText>
                    </DrawerTitle>
                    <DrawerDescription>
                        <VisuallyHidden.Root asChild>
                            Select a token by chain
                        </VisuallyHidden.Root>
                    </DrawerDescription>
                </DrawerHeader>
                {content}
            </DrawerContent>
        </Drawer>
    )
}

function LoadingBalanceItemSkeleton() {
    return (
        <div className="flex items-center justify-between py-2 pl-2 pr-6">
            <div className="flex items-center gap-1 select-none">
                <Skeleton className="w-8 h-8 rounded-full bg-stone-200" />
                <div className="flex flex-col gap-1">
                    <Skeleton className="w-24 h-4 rounded-2 bg-stone-200" />
                    <Skeleton className="w-16 h-2 rounded-2 bg-stone-200" />
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Skeleton className="w-24 h-4 rounded-2 bg-stone-200" />
                <Skeleton className="w-16 h-2 rounded-2 bg-stone-200" />
            </div>
        </div>
    )
}
