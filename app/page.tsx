'use client'

import React, { useState, useEffect } from 'react'
import MainContainer from '@/components/MainContainer'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { motion, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Asterisk, ArrowRight, Play, ChevronDown, TrendingUp, ChevronUp, BookText, MessageCircleQuestion, Github, FileText, Shield } from 'lucide-react'
import Link from 'next/link'
import ImageWithDefault from '@/components/ImageWithDefault'
import { CHAIN_DETAILS } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import dynamic from 'next/dynamic'
import { ChainProvider, useChain } from '@/context/chain-context'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Container from '@/components/Container'
import sdk from '@farcaster/frame-sdk'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

// Lazy load components
const BenchmarkYieldTable = dynamic(
    () => import('@/components/benchmark-yield-table').then(mod => mod.BenchmarkYieldTable),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[350px] bg-white rounded-lg border border-gray-100 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading yield comparison data...</div>
            </div>
        )
    }
)

// Lazy load the ParticlesBackground component to prevent SSR issues
const ParticlesBackground = dynamic(
    () => import('@/components/ParticlesBackground'),
    { ssr: false }
)

// Chain selector with benchmark table component
function ChainSelectorWithBenchmarkTable() {
    const { selectedChain, setSelectedChain } = useChain();

    return (
        <div className="relative">
            {/* Chain Selector - Moved outside the blurred region */}
            <div className="mb-6 flex items-center justify-end gap-3">
                <BodyText level="body3" className="text-gray-600">Select Network:</BodyText>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedChain(ChainId.Base)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChain === ChainId.Base
                            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <ImageWithDefault
                            src={CHAIN_DETAILS[ChainId.Base].logo}
                            alt="Base"
                            width={20}
                            height={20}
                            className="rounded-full"
                        />
                        <span className="ml-1">Base</span>
                    </button>
                    <button
                        onClick={() => setSelectedChain(ChainId.Sonic)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedChain === ChainId.Sonic
                            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <ImageWithDefault
                            src={CHAIN_DETAILS[ChainId.Sonic].logo}
                            alt="Sonic"
                            width={20}
                            height={20}
                            className="rounded-full"
                        />
                        <span className="ml-1">Sonic</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="relative rounded-xl overflow-hidden">
                {/* Blur overlay for Sonic chain - completely covers the table */}
                {selectedChain === ChainId.Sonic && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                        <HeadingText level="h3" weight="semibold" className="text-gray-800 mb-5">
                            Sonic Chain Coming Soon
                        </HeadingText>
                        <Button
                            size="lg"
                            className="px-8 py-3 text-lg group"
                            onClick={() => window.open('/waitlist', '_blank')}
                        >
                            <span>Join Waitlist</span>
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                )}

                <BenchmarkYieldTable />
            </div>
        </div>
    );
}

