'use client'

import React, { useState } from 'react'
import { HeadingText, BodyText } from '@/components/ui/typography'
import Image from 'next/image'
import { Github, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import SubscribeWithEmail from './subscribe-with-email'
import { usePathname } from 'next/navigation'

export default function Footer() {
    const { logEvent } = useAnalytics()
    const pathname = usePathname()
    const isWaitlistPage = pathname === '/waitlist'

    const logXLinkClick = () => {
        logEvent('clicked_superlend_x_link', {
            section: 'footer',
            title: "x",
            url: "https://x.com/SuperlendHQ"
        })
    }

    const logDiscordLinkClick = () => {
        logEvent('clicked_superlend_discord_link', {
            section: 'footer',
            title: "Discord",
            url: "https://discord.com/invite/superlend"
        })
    }

    const logGitHubLinkClick = () => {
        logEvent('clicked_superlend_github_link', {
            section: 'footer',
            title: "GitHub",
            url: "https://github.com/Superlend"
        })
    }

    const logDocsLinkClick = () => {
        logEvent('clicked_superlend_docs_link', {
            section: 'footer',
            title: "Docs",
            url: "https://docs.superlend.xyz/superlend-vaults/superfunds"
        })
    }

    const logMainLaningPageLinkClick = () => {
        logEvent('clicked_superlend_main_landing_page_link', {
            section: 'footer',
            title: "SuperFund by Superlend",
            url: "https://superlend.xyz"
        })
    }

    if (isWaitlistPage) {
        return null
    }

    return (
        <footer className="bg-gray-50/50 rounded-4 py-16">
            <div className="w-full px-12">
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-12">
                    {/* Column 1: Logo and Tagline */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Image
                                src="/images/logos/superlend-rounded.svg"
                                alt="SuperFund"
                                width={40}
                                height={40}
                            />
                            <div className="flex flex-col gap-0">
                                <HeadingText level="h4" weight="semibold" className="text-gray-900">
                                    SuperFund
                                </HeadingText>
                                <BodyText level="body3" weight="medium" className="inline-block text-gray-600">
                                    by <Link href="https://superlend.xyz" target="_blank" className="inline-block w-fit text-primary hover:underline hover:text-primary/80 transition-colors"
                                        onClick={logMainLaningPageLinkClick}
                                    >
                                        Superlend
                                    </Link>
                                </BodyText>
                            </div>
                        </div>
                        <BodyText level="body2" className="text-gray-600 mb-6">
                            Earn smarter with SuperFund, an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.
                        </BodyText>
                        <BodyText level="body2" className="text-gray-600 mb-6">
                            To Lend, Borrow, and Earn across 350+ DeFi markets, visit <Link href="https://app.superlend.xyz" target="_blank" className="inline-block w-fit text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
                                onClick={() => logEvent('clicked_superlend_app_link', {
                                    section: 'footer',
                                    title: "Superlend",
                                    url: "https://app.superlend.xyz"
                                })}
                            >
                                Superlend
                            </Link>
                        </BodyText>
                        <div className="flex gap-4">
                            <Link href="https://x.com/SuperlendHQ" target="_blank" aria-label="X (Twitter)"
                                onClick={logXLinkClick}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                    {/* X (formerly Twitter) logo */}
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-gray-700">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </div>
                            </Link>
                            <Link href="https://discord.com/invite/superlend" target="_blank" aria-label="Discord" onClick={logDiscordLinkClick}>
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                    {/* Discord logo */}
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-gray-700">
                                        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.885-.608 1.283a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.283.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                                    </svg>
                                </div>
                            </Link>
                            <Link href="https://github.com/Superlend" target="_blank" aria-label="GitHub" onClick={logGitHubLinkClick}>
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                    <Github className="w-5 h-5 text-gray-700" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Column 2: Resources */}
                    <div className="md:col-span-1">
                        <HeadingText level="h5" weight="semibold" className="text-gray-900 mb-4">
                            Resources
                        </HeadingText>
                        <ul className="space-y-3">
                            <li>
                                <Link href="https://docs.superlend.xyz/superlend-vaults/superfunds" target="_blank" className="text-gray-600 hover:text-primary transition-colors" onClick={logDocsLinkClick}>
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="https://github.com/Superlend/superfund-strategies-public" target="_blank" className="text-gray-600 hover:text-primary transition-colors" onClick={logGitHubLinkClick}>
                                    GitHub
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Community */}
                    <div className="md:col-span-1">
                        <HeadingText level="h5" weight="semibold" className="text-gray-900 mb-4">
                            Community
                        </HeadingText>
                        <ul className="space-y-3">
                            <li>
                                <Link href="https://discord.com/invite/superlend" target="_blank" className="text-gray-600 hover:text-primary transition-colors"
                                    onClick={logDiscordLinkClick}
                                >
                                    Discord
                                </Link>
                            </li>
                            <li>
                                <Link href="https://x.com/SuperlendHQ" target="_blank" className="text-gray-600 hover:text-primary transition-colors"
                                    onClick={logXLinkClick}
                                >
                                    X (Twitter)
                                </Link>
                            </li>
                            {/* <li>
                            <Link href="https://blog.superlend.xyz" target="_blank" className="text-gray-600 hover:text-primary transition-colors">
                                Blog
                            </Link>
                        </li>
                        <li>
                            <Link href="https://t.me/superlend" target="_blank" className="text-gray-600 hover:text-primary transition-colors">
                                Telegram
                            </Link>
                        </li> */}
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div className="md:col-span-1">
                        <HeadingText level="h5" weight="semibold" className="text-gray-900 mb-4">
                            Legal
                        </HeadingText>
                        <ul className="space-y-3">
                            {/* <li>
                            <Link href="/terms" target="_blank" className="text-gray-600 hover:text-primary transition-colors">
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacy" target="_blank" className="text-gray-600 hover:text-primary transition-colors">
                                Privacy Policy
                            </Link>
                        </li> */}
                            <li>
                                <Link href="https://docs.superlend.xyz/superlend-vaults/superfunds/security" target="_blank" className="text-gray-600 hover:text-primary transition-colors">
                                    Security
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 5: Newsletter */}
                    <div className="lg:col-span-2">
                        <div className="w-full max-w-sm">
                            <SubscribeWithEmail />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-400 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
                    <BodyText level="body3" className="text-gray-500 mb-4 md:mb-0">
                        © 2024 SuperFund. All rights reserved.
                    </BodyText>
                    <div className="flex items-center gap-2">
                        <BodyText level="body3" className="text-gray-500">
                            Powered by
                        </BodyText>
                        <Link href="https://superlend.xyz" target="_blank" onClick={logMainLaningPageLinkClick}>
                            <div className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Image
                                    src="/images/logos/superlend-rounded.svg"
                                    alt="SuperLend"
                                    width={16}
                                    height={16}
                                />
                                <span className="font-medium">Superlend</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
