'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { usePathname, useRouter } from 'next/navigation'
import HomeIcon from './icons/home-icon'
import CompassIcon from './icons/compass-icon'
import PieChartIcon from './icons/pie-chart-icon'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { ArrowRight, InfoIcon, Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'
import ConnectWalletButton from './ConnectWalletButton'
import Link from 'next/link'
import { Badge } from './ui/badge'
import AccessDialog from './AccessDialog'
import sdk from '@farcaster/frame-sdk'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { getMarketsTvlInUsd } from '@/hooks/useSuperlendMarketsData'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { BodyText, HeadingText } from './ui/typography'
import { abbreviateNumberWithoutRounding } from '@/lib/utils'
import InfoTooltip from './tooltips/InfoTooltip'
import { Skeleton } from './ui/skeleton'

type TTab = {
    id: number
    name: string
    href: string
    icon: React.FC<{ height?: number; width?: number; className?: string }>
}

const tabs: TTab[] = [
    // { id: 1, name: 'Home', href: "/", icon: HomeIcon },
    { id: 2, name: 'Discover', href: '/discover', icon: CompassIcon },
    { id: 3, name: 'Portfolio', href: '/portfolio', icon: PieChartIcon },
]

const activeTabInitialValue = (pathname: string) => {
    return tabs.find((tab) => tab.href === pathname) || null
}

const Header: React.FC = () => {
    const router = useRouter()
    const pathname = usePathname()
    const [activeTab, setActiveTab] = useState<TTab | null>(
        activeTabInitialValue(pathname)
    )
    const [openMenu, setOpenMenu] = useState(false)
    const isHomePage = pathname === '/' || pathname === '/super-fund'
    const isLandingPage = pathname === '/'
    const [scrolled, setScrolled] = useState(false)
    const [miniAppUser, setMiniAppUser] = useState<any>(null)
    const { logEvent } = useAnalytics()
    const { totalAssets: superlendTvl, isLoading: isLoadingSuperlendTvl, error: errorSuperlendTvl } = useVaultHook()
    const [totalTVL, setTotalTVL] = useState(0)
    const [isLoadingMarketsTVL, setIsLoadingMarketsTVL] = useState(true)

    const logLogoClick = () => {
        logEvent('clicked_superlend_logo', {
            section: 'header_nav',
            url: !isLandingPage ? 'https://funds.superlend.xyz' : 'https://www.superlend.xyz'
        })
    }

    const logLaunchAppBtnClick = () => {
        logEvent('clicked_superlend_launch_app_btn', {
            section: 'header_nav',
            title: "Launch App",
            url: "https://funds.superlend.xyz/super-fund/base"
        })
    }

    useEffect(() => {
        setIsLoadingMarketsTVL(true)
        getMarketsTvlInUsd()
            .then((totalTVL) => {
                setTotalTVL(totalTVL)
            })
            .catch((error) => {
                console.error('Error fetching total TVL:', error)
            })
            .finally(() => {
                setIsLoadingMarketsTVL(false)
            })
    }, [])

    const isLoadingTotalTVL = isLoadingSuperlendTvl || isLoadingMarketsTVL;

    const totalTvl = useMemo(() => {
        return Number(superlendTvl ?? 0) + Number(totalTVL ?? 0)
    }, [superlendTvl, totalTVL])

    useEffect(() => {
        setActiveTab(activeTabInitialValue(pathname))
    }, [pathname])

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

    // Add scroll event listener
    useEffect(() => {
        const handleScroll = () => {
            // Check if we've scrolled past the hero section (approx 700px)
            const isScrolled = window.scrollY > 700
            setScrolled(isScrolled)
        }

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll)

        // Check initial scroll position
        handleScroll()

        // Clean up
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const handleTabClick = (tab: TTab) => {
        setActiveTab(tab)
        setOpenMenu(false)
        router.push(`${tab.href}`)
    }

    const HEADER_STYLES = `z-50 sticky top-0 left-0 ${isLandingPage ? (scrolled ? 'bg-white shadow-sm' : 'bg-primary') : 'md:top-5'
        } w-full transition-all duration-300`

    const NAV_BAR_STYLES = `flex overflow-hidden gap-5 max-lg:gap-10 justify-between items-center py-0 pr-[8px] pl-4 sm:pl-[20px] w-full font-semibold uppercase mx-auto ${isLandingPage
        ? `max-w-[1400px] py-4 ${scrolled ? 'text-gray-800' : 'text-white'}`
        : 'max-w-[1200px] md:rounded-6 bg-white bg-opacity-40 backdrop-blur shadow-[0px_2px_2px_rgba(0,0,0,0.02)] mx-auto min-h-[56px]'
        }`

    const BUTTON_DEFAULT_DESKTOP_STYLES =
        'group self-stretch p-0 rounded-[14px] uppercase hover:text-primary'
    const BUTTON_INACTIVE_DESKTOP_STYLES = `${BUTTON_DEFAULT_DESKTOP_STYLES} opacity-50 hover:opacity-100`
    const BUTTON_ACTIVE_DESKTOP_STYLES = `${BUTTON_DEFAULT_DESKTOP_STYLES}`

    const BUTTON_DEFAULT_MOBILE_STYLES =
        'group self-stretch border-0 p-0 mx-4 my-2'
    const BUTTON_INACTIVE_MOBILE_STYLES = `${BUTTON_DEFAULT_MOBILE_STYLES} opacity-50`
    const BUTTON_ACTIVE_MOBILE_STYLES = `${BUTTON_DEFAULT_MOBILE_STYLES} text-primary hover:text-primary active`

    const LINK_DEFAULT_STYLES =
        'flex items-center justify-center gap-2 px-1 py-2'

    function isSelected(tab: TTab) {
        return tab.id === activeTab?.id
    }

    function handleCloseMenu() {
        setOpenMenu(false)
    }

    const menuContainerVariant = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    }

    const menuItemVariant = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 },
    }

    if (pathname === '/waitlist') {
        return null
    }

    return (
        <>
            <header className={HEADER_STYLES}>
                <nav className={NAV_BAR_STYLES}>
                    <div className="flex flex-wrap items-center justify-between gap-1 md:gap-4">
                        <Link
                            href={isLandingPage ? 'https://www.superlend.xyz' : '/'}
                            target={miniAppUser ? '_self' : '_blank'}
                            className="relative md:w-[24px] md:w-fit p-0 shrink-0"
                            onClick={logLogoClick}
                        >
                            <img
                                loading="lazy"
                                src={isLandingPage && !scrolled ? '/images/logos/superlend_white_logo.svg' : '/images/logos/superlend-logo.webp'}
                                alt="Superlend logo"
                                className="object-contain shrink-0 my-auto aspect-[6.54] cursor-pointer"
                                width={isLandingPage ? 180 : 144}
                                height={isLandingPage ? 48 : 24}
                            />
                            {/* <Badge
                                    variant="blue"
                                    className="absolute top-1 -right-12 w-fit rounded-full px-2 py-0"
                                >
                                    Beta
                                </Badge> */}
                        </Link>
                        <div className={`flex items-center gap-1 ${isLandingPage ? 'max-md:ml-11' : 'max-md:ml-8'}`}>
                            <div className={`text-sm font-medium leading-none ${(isLandingPage && !scrolled) ? 'text-gray-200' : 'text-gray-700'} flex items-center gap-1`}>
                                TVL
                                {isLoadingTotalTVL && <Skeleton className="w-8 h-4 rounded-3" />}
                                {!isLoadingTotalTVL && <span className="text-sm">${abbreviateNumberWithoutRounding(totalTvl)}</span>}
                            </div>
                            <InfoTooltip
                                isResponsive={false}
                                label={<InfoIcon className="w-3 h-3" />}
                                content={<BodyText level="body2" weight="normal" className="text-gray-600">
                                    TVL across all superlend markets and vaults.
                                </BodyText>}
                            />
                        </div>
                    </div>
                    {/* <nav className="hidden md:flex gap-3 lg:gap-5 items-center self-stretch my-auto text-sm tracking-normal leading-none whitespace-nowrap min-w-[240px] text-stone-800 max-md:max-w-full">
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                variant={isSelected(tab) ? 'default' : 'ghost'}
                                size="lg"
                                className={`${isSelected(tab) ? BUTTON_ACTIVE_DESKTOP_STYLES : BUTTON_INACTIVE_DESKTOP_STYLES}`}
                            // onClick={() => handleTabClick(tab)}
                            >
                                <Link
                                    onClick={() => handleTabClick(tab)}
                                    href={tab.href}
                                    className={`${LINK_DEFAULT_STYLES}`}
                                >
                                    <tab.icon />
                                    <span className="leading-[0]">
                                        {tab.name}
                                    </span>
                                </Link>
                            </Button>
                        ))}
                    </nav> */}
                    <div className="flex items-center gap-[12px]">
                        {!isHomePage && <ConnectWalletButton />}
                        {isLandingPage && (
                            <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/base" onClick={logLaunchAppBtnClick}>
                                <Button
                                    size="lg"
                                    variant={isLandingPage && !scrolled ? 'secondary' : 'primary'}
                                    className={`group rounded-4 py-3 ${isLandingPage && !scrolled ? 'text-primary' : ''}`}
                                >
                                    <span>Launch App</span>
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        )}
                        {/* <Button variant="outline" size={"md"} className="hidden max-md:block rounded-[12px] py-2 border border-gray-500 py-[6px]" onClick={() => setOpenMenu(true)}>
              <Menu className='text-gray-600' />
            </Button> */}
                    </div>
                </nav>
            </header>

            {/* Footer nav */}
            {/* <div className="z-50 fixed bottom-0 left-0 md:hidden w-full flex justify-center">
                <nav className="flex gap-3 lg:gap-5 items-center justify-center self-stretch py-1.5 px-10 text-sm tracking-normal leading-none whitespace-nowrap text-stone-800 w-full bg-white bg-opacity-40 backdrop-blur">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={'ghost'}
                            size="lg"
                            className={`${isSelected(tab) ? BUTTON_ACTIVE_MOBILE_STYLES : BUTTON_INACTIVE_MOBILE_STYLES}`}
                        // onClick={() => handleTabClick(tab)}
                        >
                            <Link
                                onClick={() => handleTabClick(tab)}
                                href={tab.href}
                                className={`${LINK_DEFAULT_STYLES}`}
                            >
                                <tab.icon className="max-sm:w-5 max-sm:h-5" />
                                <span className="hidden max-md:inline-block leading-[0] text-inherit">
                                    {tab.name}
                                </span>
                            </Link>
                        </Button>
                    ))}
                </nav>
            </div> */}
            {/* Footer nav */}
        </>
    )
}

export default Header