export default function HomePage() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const coinControls = useAnimation()
    const [miniAppUser, setMiniAppUser] = useState<any>(null)
    const { logEvent } = useAnalytics()

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

    // Track mouse position for parallax effect
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e
        const { innerWidth, innerHeight } = window

        // Calculate position as percentage of container
        const x = (clientX / innerWidth - 0.5) * 20
        const y = (clientY / innerHeight - 0.5) * 20

        setMousePosition({ x, y })
    }

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

    // Animate coin stacks
    useEffect(() => {
        const animateCoins = async () => {
            while (true) {
                await coinControls.start({
                    y: [0, -8, 0],
                    transition: {
                        duration: 2,
                        ease: "easeInOut",
                        repeat: 0
                    }
                })
                // Pause between animations
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        animateCoins()
    }, [coinControls])

    // Update parallax effect when mouse moves
    useEffect(() => {
        const update3DEffect = () => {
            const element = document.getElementById('visualization-container')
            if (element) {
                element.style.transform = `perspective(1000px) rotateX(${mousePosition.y * 0.05}deg) rotateY(${mousePosition.x * 0.05}deg)`
            }
        }

        update3DEffect()
    }, [mousePosition])

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        }
    }

    const childVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

    const imageVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 0.25,
            scale: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    }

    const smallImageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 0.15,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    }

    const statsCounterVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.8,
                duration: 0.5,
                ease: "easeOut"
            }
        }
    }

    // New animation variants
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                type: "spring",
                stiffness: 100
            }
        }
    }

    const cardVariantsLeft = {
        hidden: { opacity: 0, x: -40 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                type: "spring"
            }
        }
    }

    const cardVariantsRight = {
        hidden: { opacity: 0, x: 40 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                type: "spring"
            }
        }
    }

    const statVariants = {
        hidden: { opacity: 0, scale: 0.7 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: "backOut",
                type: "spring",
                bounce: 0.4
            }
        }
    }

    const iconVariants = {
        hidden: { opacity: 0, rotate: -15, scale: 0.8 },
        visible: {
            opacity: 1,
            rotate: 0,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                type: "spring",
                stiffness: 200
            }
        }
    }

    const fadeInVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.6 }
        }
    }

    return (
        <div onMouseMove={handleMouseMove}>
            {/* SECTION 1: Hero with APY Highlight */}
            <section className="py-28 relative overflow-hidden min-h-screen -mt-[70px] flex items-center justify-center">
                <div className="absolute inset-0 w-full h-full max-w-full z-[-1] bg-primary overflow-hidden">
                    <img src="/banners/hero_bg.svg" alt="Hero banner" className="absolute w-full h-full object-cover" />
                </div>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="w-full z-10 max-w-6xl mx-auto"
                >
                    {/* Centered hero content */}
                    <div className="flex flex-col items-center text-center mb-20">
                        <motion.div variants={childVariants} className="max-w-3xl mx-auto mb-8">
                            <div className="space-y-5">
                                <h1 className="leading-tight text-gray-400 text-4xl md:text-6xl lg:text-7xl font-bold md:max-w-xl lg:max-w-2xl mx-auto">
                                    Maximize Your USDC Returns with SuperFund
                                </h1>
                                <p className="text-gray-400 max-w-lg md:text-lg lg:text-xl mx-auto">
                                    Earn yield on deposits automatically rebalanced across top lending protocols.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div variants={childVariants} className="flex flex-col gap-6 md:gap-4 justify-center mb-12">
                            <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/base" onClick={() => logEvent('clicked_launch_superfund_base_app', {
                                section: 'hero',
                                title: "Maximize Your USDC Returns with SuperFund"
                            })}>
                                <Button size="lg" variant="secondary" className="px-8 py-3 rounded-4 text-lg text-primary group">
                                    <span>Launch SuperFund Base App</span>
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link target={miniAppUser ? '_self' : '_blank'} href="/waitlist" onClick={() => logEvent('clicked_join_superfund_sonic_waitlist', {
                                section: 'hero',
                                title: "Maximize Your USDC Returns with SuperFund"
                            })}>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="px-8 py-3 text-lg text-gray-200 border-gray-200 rounded-4"
                                >
                                    <span>Join SuperFund Sonic Waitlist</span>
                                    <Play className="ml-2 w-4 h-4 fill-gray-200" />
                                </Button>
                            </Link>
                        </motion.div>
                        {/* <motion.div variants={statsCounterVariants} className="bg-white/60 backdrop-blur-sm px-8 py-3 rounded-full shadow-sm">
                                <div className="flex items-center gap-3">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Total Value Locked:
                                    </BodyText>
                                    <HeadingText level="h3" weight="bold" className="text-primary">
                                        ${tvlValue}
                                    </HeadingText>
                                </div>
                            </motion.div> */}
                    </div>
                    {/* Visual Element Below */}
                    {/* Scroll Indicator */}
                    <motion.div
                        variants={childVariants}
                        className="flex justify-center mt-12"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                delay: 1,
                                duration: 0.5,
                                ease: "easeOut",
                                repeat: Infinity,
                                repeatType: "reverse",
                                repeatDelay: 0.5
                            }
                        }}
                    >
                        <ChevronDown strokeWidth={1.5} className="w-12 h-12 text-gray-400" />
                    </motion.div>
                </motion.div>
            </section>

            {/* SECTION 2: Problem → Solution */}
            <Container>
                <section className="py-16">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto"
                    >
                        {/* Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-16">
                            <HeadingText level="h2" weight="bold" className="mb-4">
                                Traditional Banking Is Failing Your Money
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-gray-600 max-w-lg mx-auto">
                                While inflation erodes your savings, traditional financial institutions are offering minimal returns
                            </BodyText>
                        </motion.div>
                        {/* Problems Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                            {/* Problem 1 */}
                            <motion.div
                                variants={cardVariantsLeft}
                                className="bg-white/75 backdrop-blur-sm p-6 rounded-xl shadow-sm"
                            >
                                <motion.div
                                    variants={iconVariants}
                                    className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"
                                >
                                    <span className="text-red-600 text-xl font-bold">1</span>
                                </motion.div>
                                <HeadingText level="h3" weight="semibold" className="mb-3">
                                    Low Bank Yields
                                </HeadingText>
                                <BodyText level="body2" className="text-gray-600">
                                    Traditional savings accounts offer a mere 1-2% APY, effectively losing value against inflation rates of 2-3%.
                                </BodyText>
                            </motion.div>
                            {/* Problem 2 */}
                            <motion.div
                                variants={cardVariants}
                                className="bg-white/75 backdrop-blur-sm p-6 rounded-xl shadow-sm"
                            >
                                <motion.div
                                    variants={iconVariants}
                                    className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"
                                >
                                    <span className="text-red-600 text-xl font-bold">2</span>
                                </motion.div>
                                <HeadingText level="h3" weight="semibold" className="mb-3">
                                    No Growth Mindset
                                </HeadingText>
                                <BodyText level="body2" className="text-gray-600">
                                    Traditional banks focus on fixed rates and don&apos;t try to grow your money. If you want real growth, you need smarter, automated strategies that offer stability—while minimizing risk.                                </BodyText>
                            </motion.div>
                            {/* Problem 3 */}
                            <motion.div
                                variants={cardVariantsRight}
                                className="bg-white/75 backdrop-blur-sm p-6 rounded-xl shadow-sm"
                            >
                                <motion.div
                                    variants={iconVariants}
                                    className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"
                                >
                                    <span className="text-red-600 text-xl font-bold">3</span>
                                </motion.div>
                                <HeadingText level="h3" weight="semibold" className="mb-3">
                                    Limited Access
                                </HeadingText>
                                <BodyText level="body2" className="text-gray-600">
                                    High-yield investment opportunities are typically reserved for accredited investors, leaving retail investors with few options.
                                </BodyText>
                            </motion.div>
                        </div>
                        {/* Divider with Animation */}
                        <motion.div
                            variants={childVariants}
                            className="flex items-center justify-center my-8"
                        >
                            {/* <div className="w-24 h-0.5 bg-gray-400"></div> */}
                            <div className="mx-4 text-primary">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4L12 20M12 20L18 14M12 20L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            {/* <div className="w-24 h-0.5 bg-gray-400"></div> */}
                        </motion.div>
                        {/* Solution Section */}
                        <motion.div variants={childVariants} className="text-center mb-12">
                            <HeadingText level="h2" weight="bold" className="mb-4 text-primary">
                                SuperFund Solution
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-gray-600 max-w-2xl mx-auto">
                                Optimally allocate your USDC across trusted lending protocols to generate consistent and competitive returns
                            </BodyText>
                        </motion.div>
                        {/* Solution Benefits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Solution Details */}
                            <motion.div variants={cardVariantsLeft} className="space-y-6">
                                <div className="flex items-start">
                                    <motion.div
                                        variants={iconVariants}
                                        className="mr-4 mt-1"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                                            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <HeadingText level="h4" weight="semibold" className="mb-1">
                                            Up to 8% APY on USDC
                                        </HeadingText>
                                        <BodyText level="body2" className="text-gray-600">
                                            Earn competitive yields that outpace inflation and traditional banking products.
                                        </BodyText>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <motion.div
                                        variants={iconVariants}
                                        className="mr-4 mt-1"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                                            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <HeadingText level="h4" weight="semibold" className="mb-1">
                                            Optimal Rebalancing
                                        </HeadingText>
                                        <BodyText level="body2" className="text-gray-600">
                                            Funds are allocated across Sonic and Base networks to maximize returns while minimizing risks.
                                        </BodyText>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <motion.div
                                        variants={iconVariants}
                                        className="mr-4 mt-1"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                                            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <HeadingText level="h4" weight="semibold" className="mb-1">
                                            Trusted Protocols
                                        </HeadingText>
                                        <BodyText level="body2" className="text-gray-600">
                                            Your USDC is deployed across established lending platforms like Aave, Morpho, Euler, and Fluid.
                                        </BodyText>
                                    </div>
                                </div>
                                {/* <div className="mt-8">
                                    <Link href="/super-fund">
                                        <Button size="lg" className="px-6 group">
                                            <span>Compare Returns</span>
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </div> */}
                            </motion.div>
                            {/* Comparison Chart */}
                            <motion.div
                                variants={cardVariantsRight}
                                className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-sm"
                            >
                                <HeadingText level="h4" weight="semibold" className="mb-6 text-center">
                                    Annual Returns Comparison
                                </HeadingText>
                                <div className="space-y-4">
                                    {/* SuperFund */}
                                    <motion.div
                                        variants={fadeInVariants}
                                        transition={{ delay: 0.1 }}
                                        className="space-y-1"
                                    >
                                        <div className="flex justify-between items-center">
                                            <BodyText level="body2" weight="medium">SuperFund</BodyText>
                                            <BodyText level="body2" weight="bold" className="text-primary">8.0%</BodyText>
                                        </div>
                                        <motion.div
                                            className="w-full bg-gray-100 rounded-full h-2.5"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "100%" }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                            viewport={{ once: true }}
                                        >
                                            <motion.div
                                                className="bg-primary h-2.5 rounded-full"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '75%' }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                viewport={{ once: true }}
                                            ></motion.div>
                                        </motion.div>
                                    </motion.div>
                                    {/* Competing DeFi */}
                                    <motion.div
                                        variants={fadeInVariants}
                                        transition={{ delay: 0.2 }}
                                        className="space-y-1"
                                    >
                                        <div className="flex justify-between items-center">
                                            <BodyText level="body2" weight="medium">Average USDC Yield (AAVE)</BodyText>
                                            <BodyText level="body2" weight="bold" className="text-blue-600">5%</BodyText>
                                        </div>
                                        <motion.div
                                            className="w-full bg-gray-100 rounded-full h-2.5"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "100%" }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            viewport={{ once: true }}
                                        >
                                            <motion.div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '55%' }}
                                                transition={{ duration: 0.8, delay: 0.3 }}
                                                viewport={{ once: true }}
                                            ></motion.div>
                                        </motion.div>
                                    </motion.div>
                                    {/* Bank */}
                                    <motion.div
                                        variants={fadeInVariants}
                                        transition={{ delay: 0.4 }}
                                        className="space-y-1"
                                    >
                                        <div className="flex justify-between items-center">
                                            <BodyText level="body2" weight="medium">Traditional Bank</BodyText>
                                            <BodyText level="body2" weight="bold" className="text-gray-500">4%</BodyText>
                                        </div>
                                        <motion.div
                                            className="w-full bg-gray-100 rounded-full h-2.5"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "100%" }}
                                            transition={{ duration: 0.5, delay: 0.4 }}
                                            viewport={{ once: true }}
                                        >
                                            <motion.div
                                                className="bg-gray-400 h-2.5 rounded-full"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '40%' }}
                                                transition={{ duration: 0.8, delay: 0.5 }}
                                                viewport={{ once: true }}
                                            ></motion.div>
                                        </motion.div>
                                    </motion.div>
                                </div>
                                {/* Testimonial */}
                                {/* <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-start">
                                        <div className="text-4xl text-gray-200 -mt-2 mr-2">"</div>
                                        <div>
                                            <BodyText level="body2" className="text-gray-600 italic">
                                                I've earned $547 in just 30 days with SuperFund, more than an entire year with my bank savings account.
                                            </BodyText>
                                            <BodyText level="body2" weight="medium" className="mt-2">
                                                — Alex K., SuperFund User
                                            </BodyText>
                                        </div>
                                    </div>
                                </div> */}
                            </motion.div>
                        </div>
                    </motion.div>
                </section>
            </Container>

            {/* SECTION 3: Live Performance Metrics */}
            <Container>
                <section className="py-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto"
                    >
                        {/* Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-8">
                            <HeadingText level="h2" weight="bold" className="mb-4">
                                Why Choose SuperFund?
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-gray-600 max-w-2xl mx-auto">
                                Compare SuperFund yields with other platforms and see how your assets grow over time
                            </BodyText>
                        </motion.div>
                        {/* Yield Table and Stats Cards Side by Side - grid grid-cols-1 lg:grid-cols-4 gap-6 */}
                        <div className="max-w-3xl mx-auto mb-12">
                            {/* Yield Table - Left Side (3/4 width) - lg:col-span-3 */}
                            <div className="overflow-hidden relative">
                                <ChainProvider>
                                    <ChainSelectorWithBenchmarkTable />
                                </ChainProvider>
                            </div>
                            {/* Stats Cards - Right Side (1/4 width) - Stacked vertically */}
                            {/* <div className="flex flex-col gap-6 z-10 md:pt-16">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <BodyText level="body2" weight="medium" className="text-gray-500">
                                            Total Value Locked
                                        </BodyText>
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                                <path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline space-x-1">
                                        <HeadingText level="h2" weight="bold" className="text-gray-800">
                                            $10.5M
                                        </HeadingText>
                                        <span className="text-green-600 text-sm font-medium">+12.4%</span>
                                    </div>
                                    <BodyText level="body3" className="text-gray-500 mt-1">
                                        Updated live
                                    </BodyText>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <BodyText level="body2" weight="medium" className="text-gray-500">
                                            Average APY
                                        </BodyText>
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-600">
                                                <path d="M23 6L13.5 15.5L8.5 10.5L1 18M23 6H17M23 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline space-x-1">
                                        <HeadingText level="h2" weight="bold" className="text-gray-800">
                                            13.8%
                                        </HeadingText>
                                        <span className="text-green-600 text-sm font-medium">+2.1%</span>
                                    </div>
                                    <BodyText level="body3" className="text-gray-500 mt-1">
                                        Last 30 days
                                    </BodyText>
                                </div>
                            </div> */}
                        </div>
                    </motion.div>
                </section>
            </Container>

            {/* SECTION 4: Available on 2 fastest growing chains */}
            <Container>
                <section className="py-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto"
                    >
                        {/* Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-16">
                            <HeadingText level="h2" weight="bold" className="mb-4">
                                Available on 2 fastest growing chains
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-gray-600 max-w-2xl mx-auto">
                                SuperFund deploys your assets across multiple protocols to capture the highest yields while minimizing risk
                            </BodyText>
                        </motion.div>
                        {/* Chain Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                            {/* Base Network Card */}
                            <motion.div
                                variants={cardVariantsRight}
                                className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-indigo-100 shadow-sm"
                            >
                                {/* Background Decoration */}
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 0.2 }}
                                    transition={{ duration: 0.8 }}
                                    viewport={{ once: true }}
                                    className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-200/20 rounded-full"
                                ></motion.div>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 0.2 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    viewport={{ once: true }}
                                    className="absolute bottom-16 -left-16 w-32 h-32 bg-indigo-200/20 rounded-full"
                                ></motion.div>
                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Header with Logo */}
                                    <div className="flex items-center mb-6">
                                        <div className="bg-white rounded-full p-2 shadow-md mr-4">
                                            <ImageWithDefault
                                                src={CHAIN_DETAILS[ChainId.Base].logo}
                                                alt="Base"
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div>
                                            <HeadingText level="h3" weight="semibold">
                                                Base
                                            </HeadingText>
                                            <div className="flex items-center mt-1">
                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                                <BodyText level="body2" className="text-green-700">
                                                    Live
                                                </BodyText>
                                            </div>
                                        </div>
                                    </div>
                                    {/* APY Badge */}
                                    <div className="inline-block bg-white px-4 py-2 rounded-full shadow-sm mb-6">
                                        <span className="text-xl font-bold text-indigo-600">Up to 8% APY</span>
                                    </div>
                                    {/* Key Benefits */}
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-indigo-500">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <BodyText level="body2" className="text-gray-700">
                                                Ethereum-grade security with low fees
                                            </BodyText>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-indigo-500">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <BodyText level="body2" className="text-gray-700">
                                                Access to leading lending markets and deep liquidity
                                            </BodyText>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-indigo-500">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <BodyText level="body2" className="text-gray-700">
                                                Base offers the best of Ethereum but at a fraction of the cost (10–100x cheaper)
                                            </BodyText>
                                        </div>
                                    </div>
                                    {/* CTA Button */}
                                    <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/base" onClick={() => logEvent('clicked_launch_superfund_base_app', {
                                        section: 'base_network_card',
                                        title: "Available on 2 fastest growing chains"
                                    })}>
                                        <Button
                                            className="w-full h-12 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                            <span className="relative z-10 group-hover:text-white">Launch SuperFund Base App</span>
                                            <ArrowRight className="relative z-10 ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:text-white transition-all duration-200" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                            {/* Sonic Network Card */}
                            <motion.div
                                variants={cardVariantsLeft}
                                className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200 shadow-sm"
                            >
                                {/* Background Decoration */}
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 0.2 }}
                                    transition={{ duration: 0.8 }}
                                    viewport={{ once: true }}
                                    className="absolute -top-16 -right-16 w-48 h-48 bg-blue-200/20 rounded-full"
                                ></motion.div>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 0.2 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    viewport={{ once: true }}
                                    className="absolute bottom-16 -left-16 w-32 h-32 bg-blue-200/20 rounded-full"
                                ></motion.div>
                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Header with Logo */}
                                    <div className="flex items-center mb-6">
                                        <div className="bg-white rounded-full p-2 shadow-md mr-4">
                                            <ImageWithDefault
                                                src={CHAIN_DETAILS[ChainId.Sonic].logo}
                                                alt="Sonic"
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div>
                                            <HeadingText level="h3" weight="semibold">
                                                Sonic
                                            </HeadingText>
                                            <div className="flex items-center mt-1">
                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                                <BodyText level="body2" className="text-blue-700">
                                                    Coming soon
                                                </BodyText>
                                            </div>
                                        </div>
                                    </div>
                                    {/* APY Badge */}
                                    <div className="inline-block bg-white px-4 py-2 rounded-full shadow-sm mb-6">
                                        <span className="text-xl font-bold text-blue-600">Coming soon</span>
                                    </div>
                                    {/* Key Benefits */}
                                    <div className="space-y-4 mb-12">
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-blue-500">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <BodyText level="body2" className="text-gray-700">
                                                Sonic is the highest-performing EVM L1
                                            </BodyText>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-blue-500">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <BodyText level="body2" className="text-gray-700">
                                                Higher APY potential with optimized protocol selection
                                            </BodyText>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-blue-500">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <BodyText level="body2" className="text-gray-700">
                                                Real sub-second confirmation times
                                            </BodyText>
                                        </div>
                                    </div>
                                    {/* CTA Button */}
                                    <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/sonic" onClick={() => logEvent('clicked_join_superfund_sonic_waitlist', {
                                        section: 'sonic_network_card',
                                        title: "Available on 2 fastest growing chains"
                                    })}>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-white border-indigo-200 text-indigo-800 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-indigo-300"
                                        >
                                            <span className="absolute inset-0 bg-indigo-50 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
                                            <span className="relative z-10">Join Waitlist</span>
                                            <ArrowRight className="relative z-10 ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                        {/* Supplementary Info */}
                        <motion.div
                            variants={cardVariants}
                            className="bg-gray-50 p-6 rounded-xl border border-gray-100 max-w-3xl mx-auto"
                        >
                            <HeadingText level="h4" weight="semibold" className="mb-4 text-center">
                                Why SuperFund Strategy Matters
                            </HeadingText>
                            <BodyText level="body2" className="text-gray-600 mb-4 text-center">
                                SuperFund&apos;s approach diversifies your deposits across protocols to:
                            </BodyText>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <motion.div
                                    variants={statVariants}
                                    className="flex flex-col items-center text-center p-4"
                                >
                                    <motion.div
                                        variants={iconVariants}
                                        className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                            <path d="M8 13V17M16 11V17M12 7V17M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800 mb-1">
                                        Maximize Yield
                                    </BodyText>
                                    <BodyText level="body3" className="text-gray-600">
                                        Capture the highest available rates across different chains
                                    </BodyText>
                                </motion.div>
                                <motion.div
                                    variants={statVariants}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col items-center text-center p-4"
                                >
                                    <motion.div
                                        variants={iconVariants}
                                        className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-600">
                                            <path d="M9 12L11 14L15 10M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800 mb-1">
                                        Reduce Risk
                                    </BodyText>
                                    <BodyText level="body3" className="text-gray-600">
                                        Mitigate protocol-specific risks through diversification
                                    </BodyText>
                                </motion.div>
                                <motion.div
                                    variants={statVariants}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col items-center text-center p-4"
                                >
                                    <motion.div
                                        variants={iconVariants}
                                        className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600">
                                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800 mb-1">
                                        Continuous Monitoring
                                    </BodyText>
                                    <BodyText level="body3" className="text-gray-600">
                                        24/7 automated monitoring systems detect and respond to anomalies in real-time
                                    </BodyText>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>
            </Container>

            {/* NEW SECTION: FAQ */}
            {/* <Container>
                <section className="pb-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto"
                    >
                        <motion.div variants={childVariants} className="text-center mb-8">
                            <HeadingText level="h2" weight="bold" className="mb-4">
                                You have got Questions?
                            </HeadingText>
                        </motion.div>
                        <motion.div variants={childVariants} className="max-w-3xl mx-auto bg-white/75 backdrop-blur-sm rounded-xl shadow-sm px-6">
                            <Accordion type="single" collapsible className="w-full">
                                <motion.div
                                    variants={cardVariants}
                                    transition={{ delay: 0.1 }}
                                >
                                    <AccordionItem value="item-1" className="border-b border-gray-200">
                                        <AccordionTrigger className="text-left py-5 text-gray-800 font-medium hover:no-underline">
                                            How does SuperFund optimize my USDC deposits?
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5 text-gray-600">
                                            SuperFund optimizes your USDC deposits by intelligently allocating them across multiple lending protocols like Aave, Morpho, Euler, and Fluid. Our system continuously analyzes market conditions and rebalances your assets to maximize returns while maintaining appropriate risk levels. This multi-protocol approach ensures you consistently earn competitive yields without having to manually manage multiple positions.
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                                <motion.div
                                    variants={cardVariants}
                                    transition={{ delay: 0.2 }}
                                >
                                    <AccordionItem value="item-2" className="border-b border-gray-200">
                                        <AccordionTrigger className="text-left py-5 text-gray-800 font-medium hover:no-underline">
                                            What makes SuperFund's yield strategy different?
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5 text-gray-600">
                                            SuperFund's strategy differs from traditional approaches by dynamically rebalancing your USDC across multiple lending protocols rather than using a single platform. Our systems continuously monitor yield opportunities and automatically adjust allocations to capture the highest returns. This diversification also helps reduce risk by not having all your assets in a single protocol, providing both better yields and enhanced security.
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                                <motion.div
                                    variants={cardVariants}
                                    transition={{ delay: 0.3 }}
                                >
                                    <AccordionItem value="item-3" className="border-b border-gray-200">
                                        <AccordionTrigger className="text-left py-5 text-gray-800 font-medium hover:no-underline">
                                            How does SuperFund achieve higher yields than traditional options?
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5 text-gray-600">
                                            SuperFund achieves up to 8% APY on USDC through protocol optimization - significantly higher than the 4% from traditional banks and 5% from single DeFi platforms like Aave. This is possible because we actively rebalance your funds across multiple lending protocols, targeting those with the best rates at any given time while maintaining a balanced risk profile. Our technology constantly monitors market conditions to maximize returns.
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                                <motion.div
                                    variants={cardVariants}
                                    transition={{ delay: 0.4 }}
                                >
                                    <AccordionItem value="item-4" className="border-b border-gray-200">
                                        <AccordionTrigger className="text-left py-5 text-gray-800 font-medium hover:no-underline">
                                            What lending protocols does SuperFund integrate with?
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5 text-gray-600">
                                            SuperFund integrates with established lending protocols like Aave, Morpho, Euler, and Fluid. These protocols have been carefully selected based on their security track record, liquidity depth, and yield potential. By using multiple trusted protocols simultaneously, we can capture the best rates available while spreading risk. Our team continually evaluates new protocols for potential integration based on rigorous security standards.
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                                <motion.div
                                    variants={cardVariants}
                                    transition={{ delay: 0.5 }}
                                >
                                    <AccordionItem value="item-5" className="border-b border-gray-200">
                                        <AccordionTrigger className="text-left py-5 text-gray-800 font-medium hover:no-underline">
                                            How does SuperFund manage risks while maximizing returns?
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5 text-gray-600">
                                            SuperFund manages risk through protocol diversification and continuous monitoring. By distributing your USDC across multiple lending protocols rather than concentrating in one, we reduce the impact of any single protocol's issues.
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            </Accordion>
                        </motion.div>
                    </motion.div>
                </section>
            </Container> */}

            {/* Call To Action Section */}
            <Container>
                <section className="py-16">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-5xl mx-auto"
                    >
                        <motion.div variants={childVariants} className="text-center mb-10">
                            <HeadingText level="h2" weight="bold" className="mb-4">
                                Ready to Maximize Your USDC Returns?
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-gray-600 max-w-2xl mx-auto">
                                Choose your preferred network and start earning optimal yields today
                            </BodyText>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {/* Base Network Card Button */}
                            <motion.div
                                variants={cardVariantsLeft}
                                className="group"
                            >
                                <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/base" className="block h-full" onClick={() => logEvent('clicked_launch_superfund_base_app', {
                                    section: 'base_network_card',
                                    title: "Ready to Maximize Your USDC Returns?"
                                })}>
                                    <div className="h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl backdrop-blur-lg p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="bg-white rounded-full p-3 shadow-sm">
                                                    <ImageWithDefault
                                                        src={CHAIN_DETAILS[ChainId.Base].logo}
                                                        alt="Base"
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <HeadingText level="h3" weight="semibold" className="text-gray-800">
                                                    Base
                                                </HeadingText>
                                                <div className="inline-block bg-white px-3 py-1 rounded-full shadow-sm">
                                                    <span className="text-xs font-bold text-indigo-600">Up to 8% APY</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            className="w-full h-12 mt-4 bg-primary text-white hover:bg-primary/90 group-hover:shadow-lg transition-all duration-300"
                                        >
                                            <span>Launch SuperFund Base App</span>
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Sonic Network Card Button */}
                            <motion.div
                                variants={cardVariantsRight}
                                className="group"
                            >
                                <Link target={miniAppUser ? '_self' : '_blank'} href="/waitlist" className="block h-full" onClick={() => logEvent('clicked_join_superfund_sonic_waitlist', {
                                    section: 'sonic_network_card',
                                    title: "Ready to Maximize Your USDC Returns?"
                                })}>
                                    <div className="h-full bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl backdrop-blur-lg p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="bg-white rounded-full p-3 shadow-sm">
                                                    <ImageWithDefault
                                                        src={CHAIN_DETAILS[ChainId.Sonic].logo}
                                                        alt="Sonic"
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <HeadingText level="h3" weight="semibold" className="text-gray-800">
                                                    Sonic
                                                </HeadingText>
                                                <div className="inline-block bg-white px-3 py-1 rounded-full shadow-sm shrink-0">
                                                    <span className="text-xs font-bold text-blue-600">Coming soon</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="lg"
                                            className="w-full h-12 mt-4 hover:bg-indigo-700 hover:text-white group-hover:shadow-lg text-indigo-600 transition-all duration-300"
                                        >
                                            <span>Join SuperFund Sonic Waitlist</span>
                                            <Play className="ml-2 w-4 h-4 fill-white" />
                                        </Button>
                                    </div>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>
            </Container>

            {/* Footer Section */}
            <footer className="bg-gray-50/50 rounded-4 py-16">
                <div className="w-full max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {/* Column 1: Logo and Tagline */}
                        <div className="md:col-span-1">
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
                                    <Link href="https://docs.superlend.xyz/superlend-markets/security-and-audits" target="_blank" className="text-gray-600 hover:text-primary transition-colors">
                                        Security
                                    </Link>
                                </li>
                            </ul>
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
                            <Link href="https://superlend.xyz" target="_blank">
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
        </div>
    )
}
