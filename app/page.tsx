'use client'

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import MainContainer from '@/components/MainContainer'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Asterisk, ArrowRight, Play, ChevronDown, TrendingUp, ChevronUp, BookText, MessageCircleQuestion, Github, FileText, Shield, AlertTriangle, Lock, Users, CheckCircle, BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'
import ImageWithDefault from '@/components/ImageWithDefault'
import { CHAIN_DETAILS } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import dynamic from 'next/dynamic'
import { useChain } from '@/context/chain-context'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Container from '@/components/Container'
import sdk from '@farcaster/frame-sdk'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { VAULT_ADDRESS_MAP } from '@/lib/constants'
import { useApyData } from '@/context/apy-data-provider'
import { useGetEffectiveApy } from '@/hooks/vault_hooks/useGetEffectiveApy'
import { abbreviateNumber } from '@/lib/utils'
import FAQ from '@/data/faq'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import { useWalletConnection } from '@/hooks/useWalletConnection'

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

// Loading component for lazy sections
const SectionLoader = () => (
    <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
)

// Lazy load heavy sections for better performance
const ProblemSolutionSection = lazy(() =>
    Promise.resolve({
        default: ({
            containerVariants,
            childVariants,
            cardVariantsLeft,
            cardVariants,
            cardVariantsRight,
            iconVariants,
            fadeInVariants,
            TOTAL_VAULT_APY,
            shouldReduceMotion
        }: any) => (
            <Container>
                <section className="py-16">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto"
                    >
                        {/* Modern Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100/80 to-orange-100/80 rounded-full mb-6"
                            >
                                <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-slate-700">The Problem</span>
                            </motion.div>
                            <HeadingText level="h2" weight="bold" className="mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                                Traditional Banking Is Failing Your Money
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-slate-600 max-w-lg mx-auto leading-relaxed">
                                While inflation erodes your savings, traditional financial institutions are offering minimal returns
                            </BodyText>
                        </motion.div>

                        {/* Enhanced Problems Grid */}
                        <div className="relative mb-16">
                            {/* Animated Background Elements - Replaced with CSS */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-red-400/5 to-orange-400/5 rounded-full blur-xl animate-spin-slow" />
                                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-orange-400/5 to-red-400/5 rounded-full blur-xl animate-spin-reverse-slow" />
                            </div>

                            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Problem 1 - Enhanced */}
                                <motion.div
                                    variants={cardVariantsLeft}
                                    className="group relative h-full hover:scale-105 transition-transform duration-300"
                                >
                                    <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                                        {/* 3D Icon Container - Simplified */}
                                        <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg group-hover:shadow-red-500/25 transition-all duration-300" />
                                            <div className="absolute inset-0.5 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center">
                                                <div className="animate-bounce-slow">
                                                    <TrendingUp className="w-8 h-8 text-white transform rotate-180" />
                                                </div>
                                            </div>
                                            {/* Floating particles - CSS only */}
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full blur-sm animate-pulse" />
                                        </div>

                                        <div className="text-center flex-1 flex flex-col justify-center">
                                            <HeadingText level="h3" weight="bold" className="mb-3 text-slate-800 group-hover:text-red-700 transition-colors">
                                                Low Bank Yields
                                            </HeadingText>
                                            <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                Traditional savings accounts offer a mere 1-2% APY, effectively losing value against inflation rates of 2-3%.
                                            </BodyText>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>

                                {/* Problem 2 - Enhanced */}
                                <motion.div
                                    variants={cardVariants}
                                    className="group relative h-full hover:scale-105 transition-transform duration-300"
                                >
                                    <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                                        {/* 3D Icon Container - Simplified */}
                                        <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300" />
                                            <div className="absolute inset-0.5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center">
                                                <div className="animate-pulse">
                                                    <AlertTriangle className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            {/* Floating particles - CSS only */}
                                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-400 rounded-full blur-sm animate-ping" />
                                        </div>

                                        <div className="text-center flex-1 flex flex-col justify-center">
                                            <HeadingText level="h3" weight="bold" className="mb-3 text-slate-800 group-hover:text-orange-700 transition-colors">
                                                No Growth Mindset
                                            </HeadingText>
                                            <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                Traditional banks focus on fixed rates and don&apos;t try to grow your money. If you want real growth, you need smarter, automated strategies that offer stability—while minimizing risk.
                                            </BodyText>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>

                                {/* Problem 3 - Enhanced */}
                                <motion.div
                                    variants={cardVariantsRight}
                                    className="group relative h-full hover:scale-105 transition-transform duration-300"
                                >
                                    <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                                        {/* 3D Icon Container - Simplified */}
                                        <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg group-hover:shadow-rose-500/25 transition-all duration-300" />
                                            <div className="absolute inset-0.5 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center">
                                                <div className="animate-wiggle">
                                                    <Lock className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            {/* Floating particles - CSS only */}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-rose-400 rounded-full blur-sm animate-spin" />
                                        </div>

                                        <div className="text-center flex-1 flex flex-col justify-center">
                                            <HeadingText level="h3" weight="bold" className="mb-3 text-slate-800 group-hover:text-rose-700 transition-colors">
                                                Limited Access
                                            </HeadingText>
                                            <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                High-yield investment opportunities are typically reserved for accredited investors, leaving retail investors with few options.
                                            </BodyText>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                        {/* Enhanced Divider with Animation - Simplified */}
                        <motion.div
                            variants={childVariants}
                            className="flex items-center justify-center my-16"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                                    <div className="text-primary animate-bounce-slow">
                                        <ArrowRight className="w-8 h-8 transform rotate-90" />
                                    </div>
                                </div>
                                {/* Floating particles around divider - CSS only */}
                                <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary/40 rounded-full blur-sm animate-ping" />
                                <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-500/40 rounded-full blur-sm animate-pulse" />
                            </div>
                        </motion.div>

                        {/* Enhanced Solution Section */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-blue-50/50 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12 mb-16">
                            {/* Animated Background Elements - CSS only */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-blue-400/10 rounded-full blur-xl animate-spin-slow" />
                                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-spin-reverse-slow" />
                            </div>

                            <div className="relative z-10">
                                {/* Modern Solution Header */}
                                <motion.div variants={childVariants} className="text-center mb-12">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full mb-6"
                                    >
                                        <div className="w-2 h-2 bg-gradient-to-r from-primary to-blue-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-medium text-slate-700">The Solution</span>
                                    </motion.div>
                                    <HeadingText level="h2" weight="bold" className="mb-4 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        SuperFund Solution
                                    </HeadingText>
                                    <BodyText level="body1" weight="medium" className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                        Optimally allocate your USDC across trusted lending protocols to generate consistent and competitive returns
                                    </BodyText>
                                </motion.div>

                                {/* Enhanced Solution Benefits Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {/* Enhanced Solution Details */}
                                    <motion.div variants={cardVariantsLeft} className="space-y-8">
                                        {/* Benefit 1 */}
                                        <div className="group flex items-start p-6 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 transition-all duration-300 hover:scale-105">
                                            <div className="relative w-12 h-12 mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-lg group-hover:shadow-primary/25 transition-all duration-300" />
                                                <div className="absolute inset-0.5 bg-gradient-to-br from-primary/90 to-blue-500/90 rounded-xl flex items-center justify-center">
                                                    <div className="">
                                                        <TrendingUp className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <HeadingText level="h4" weight="bold" className="mb-2 text-slate-800 group-hover:text-primary transition-colors">
                                                    Up to {TOTAL_VAULT_APY}% APY on USDC
                                                </HeadingText>
                                                <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                    Earn competitive yields that outpace inflation and traditional banking products.
                                                </BodyText>
                                            </div>
                                        </div>

                                        {/* Benefit 2 */}
                                        <div className="group flex items-start p-6 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 transition-all duration-300 hover:scale-105">
                                            <div className="relative w-12 h-12 mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300" />
                                                <div className="absolute inset-0.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                                                    <div className="animate-pulse">
                                                        <BarChart3 className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <HeadingText level="h4" weight="bold" className="mb-2 text-slate-800 group-hover:text-blue-600 transition-colors">
                                                    Optimal Rebalancing
                                                </HeadingText>
                                                <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                    Funds are allocated across Sonic and Base networks to maximize returns while minimizing risks.
                                                </BodyText>
                                            </div>
                                        </div>

                                        {/* Benefit 3 */}
                                        <div className="group flex items-start p-6 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 transition-all duration-300 hover:scale-105">
                                            <div className="relative w-12 h-12 mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300" />
                                                <div className="absolute inset-0.5 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
                                                    <div className="animate-bounce-slow">
                                                        <Shield className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <HeadingText level="h4" weight="bold" className="mb-2 text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                    Trusted Protocols
                                                </HeadingText>
                                                <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                    Your USDC is deployed across established lending platforms like Aave, Morpho, Euler, and Fluid.
                                                </BodyText>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Enhanced Comparison Chart */}
                                    <motion.div
                                        variants={cardVariantsRight}
                                        className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500"
                                    >
                                        {/* Chart Header */}
                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full mb-4">
                                                <BarChart3 className="w-4 h-4 text-slate-600" />
                                                <span className="text-xs font-medium text-slate-600">Performance Comparison</span>
                                            </div>
                                            <HeadingText level="h4" weight="bold" className="text-slate-800">
                                                Annual Returns Comparison
                                            </HeadingText>
                                        </div>

                                        <div className="space-y-6">
                                            {/* SuperFund */}
                                            <motion.div
                                                variants={fadeInVariants}
                                                transition={{ delay: 0.1 }}
                                                className="space-y-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-blue-500"></div>
                                                        <BodyText level="body2" weight="medium" className="text-slate-700">SuperFund</BodyText>
                                                    </div>
                                                    <BodyText level="body2" weight="bold" className="text-primary">8.0%</BodyText>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-primary to-blue-500 h-3 rounded-full shadow-sm w-4/5 animate-pulse"></div>
                                                </div>
                                            </motion.div>

                                            {/* Competing DeFi */}
                                            <motion.div
                                                variants={fadeInVariants}
                                                transition={{ delay: 0.2 }}
                                                className="space-y-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                        <BodyText level="body2" weight="medium" className="text-slate-700">Average USDC Yield (AAVE)</BodyText>
                                                    </div>
                                                    <BodyText level="body2" weight="bold" className="text-blue-600">5%</BodyText>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-blue-500 h-3 rounded-full shadow-sm w-1/2"></div>
                                                </div>
                                            </motion.div>

                                            {/* Traditional Bank */}
                                            <motion.div
                                                variants={fadeInVariants}
                                                transition={{ delay: 0.4 }}
                                                className="space-y-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                                        <BodyText level="body2" weight="medium" className="text-slate-700">Traditional Bank</BodyText>
                                                    </div>
                                                    <BodyText level="body2" weight="bold" className="text-slate-500">4%</BodyText>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-slate-400 h-3 rounded-full shadow-sm w-1/3"></div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* Performance Highlight */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.8 }}
                                            className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl border border-primary/20"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="w-4 h-4 text-primary animate-pulse" />
                                                <BodyText level="body3" weight="medium" className="text-primary">Performance Advantage</BodyText>
                                            </div>
                                            <BodyText level="body3" className="text-slate-600">
                                                SuperFund delivers <span className="font-semibold text-primary">2x higher returns</span> than traditional banking and <span className="font-semibold text-primary">60% more</span> than average DeFi yields.
                                            </BodyText>
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </Container>
        )
    })
)

const NetworksSection = lazy(() =>
    Promise.resolve({
        default: ({
            containerVariants,
            childVariants,
            cardVariantsLeft,
            cardVariants,
            cardVariantsRight,
            iconVariants,
            statVariants,
            miniAppUser,
            logEvent,
            TOTAL_VAULT_APY,
            shouldReduceMotion
        }: any) => (
            <Container>
                <section className="py-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto"
                    >
                        {/* Enhanced Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full mb-6"
                            >
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-slate-700">Multi-Protocol Allocation</span>
                            </motion.div>
                            <HeadingText level="h2" weight="bold" className="mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                                Available on the fastest growing chains
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                SuperFund deploys your assets across multiple protocols to capture the highest yields while minimizing risk
                            </BodyText>
                        </motion.div>
                        {/* Enhanced Chain Cards */}
                        <div className="relative mb-16">
                            {/* Animated Background Elements - CSS only */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-spin-slow" />
                                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-indigo-400/5 to-blue-400/5 rounded-full blur-xl animate-spin-reverse-slow" />
                            </div>

                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Enhanced Base Network Card */}
                                <motion.div
                                    variants={cardVariantsRight}
                                    className="group relative hover:scale-105 transition-transform duration-300"
                                >
                                    <div className="relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                                        {/* Enhanced Background Decoration - CSS only */}
                                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-primary/10 to-blue-400/10 rounded-full blur-xl animate-spin-slow" />
                                        <div className="absolute bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-spin-reverse-slow" />

                                        {/* Enhanced Content */}
                                        <div className="relative z-10">
                                            {/* Enhanced Header with 3D Logo */}
                                            <div className="flex items-center mb-6">
                                                <div className="relative w-16 h-16 mr-4 group-hover:scale-110 transition-transform duration-300">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg group-hover:shadow-primary/25 transition-all duration-300" />
                                                    <div className="absolute inset-0.5 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                                                        <ImageWithDefault
                                                            src={CHAIN_DETAILS[ChainId.Base].logo}
                                                            alt="Base"
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full"
                                                        />
                                                    </div>
                                                    {/* Floating particles - CSS only */}
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/40 rounded-full blur-sm animate-pulse" />
                                                </div>
                                                <div>
                                                    <HeadingText level="h3" weight="semibold" className="text-slate-800 group-hover:text-primary transition-colors">
                                                        Base
                                                    </HeadingText>
                                                    <div className="flex items-center mt-1">
                                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                        <BodyText level="body2" className="text-green-700 font-medium">
                                                            Live
                                                        </BodyText>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enhanced APY Badge */}
                                            <div className="inline-block bg-gradient-to-r from-primary/10 to-blue-500/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-primary/20 mb-6 hover:scale-105 transition-transform duration-300">
                                                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                                    Up to {TOTAL_VAULT_APY}% APY
                                                </span>
                                            </div>

                                            {/* Enhanced Key Benefits */}
                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-start group/benefit hover:translate-x-1 transition-transform duration-200">
                                                    <div className="mr-3 mt-1 text-primary group-hover/benefit:scale-110 transition-transform duration-200">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <BodyText level="body2" className="text-slate-700 group-hover/benefit:text-slate-800 transition-colors">
                                                        Ethereum-grade security with low fees
                                                    </BodyText>
                                                </div>
                                                <div className="flex items-start group/benefit hover:translate-x-1 transition-transform duration-200">
                                                    <div className="mr-3 mt-1 text-primary group-hover/benefit:scale-110 transition-transform duration-200">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <BodyText level="body2" className="text-slate-700 group-hover/benefit:text-slate-800 transition-colors">
                                                        Access to leading lending markets and deep liquidity
                                                    </BodyText>
                                                </div>
                                                <div className="flex items-start group/benefit hover:translate-x-1 transition-transform duration-200">
                                                    <div className="mr-3 mt-1 text-primary group-hover/benefit:scale-110 transition-transform duration-200">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <BodyText level="body2" className="text-slate-700 group-hover/benefit:text-slate-800 transition-colors">
                                                        Base offers the best of Ethereum but at a fraction of the cost (10–100x cheaper)
                                                    </BodyText>
                                                </div>
                                            </div>

                                            {/* Enhanced CTA Button */}
                                            <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/base" onClick={() => logEvent('clicked_launch_superfund_base_app', {
                                                section: 'base_network_card',
                                                title: "Available on the fastest growing chains"
                                            })}>
                                                <div className="hover:scale-105 transition-transform duration-200">
                                                    <Button className="w-full h-12 group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300">
                                                        {/* <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}
                                                        <span className="relative z-10 text-white font-medium">Launch SuperFund Base App</span>
                                                        <div className="relative z-10 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                                            <ArrowRight className="w-4 h-4 text-white" />
                                                        </div>
                                                    </Button>
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>
                                {/* Enhanced Sonic Network Card */}
                                <motion.div
                                    variants={cardVariantsLeft}
                                    className="group relative hover:scale-105 transition-transform duration-300"
                                >
                                    <div className="relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                                        {/* Enhanced Background Decoration - CSS only */}
                                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-spin-slow" />
                                        <div className="absolute bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-xl animate-spin-reverse-slow" />

                                        {/* Enhanced Content */}
                                        <div className="relative z-10">
                                            {/* Enhanced Header with 3D Logo */}
                                            <div className="flex items-center mb-6">
                                                <div className="relative w-16 h-16 mr-4 group-hover:scale-110 transition-transform duration-300">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300" />
                                                    <div className="absolute inset-0.5 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                                                        <ImageWithDefault
                                                            src={CHAIN_DETAILS[ChainId.Sonic].logo}
                                                            alt="Sonic"
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full"
                                                        />
                                                    </div>
                                                    {/* Floating particles - CSS only */}
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400/40 rounded-full blur-sm animate-pulse" />
                                                </div>
                                                <div>
                                                    <HeadingText level="h3" weight="semibold" className="text-slate-800 group-hover:text-blue-600 transition-colors">
                                                        Sonic
                                                    </HeadingText>
                                                    <div className="flex items-center mt-1">
                                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
                                                        <BodyText level="body2" className="text-blue-700 font-medium">
                                                            Coming soon
                                                        </BodyText>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enhanced APY Badge */}
                                            <div className="inline-block bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-blue-500/20 mb-6 hover:scale-105 transition-transform duration-300">
                                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                    Coming soon
                                                </span>
                                            </div>

                                            {/* Enhanced Key Benefits */}
                                            <div className="space-y-4 mb-12">
                                                <div className="flex items-start group/benefit hover:translate-x-1 transition-transform duration-200">
                                                    <div className="mr-3 mt-1 text-blue-600 group-hover/benefit:scale-110 transition-transform duration-200">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <BodyText level="body2" className="text-slate-700 group-hover/benefit:text-slate-800 transition-colors">
                                                        Sonic is the highest-performing EVM L1
                                                    </BodyText>
                                                </div>
                                                <div className="flex items-start group/benefit hover:translate-x-1 transition-transform duration-200">
                                                    <div className="mr-3 mt-1 text-blue-600 group-hover/benefit:scale-110 transition-transform duration-200">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <BodyText level="body2" className="text-slate-700 group-hover/benefit:text-slate-800 transition-colors">
                                                        Higher APY potential with optimized protocol selection
                                                    </BodyText>
                                                </div>
                                                <div className="flex items-start group/benefit hover:translate-x-1 transition-transform duration-200">
                                                    <div className="mr-3 mt-1 text-blue-600 group-hover/benefit:scale-110 transition-transform duration-200">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <BodyText level="body2" className="text-slate-700 group-hover/benefit:text-slate-800 transition-colors">
                                                        Real sub-second confirmation times
                                                    </BodyText>
                                                </div>
                                            </div>

                                            {/* Enhanced CTA Button */}
                                            <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/sonic" onClick={() => logEvent('clicked_join_superfund_sonic_waitlist', {
                                                section: 'sonic_network_card',
                                                title: "Available on the fastest growing chains"
                                            })}>
                                                <div className="hover:scale-105 transition-transform duration-200">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800 group relative overflow-hidden hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300"
                                                    >
                                                        {/* <span className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}
                                                        <span className="relative z-10 font-medium">Join Waitlist</span>
                                                        <div className="relative z-10 ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </div>
                                                    </Button>
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                        {/* Modern Strategy Section with 3D Elements */}
                        <motion.div
                            variants={cardVariants}
                            className="relative overflow-hidden bg-gradient-to-br from-slate-50/80 via-white/90 to-blue-50/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-5xl mx-auto"
                        >
                            {/* Animated Background Elements - CSS only */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl animate-spin-slow" />
                                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-xl animate-spin-reverse-slow" />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/5 to-cyan-400/5 rounded-full blur-3xl animate-float" />
                            </div>

                            <div className="relative z-10 p-8 md:p-12">
                                {/* Header with Enhanced Typography */}
                                <motion.div
                                    variants={childVariants}
                                    className="text-center mb-12"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full mb-6"
                                    >
                                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-medium text-slate-700">Strategy Overview</span>
                                    </motion.div>
                                    <HeadingText level="h3" weight="bold" className="mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                                        Why SuperFund Strategy Matters
                                    </HeadingText>
                                    <BodyText level="body1" className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                        SuperFund&apos;s approach diversifies your deposits across protocols to:
                                    </BodyText>
                                </motion.div>

                                {/* Enhanced Feature Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Maximize Yield Card */}
                                    <motion.div
                                        variants={statVariants}
                                        className="group relative hover:scale-105 transition-transform duration-300"
                                    >
                                        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                                            {/* 3D Icon Container - Simplified */}
                                            <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300" />
                                                <div className="absolute inset-0.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                                                    <div className="">
                                                        <TrendingUp className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                                {/* Floating particles - CSS only */}
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full blur-sm animate-pulse" />
                                            </div>

                                            <div className="text-center">
                                                <HeadingText level="h4" weight="bold" className="mb-3 text-slate-800 group-hover:text-blue-700 transition-colors">
                                                    Maximize Yield
                                                </HeadingText>
                                                <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                    Capture the highest available rates across different chains with intelligent allocation
                                                </BodyText>
                                            </div>

                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </motion.div>

                                    {/* Reduce Risk Card */}
                                    <motion.div
                                        variants={statVariants}
                                        transition={{ delay: 0.1 }}
                                        className="group relative hover:scale-105 transition-transform duration-300"
                                    >
                                        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                                            {/* 3D Icon Container - Simplified */}
                                            <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300" />
                                                <div className="absolute inset-0.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                                                    <div className="animate-pulse">
                                                        <Shield className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                                {/* Floating particles - CSS only */}
                                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-400 rounded-full blur-sm animate-ping" />
                                            </div>

                                            <div className="text-center">
                                                <HeadingText level="h4" weight="bold" className="mb-3 text-slate-800 group-hover:text-green-700 transition-colors">
                                                    Reduce Risk
                                                </HeadingText>
                                                <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                    Mitigate protocol-specific risks through smart diversification and monitoring
                                                </BodyText>
                                            </div>

                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </motion.div>

                                    {/* Continuous Monitoring Card */}
                                    <motion.div
                                        variants={statVariants}
                                        transition={{ delay: 0.2 }}
                                        className="group relative hover:scale-105 transition-transform duration-300"
                                    >
                                        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500">
                                            {/* 3D Icon Container - Simplified */}
                                            <div className="relative w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300" />
                                                <div className="absolute inset-0.5 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center">
                                                    <div className="animate-spin-slow">
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {/* Floating particles - CSS only */}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-400 rounded-full blur-sm animate-spin" />
                                            </div>

                                            <div className="text-center">
                                                <HeadingText level="h4" weight="bold" className="mb-3 text-slate-800 group-hover:text-purple-700 transition-colors">
                                                    Continuous Monitoring
                                                </HeadingText>
                                                <BodyText level="body2" className="text-slate-600 leading-relaxed">
                                                    24/7 automated systems detect and respond to market changes in real-time
                                                </BodyText>
                                            </div>

                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>
            </Container>
        )
    })
)

const FAQSection = lazy(() =>
    Promise.resolve({
        default: ({
            containerVariants,
            childVariants,
            cardVariants,
            shouldReduceMotion
        }: any) => (
            <Container>
                <section className="pb-8 relative">
                    {/* Animated Background Elements - CSS only */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/5 to-indigo-400/5 rounded-full blur-xl animate-spin-slow" />
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-xl animate-spin-reverse-slow" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-float" />
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-6xl mx-auto relative z-10"
                    >
                        {/* Enhanced Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100/80 to-indigo-100/80 rounded-full mb-6"
                            >
                                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-slate-700">FAQ</span>
                            </motion.div>
                            <HeadingText level="h2" weight="bold" className="mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                                You have got Questions?
                            </HeadingText>
                        </motion.div>

                        {/* Enhanced FAQ Container */}
                        <motion.div
                            variants={childVariants}
                            className="relative max-w-4xl mx-auto"
                        >
                            <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                                {/* Enhanced Background Decoration - CSS only */}
                                <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-xl animate-spin-slow" />
                                <div className="absolute bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-xl animate-spin-reverse-slow" />

                                <div className="relative z-10 p-8">
                                    <Accordion type="single" collapsible className="w-full space-y-4">
                                        {/* Enhanced FAQ Items */}
                                        {FAQ.map((faq: any) => (
                                            <AccordionItem
                                                key={faq.value}
                                                value={faq.value}
                                                className="relative bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
                                            >
                                                {/* 3D Icon Container for each FAQ - Simplified */}
                                                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                                                    <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3 shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300" />
                                                        <div className="absolute inset-0.5 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3 flex items-center justify-center">
                                                            <div className="">
                                                                <MessageCircleQuestion className="w-4 h-4 text-white" />
                                                            </div>
                                                        </div>
                                                        {/* Floating particles - CSS only */}
                                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-400/40 rounded-full blur-sm animate-pulse" />
                                                    </div>
                                                </div>

                                                <AccordionTrigger className="text-left py-6 pl-20 pr-6 text-slate-800 font-medium hover:no-underline group-hover:text-purple-700 transition-colors duration-300">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6 pl-20 pr-6 text-slate-700 leading-relaxed">
                                                    {typeof faq.answer === 'string' ? faq.answer : faq.answer}
                                                </AccordionContent>

                                                {/* Hover Effect Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>

                                {/* Glass morphism effect overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none" />
                            </div>
                        </motion.div>
                    </motion.div>
                </section>
            </Container>
        )
    })
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
    const { selectedChain, chainDetails } = useChain()
    const { walletAddress } = useWalletConnection()
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chain_id: selectedChain || 0,
    })
    // const { boostApy: BOOST_APY, isLoading: isLoadingBoostApy } = useApyData()
    const { data: boostRewardsData, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
        vaultAddress: VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP] as `0x${string}`,
        chainId: selectedChain,
        userAddress: walletAddress
    })
    const BOOST_APY = boostRewardsData?.reduce((acc, curr) => acc + (curr.boost_apy / 100), 0) ?? 0
    const TOTAL_VAULT_APY = abbreviateNumber(Number(effectiveApyData?.total_apy ?? 0) + Number(BOOST_APY ?? 0))

    // Performance optimizations
    const shouldReduceMotion = useReducedMotion()
    const [isIntersecting, setIsIntersecting] = useState(false)

    // Track mouse position for parallax effect (throttled for performance)
    const handleMouseMove = useMemo(() => {
        if (shouldReduceMotion) return () => { }

        let timeoutId: NodeJS.Timeout
        return (e: React.MouseEvent) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                const { clientX, clientY } = e
                const { innerWidth, innerHeight } = window

                // Calculate position as percentage of container
                const x = (clientX / innerWidth - 0.5) * 20
                const y = (clientY / innerHeight - 0.5) * 20

                setMousePosition({ x, y })
            }, 16) // ~60fps throttling
        }
    }, [shouldReduceMotion])

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

    // Animate coin stacks (only if motion is enabled)
    useEffect(() => {
        if (shouldReduceMotion) return

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
    }, [coinControls, shouldReduceMotion])

    // Update parallax effect when mouse moves (only if motion is enabled)
    useEffect(() => {
        if (shouldReduceMotion) return

        const update3DEffect = () => {
            const element = document.getElementById('visualization-container')
            if (element) {
                element.style.transform = `perspective(1000px) rotateX(${mousePosition.y * 0.05}deg) rotateY(${mousePosition.x * 0.05}deg)`
            }
        }

        update3DEffect()
    }, [mousePosition, shouldReduceMotion])

    // Memoized animation variants with reduced motion support
    const animationVariants = useMemo(() => {
        const baseTransition = shouldReduceMotion ? { duration: 0.1 } : { duration: 0.6, ease: "easeOut" }

        return {
            containerVariants: {
                hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        ...baseTransition,
                        staggerChildren: shouldReduceMotion ? 0 : 0.2
                    }
                }
            },
            childVariants: {
                hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: shouldReduceMotion ? { duration: 0.1 } : { duration: 0.5 }
                }
            },
            cardVariants: {
                hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.8, y: shouldReduceMotion ? 0 : 20 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: shouldReduceMotion ? { duration: 0.1 } : {
                        duration: 0.5,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 100
                    }
                }
            },
            cardVariantsLeft: {
                hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -40 },
                visible: {
                    opacity: 1,
                    x: 0,
                    transition: shouldReduceMotion ? { duration: 0.1 } : {
                        duration: 0.6,
                        ease: "easeOut",
                        type: "spring"
                    }
                }
            },
            cardVariantsRight: {
                hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 40 },
                visible: {
                    opacity: 1,
                    x: 0,
                    transition: shouldReduceMotion ? { duration: 0.1 } : {
                        duration: 0.6,
                        ease: "easeOut",
                        type: "spring"
                    }
                }
            },
            statVariants: {
                hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.7 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: shouldReduceMotion ? { duration: 0.1 } : {
                        duration: 0.6,
                        ease: "backOut",
                        type: "spring",
                        bounce: 0.4
                    }
                }
            },
            iconVariants: {
                hidden: { opacity: 0, rotate: shouldReduceMotion ? 0 : -15, scale: shouldReduceMotion ? 1 : 0.8 },
                visible: {
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                    transition: shouldReduceMotion ? { duration: 0.1 } : {
                        duration: 0.5,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 200
                    }
                }
            },
            fadeInVariants: {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: shouldReduceMotion ? { duration: 0.1 } : { duration: 0.6 }
                }
            }
        }
    }, [shouldReduceMotion])

    const {
        containerVariants,
        childVariants,
        cardVariants,
        cardVariantsLeft,
        cardVariantsRight,
        statVariants,
        iconVariants,
        fadeInVariants
    } = animationVariants

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
                    </div>
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
            <ProblemSolutionSection
                containerVariants={containerVariants}
                childVariants={childVariants}
                cardVariantsLeft={cardVariantsLeft}
                cardVariants={cardVariants}
                cardVariantsRight={cardVariantsRight}
                iconVariants={iconVariants}
                fadeInVariants={fadeInVariants}
                TOTAL_VAULT_APY={TOTAL_VAULT_APY}
                shouldReduceMotion={shouldReduceMotion}
            />

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
                        <div className="max-w-3xl mx-auto mb-12">
                            <div className="overflow-hidden relative">
                                <ChainSelectorWithBenchmarkTable />
                            </div>
                        </div>
                    </motion.div>
                </section>
            </Container>

            {/* SECTION 4: Available on the fastest growing chains */}
            <NetworksSection
                containerVariants={containerVariants}
                childVariants={childVariants}
                cardVariantsLeft={cardVariantsLeft}
                cardVariants={cardVariants}
                cardVariantsRight={cardVariantsRight}
                iconVariants={iconVariants}
                statVariants={statVariants}
                miniAppUser={miniAppUser}
                logEvent={logEvent}
                TOTAL_VAULT_APY={TOTAL_VAULT_APY}
                shouldReduceMotion={shouldReduceMotion}
            />

            {/* FAQ Section */}
            <FAQSection
                containerVariants={containerVariants}
                childVariants={childVariants}
                cardVariants={cardVariants}
                shouldReduceMotion={shouldReduceMotion}
            />

            {/* Enhanced Call To Action Section */}
            <Container>
                <section className="py-16 relative overflow-hidden">
                    {/* Animated Background Elements - CSS only */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary/5 to-blue-400/5 rounded-full blur-xl animate-spin-slow" />
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-spin-reverse-slow" />
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="w-full max-w-5xl mx-auto relative z-10"
                    >
                        {/* Enhanced Section Header */}
                        <motion.div variants={childVariants} className="text-center mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-full mb-6"
                            >
                                <div className="w-2 h-2 bg-gradient-to-r from-primary to-blue-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-slate-700">Get Started</span>
                            </motion.div>
                            <HeadingText level="h2" weight="bold" className="mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                                Ready to Maximize Your USDC Returns?
                            </HeadingText>
                            <BodyText level="body1" weight="medium" className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                Choose your preferred network and start earning optimal yields today
                            </BodyText>
                        </motion.div>

                        {/* Enhanced Network Cards */}
                        <div className="relative">
                            {/* Additional Background Elements - CSS only */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary/5 to-blue-400/5 rounded-full blur-3xl animate-float" />
                            </div>

                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                {/* Enhanced Base Network Card */}
                                <motion.div
                                    variants={cardVariantsLeft}
                                    className="group relative hover:scale-105 transition-transform duration-300"
                                >
                                    <Link target={miniAppUser ? '_self' : '_blank'} href="/super-fund/base" className="block h-full" onClick={() => logEvent('clicked_launch_superfund_base_app', {
                                        section: 'base_network_card',
                                        title: "Ready to Maximize Your USDC Returns?"
                                    })}>
                                        <div className="relative h-full bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/40 flex flex-col justify-between">
                                            {/* Enhanced Background Decoration - CSS only */}
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-primary/10 to-blue-400/10 rounded-full blur-xl animate-spin-slow" />
                                            <div className="absolute bottom-8 -left-8 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-spin-reverse-slow" />

                                            <div className="relative z-10">
                                                {/* Enhanced Header with 3D Logo */}
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="relative w-12 h-12 group-hover:scale-110 transition-transform duration-300">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-lg group-hover:shadow-primary/25 transition-all duration-300" />
                                                        <div className="absolute inset-0.5 bg-white rounded-xl flex items-center justify-center shadow-inner">
                                                            <ImageWithDefault
                                                                src={CHAIN_DETAILS[ChainId.Base].logo}
                                                                alt="Base"
                                                                width={24}
                                                                height={24}
                                                                className="rounded-full"
                                                            />
                                                        </div>
                                                        {/* Floating particles - CSS only */}
                                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary/40 rounded-full blur-sm animate-pulse" />
                                                    </div>
                                                    <HeadingText level="h3" weight="semibold" className="text-slate-800 group-hover:text-primary transition-colors">
                                                        Base
                                                    </HeadingText>
                                                    <div className="inline-block bg-gradient-to-r from-primary/10 to-blue-500/10 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-primary/20 hover:scale-105 transition-transform duration-300">
                                                        <span className="text-xs font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                                            Up to {TOTAL_VAULT_APY}% APY
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enhanced CTA Button */}
                                            <div className="hover:scale-105 transition-transform duration-200">
                                                <Button
                                                    size="lg"
                                                    variant="secondary"
                                                    className="w-full h-12 mt-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                                >
                                                    <span className="font-medium">Launch SuperFund Base App</span>
                                                    <div className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </Button>
                                            </div>

                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </Link>
                                </motion.div>

                                {/* Enhanced Sonic Network Card */}
                                <motion.div
                                    variants={cardVariantsRight}
                                    className="group relative hover:scale-105 transition-transform duration-300"
                                >
                                    <Link target={miniAppUser ? '_self' : '_blank'} href="/waitlist" className="block h-full" onClick={() => logEvent('clicked_join_superfund_sonic_waitlist', {
                                        section: 'sonic_network_card',
                                        title: "Ready to Maximize Your USDC Returns?"
                                    })}>
                                        <div className="relative h-full bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/40 flex flex-col justify-between">
                                            {/* Enhanced Background Decoration - CSS only */}
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-spin-slow" />
                                            <div className="absolute bottom-8 -left-8 w-16 h-16 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-xl animate-spin-reverse-slow" />

                                            <div className="relative z-10">
                                                {/* Enhanced Header with 3D Logo */}
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="relative w-12 h-12 group-hover:scale-110 transition-transform duration-300">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300" />
                                                        <div className="absolute inset-0.5 bg-white rounded-xl flex items-center justify-center shadow-inner">
                                                            <ImageWithDefault
                                                                src={CHAIN_DETAILS[ChainId.Sonic].logo}
                                                                alt="Sonic"
                                                                width={24}
                                                                height={24}
                                                                className="rounded-full"
                                                            />
                                                        </div>
                                                        {/* Floating particles - CSS only */}
                                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400/40 rounded-full blur-sm animate-pulse" />
                                                    </div>
                                                    <HeadingText level="h3" weight="semibold" className="text-slate-800 group-hover:text-blue-600 transition-colors">
                                                        Sonic
                                                    </HeadingText>
                                                    <div className="inline-block bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-blue-500/20 shrink-0 hover:scale-105 transition-transform duration-300">
                                                        <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                            Coming soon
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enhanced CTA Button */}
                                            <div className="hover:scale-105 transition-transform duration-200">
                                                <Button
                                                    size="lg"
                                                    className="w-full h-12 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300"
                                                >
                                                    <span className="font-medium">Join SuperFund Sonic Waitlist</span>
                                                    <div className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                                                        <Play className="w-4 h-4 fill-current" />
                                                    </div>
                                                </Button>
                                            </div>

                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </Container>
        </div>
    )
}
