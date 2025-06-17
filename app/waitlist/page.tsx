'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Loader2, Asterisk, CheckCircle, XCircle, ArrowRight, Twitter, ExternalLink, Check, ArrowLeft, Info, MousePointerClick, LogOut } from 'lucide-react'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAuth } from '@/context/auth-provider'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import Link from 'next/link'
import ExternalLinkAnchor from "@/components/ExternalLink"
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
import { useActiveAccount } from "thirdweb/react"

const emailSchema = z.string().email('Please enter a valid email address')

// Stepper component for tracking progress
const Stepper = ({ currentStep, completedSteps, onStepClick }: {
    currentStep: number,
    completedSteps: number[],
    onStepClick: (step: number) => void
}) => {
    return (
        <div className="flex justify-center items-center gap-0 mb-8">
            {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${completedSteps.includes(step)
                            ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                            : currentStep === step
                                ? 'bg-primary text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                        onClick={() => {
                            if (completedSteps.includes(step) || currentStep === step) {
                                onStepClick(step);
                            }
                        }}
                    >
                        {completedSteps.includes(step) ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <span>{step}</span>
                        )}
                    </div>
                    {step < 2 && (
                        <div
                            className={`w-16 h-1 mx-1 ${completedSteps.includes(step) ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function WaitlistPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [points, setPoints] = useState(0)
    const [socialFollows, setSocialFollows] = useState<string[]>([])
    const [showTelegramSection, setShowTelegramSection] = useState(false)
    const [telegramUsername, setTelegramUsername] = useState('')
    const [isTelegramLoading, setIsTelegramLoading] = useState(false)
    const [telegramValidationError, setTelegramValidationError] = useState('')
    const [isTelegramSuccess, setIsTelegramSuccess] = useState(false)

    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()
    // const { walletAddress, isWalletConnected } = useWalletConnection()
    const account = useActiveAccount();
    const walletAddress = account?.address as `0x${string}`
    const isWalletConnected = !!account

    const { userMaxWithdrawAmount } = useUserBalance(
        walletAddress ? (walletAddress as `0x${string}`) : '0x0000000000000000000000000000000000000000'
    )

    useEffect(() => {
        if (isWalletConnected || currentStep === 2) {
            getAccessTokenFromPrivy()
        }
    }, [isWalletConnected, currentStep])

    // Add a function to check if the Telegram table exists
    useEffect(() => {
        // Only run the check when wallet is connected and portfolioValue meets threshold
        if (walletAddress && parseFloat(userMaxWithdrawAmount) >= 1000) {
            const checkTelegramTableExists = async () => {
                try {
                    // Try to get status of Telegram API
                    const checkResponse = await fetch('/api/telegram-check?wallet=0x0000000000000000000000000000000000000000', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (checkResponse.ok) {
                        // Table exists, we can show Telegram section
                        setShowTelegramSection(true);
                    } else {
                        // If the API returns an error, log it but don't show Telegram section
                        console.warn('Telegram API not available:', await checkResponse.text());
                        setShowTelegramSection(false);
                    }
                } catch (error) {
                    console.error('Error checking Telegram API availability:', error);
                    setShowTelegramSection(false);
                }
            };

            checkTelegramTableExists();
        }
    }, [walletAddress, userMaxWithdrawAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            // Validate email
            emailSchema.parse(email)

            // If this is the same as previously submitted email, just go to step 2
            if (email === submittedEmail) {
                setCurrentStep(2)
                setIsLoading(false)
                return
            }

            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            // Handle duplicate email case - if it's a 409 status
            if (response.status === 409) {
                // If the email exists but doesn't have a wallet address, we can still proceed
                if (!data.has_wallet) {
                    // Save the email for next steps
                    setSubmittedEmail(email)

                    // Mark step 1 as completed
                    if (!completedSteps.includes(1)) {
                        setCompletedSteps(prev => [...prev, 1])
                        setPoints(prev => prev + 10) // Add points for email submission
                    }

                    // Move to step 2
                    setCurrentStep(2)
                    return
                } else {
                    // If email already exists AND has a wallet address, show error
                    throw new Error('This email has already completed registration')
                }
            }

            if (!response.ok) {
                throw new Error(data.message || 'Failed to join waitlist')
            }

            // Save the email that was submitted
            setSubmittedEmail(email)

            // Mark step 1 as completed and advance to step 2
            if (!completedSteps.includes(1)) {
                setCompletedSteps(prev => [...prev, 1])
            }

            // Move to step 2
            setCurrentStep(2)
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message)
            } else if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unexpected error occurred')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleWalletConnected = async () => {
        // Only proceed if wallet is connected
        if (!walletAddress) {
            setError("Please connect your wallet first")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Submit the wallet address to the API if we have an email
            if (submittedEmail) {
                const response = await fetch('/api/waitlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: submittedEmail,
                        wallet_address: walletAddress
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to update wallet address')
                }
            }

            // Mark step 2 as completed and show success
            if (!completedSteps.includes(2)) {
                setCompletedSteps(prev => [...prev, 2])
                setPoints(prev => prev + 50) // Add 50 points for wallet connection
                logUserEvent({
                    user_address: walletAddress,
                    event_type: "USER_WAITLIST",
                    platform_type: 'superlend_vault',
                    protocol_identifier: '0x',
                    event_data: '',
                    authToken: accessToken || '',
                })
            }

            // Show success screen - the Telegram section visibility is handled by the useEffect
            setSuccess(true)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unexpected error occurred')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialFollow = (platform: string) => {
        // Only track which platforms are followed without awarding points
        if (!socialFollows.includes(platform)) {
            setSocialFollows(prev => [...prev, platform])
            // No points awarded for social follows
        }

        // Add step 3 to completed steps if any social platform is followed and not already completed
        if (!completedSteps.includes(3)) {
            setCompletedSteps(prev => [...prev, 3])
        }

        // If both platforms are followed, set success state
        if (
            (platform === 'twitter' && socialFollows.includes('discord')) ||
            (platform === 'discord' && socialFollows.includes('twitter'))
        ) {
            setSuccess(true)
        }
    }

    // Main content animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.25
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        }
    }

    const successVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20
            }
        }
    }

    // Decorative background image animations
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

    // Add function to validate Telegram username
    const validateTelegramUsername = (username: string) => {
        // Telegram usernames must be 5-32 characters and only contain a-z, 0-9 and underscores
        const telegramUsernameRegex = /^[a-zA-Z0-9_]{5,32}$/
        if (!telegramUsernameRegex.test(username)) {
            setTelegramValidationError('Please enter a valid Telegram username (5-32 characters, only letters, numbers, and underscores)')
            return false
        }
        setTelegramValidationError('')
        return true
    }

    // Add function to handle Telegram username submission
    const handleTelegramSubmit = async () => {
        if (!validateTelegramUsername(telegramUsername)) {
            return
        }

        setIsTelegramLoading(true)
        try {
            // Log submission details for debugging
            console.log('Submitting Telegram username:', {
                wallet: walletAddress,
                telegram: telegramUsername,
                portfolioValue: parseFloat(userMaxWithdrawAmount)
            });

            const checkResponse = await fetch('/api/telegram-check?wallet=' + walletAddress, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // If the check fails, it might be because the table doesn't exist
            if (!checkResponse.ok) {
                const errorText = await checkResponse.text();
                console.warn('Telegram API check failed:', errorText);
                throw new Error('Telegram service is not available: ' + errorText);
            }

            // Proceed with the submission if the check passes
            const response = await fetch('/api/telegram-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallet: walletAddress,
                    telegram: telegramUsername,
                    portfolioValue: parseFloat(userMaxWithdrawAmount)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(e => ({
                    message: `Failed to parse error response: ${response.status} ${response.statusText}`
                }));
                console.error('Telegram API submission error:', errorData);
                throw new Error(errorData.message || `Failed to submit Telegram username: ${response.status} ${response.statusText}`);
            }

            setIsTelegramSuccess(true)

            // Hide Telegram section after a delay
            setTimeout(() => {
                setShowTelegramSection(false)
            }, 3000)
        } catch (error) {
            console.error('Error submitting Telegram username:', error)
            setTelegramValidationError(`Failed to submit Telegram username: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsTelegramLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
            <div className="flex justify-center pt-8 pb-4">
                <div className="relative">
                    <Link href="https://www.superlend.xyz/" target="_blank" className="inline-block">
                        <img
                            src="/images/logos/superlend-logo.webp"
                            alt="Superlend logo"
                            className="object-contain h-auto w-40"
                        />
                    </Link>
                    {/* <Badge
                                variant="blue"
                                className="absolute top-1 -right-12 w-fit rounded-full px-2 py-0"
                            >
                                Beta
                            </Badge> */}
                </div>
            </div>
            <div className="min-h-[60vh] w-full flex items-center justify-center relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-visible">
                    {/* Main Decorative Background Images */}
                    <motion.div
                        variants={imageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute left-[5%] top-[20%] md:top-[10%] w-28 md:w-40 h-28 md:h-40 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-letter.png"
                            alt=""
                            width={160}
                            height={160}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={imageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute right-[10%] top-[25%] md:top-[15%] w-24 md:w-32 h-24 md:h-32 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-blue-circle.png"
                            alt=""
                            width={128}
                            height={128}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={imageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute bottom-[15%] right-[8%] w-28 md:w-36 h-28 md:h-36 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-orange-circle.png"
                            alt=""
                            width={144}
                            height={144}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>

                    {/* Small Decorative Elements - Hide some on mobile */}
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute hidden md:block left-[25%] top-[30%] w-8 h-8 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-letter.png"
                            alt=""
                            width={32}
                            height={32}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute right-[30%] bottom-[25%] w-7 h-7 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-blue-circle.png"
                            alt=""
                            width={28}
                            height={28}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute hidden md:block left-[35%] bottom-[30%] w-8 h-8 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-orange-circle.png"
                            alt=""
                            width={32}
                            height={32}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute right-[25%] top-[35%] md:top-[20%] w-6 h-6 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-letter.png"
                            alt=""
                            width={24}
                            height={24}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute hidden md:block left-[65%] top-[40%] w-5 h-5 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-blue-circle.png"
                            alt=""
                            width={20}
                            height={20}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute left-[15%] top-[65%] md:top-[55%] w-7 md:w-9 h-7 md:h-9 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-letter.png"
                            alt=""
                            width={36}
                            height={36}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        variants={smallImageVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute right-[15%] top-[70%] md:top-[60%] w-5 md:w-7 h-5 md:h-7 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-orange-circle.png"
                            alt=""
                            width={28}
                            height={28}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                </div>

                {/* Main content */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="w-full max-w-3xl z-10 px-4 py-12 pt-5 md:pt-12"
                >
                    <motion.div
                        variants={itemVariants}
                        className="mb-8"
                    >
                        <HeadingText level="h1" weight="bold" className="text-center text-3xl md:text-4xl lg:text-5xl capitalize bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Join SuperFund Sonic Waitlist
                        </HeadingText>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="mb-8 max-w-2xl mx-auto backdrop-blur-sm bg-white/30 p-4 rounded-xl shadow-sm"
                    >
                        <div className="flex items-start gap-1">
                            <Asterisk className="w-5 h-5 text-primary/70 flex-shrink-0" />
                            <BodyText level="body1" weight="medium" className="text-gray-700">
                                SuperFund intelligently allocates your USDC across leading protocols such as Aave, Silo, and Euler.
                                It continuously monitors rates and reallocates funds to ensure you earn the highest available APY at all times.
                            </BodyText>
                        </div>
                    </motion.div>

                    {/* Points Display */}
                    {/* <motion.div
                    variants={itemVariants}
                    className="mb-4 flex justify-center"
                >
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                        <BodyText level="body2" weight="medium" className="text-primary">
                            Your Points: {points}
                        </BodyText>
                        <InfoTooltip
                            label={
                                <Info
                                    width={16}
                                    height={16}
                                    // weight="1.5"
                                    className="stroke-primary"
                                />
                            }
                            content={
                                <BodyText level="body3" weight="normal" className="text-gray-800">
                                    Points accumulated are updated every Sunday on Superlend during the week.
                                    <ExternalLinkAnchor
                                        className="gap-0"
                                        iconSize={14}
                                        href="https://app.superlend.xyz/points"
                                    >
                                        Know more
                                    </ExternalLinkAnchor>
                                </BodyText>
                            }
                        />
                    </div>
                </motion.div> */}

                    {/* Stepper UI */}
                    <motion.div variants={itemVariants}>
                        <Stepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={(step) => setCurrentStep(step)} />
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="w-full max-w-md mx-auto"
                    >
                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div
                                    key="success"
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, y: -20 }}
                                    variants={successVariants}
                                    className="p-8 bg-gradient-to-r from-green-500/90 to-teal-500/90 backdrop-blur-sm rounded-2xl shadow-lg text-white flex flex-col items-center space-y-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 20,
                                            delay: 0.2
                                        }}
                                    >
                                        <CheckCircle className="h-16 w-16 text-white" />
                                    </motion.div>
                                    <BodyText level="body1" weight="medium" className="text-white text-center">
                                        Thank you for completing registration!
                                    </BodyText>
                                    <BodyText level="body2" className="text-white/90 text-center">
                                        You&apos;ve earned {points} points. We&apos;ll notify you when we launch.
                                    </BodyText>

                                    {/* Conditional Telegram section for high-value portfolios */}
                                    {showTelegramSection && (
                                        <div className="w-full mt-4 pt-4 border-t border-white/20">
                                            <div className="bg-blue-500/30 p-4 rounded-3 flex items-center gap-4 mb-4">
                                                <div className="bg-blue-500/40 p-2 rounded-3">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 8H6.01M6 16H6.01M6 12H18M6 12C5.20435 12 4.44129 11.6839 3.87868 11.1213C3.31607 10.5587 3 9.79565 3 9C3 8.20435 3.31607 7.44129 3.87868 6.87868C4.44129 6.31607 5.20435 6 6 6C6.79565 6 7.55871 6.31607 8.12132 6.87868C8.68393 7.44129 9 8.20435 9 9C9 9.79565 8.68393 10.5587 8.12132 11.1213C7.55871 11.6839 6.79565 12 6 12ZM6 12C5.20435 12 4.44129 12.3161 3.87868 12.8787C3.31607 13.4413 3 14.2044 3 15C3 15.7956 3.31607 16.5587 3.87868 17.1213C4.44129 17.6839 5.20435 18 6 18C6.79565 18 7.55871 17.6839 8.12132 17.1213C8.68393 16.5587 9 15.7956 9 15C9 14.2044 8.68393 13.4413 8.12132 12.8787C7.55871 12.3161 6.79565 12 6 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <BodyText level="body2" className="text-white">
                                                    Your portfolio of
                                                    <a href={`https://app.superlend.xyz/portfolio`} target="_blank" rel="noopener noreferrer" className="font-semibold mx-1 border-b border-white hover:text-white/80 hover:border-white/80">
                                                        ${
                                                            isNaN(parseFloat(userMaxWithdrawAmount))
                                                                ? '0.00'
                                                                : parseFloat(userMaxWithdrawAmount).toFixed(2)
                                                        }
                                                    </a>
                                                    qualifies you for personalized support from our team.
                                                </BodyText>
                                            </div>

                                            {/* Telegram submission form - show when not in success state */}
                                            {!isTelegramSuccess && (
                                                <>
                                                    <BodyText level="body2" weight="medium" className="text-white text-center mb-2">
                                                        Enter your Telegram username to get early updates:
                                                    </BodyText>

                                                    <div className="flex flex-col gap-2 mb-4">
                                                        <Input
                                                            placeholder="Enter your Telegram username"
                                                            value={telegramUsername}
                                                            onChange={(e) => setTelegramUsername(e.target.value)}
                                                            className={`h-12 rounded-md ${telegramValidationError ? 'border-red-300' : 'border-white/30'} 
                                                                bg-white/10 text-white placeholder:text-white/60`}
                                                            disabled={isTelegramLoading}
                                                        />
                                                        {telegramValidationError && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="p-2 bg-red-500/30 border border-red-500/30 rounded-md"
                                                            >
                                                                <BodyText level="body3" className="text-red-100 flex items-center">
                                                                    <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                                                    {telegramValidationError}
                                                                </BodyText>
                                                            </motion.div>
                                                        )}
                                                        <BodyText level="body3" className="text-white/70">
                                                            Your information will only be used for product improvement purposes.
                                                        </BodyText>
                                                    </div>

                                                    <Button
                                                        variant="default"
                                                        className="w-full h-12 bg-white hover:bg-white/80 text-teal-700 rounded-md flex items-center justify-center gap-2"
                                                        onClick={handleTelegramSubmit}
                                                        disabled={isTelegramLoading || !telegramUsername}
                                                    >
                                                        {isTelegramLoading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                SUBMIT
                                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M4.16663 10H15.8333M15.8333 10L9.99996 4.16669M15.8333 10L9.99996 15.8334" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </>
                                                        )}
                                                    </Button>
                                                </>
                                            )}

                                            {/* Success message after Telegram submission */}
                                            {isTelegramSuccess && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 30
                                                    }}
                                                    className="bg-green-500/30 p-5 rounded-3 border border-green-500/40 mb-4"
                                                >
                                                    <div className="flex items-center justify-center gap-3 mb-3">
                                                        <div className="bg-green-500 rounded-full p-1">
                                                            <Check className="h-6 w-6 text-white" />
                                                        </div>
                                                        <BodyText level="body1" weight="medium" className="text-white">
                                                            Telegram Username Submitted!
                                                        </BodyText>
                                                    </div>
                                                    <BodyText level="body2" className="text-white text-center">
                                                        Thank you! Our product manager will be in touch with you soon
                                                        through Telegram to provide personalized support.
                                                    </BodyText>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    <div className="w-full mt-4 pt-4 border-t border-white/20">
                                        <BodyText level="body2" weight="medium" className="text-white text-center mb-4">
                                            To stay updated on the launch:
                                        </BodyText>

                                        <div className="flex flex-col sm:flex-row sm:justify-center gap-4 w-full mb-2">
                                            <Link href="https://x.com/SuperlendHQ" target="_blank" className="flex-1">
                                                <Button
                                                    variant="outline"
                                                    className={`flex items-center justify-center gap-2 w-full bg-white/20 border-white/40 hover:bg-white/30 text-white`}
                                                    onClick={() => handleSocialFollow('twitter')}
                                                >
                                                    <Twitter className="h-5 w-5" />
                                                    {socialFollows.includes('twitter') ? (
                                                        <span className="flex items-center">
                                                            Following <Check className="h-4 w-4 ml-1" />
                                                        </span>
                                                    ) : 'Follow on X'}
                                                    <ExternalLink className="h-4 w-4 ml-1" />
                                                </Button>
                                            </Link>

                                            <Link href="https://discord.com/invite/superlend" target="_blank" className="flex-1">
                                                <Button
                                                    variant="outline"
                                                    className={`flex items-center justify-center gap-2 w-full bg-white/20 border-white/40 hover:bg-white/30 text-white`}
                                                    onClick={() => handleSocialFollow('discord')}
                                                >
                                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.127 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                                    </svg>
                                                    {socialFollows.includes('discord') ? (
                                                        <span className="flex items-center">
                                                            Joined <Check className="h-4 w-4 ml-1" />
                                                        </span>
                                                    ) : 'Join Discord'}
                                                    <ExternalLink className="h-4 w-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="steps"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6 backdrop-blur-sm bg-white/40 p-8 rounded-2xl shadow-lg"
                                    whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AnimatePresence mode="wait">
                                        {currentStep === 1 && (
                                            <motion.form
                                                key="step1"
                                                onSubmit={handleSubmit}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <BodyText level="body1" weight="medium" className="text-gray-800 mb-4">
                                                    Step 1: Enter your email to join the waitlist
                                                </BodyText>
                                                <div className="relative">
                                                    <Input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="your.email@example.com"
                                                        className="w-full pr-12 border border-primary/40 focus:border-primary text-md py-6 rounded-xl shadow-md bg-white/90 backdrop-blur-sm placeholder:text-md"
                                                        disabled={isLoading}
                                                    />
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        size="lg"
                                                        className="hidden md:block absolute right-1 top-1/2 transform -translate-y-1/2 h-10 rounded-3 hover:shadow-md transition-all duration-300"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                Continue <ArrowRight className="h-4 w-4 ml-1" />
                                                            </div>
                                                        )}
                                                    </Button>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    size="lg"
                                                    className="md:hidden h-10 w-full rounded-3 hover:shadow-md transition-all duration-300 mt-4"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            Continue <ArrowRight className="h-4 w-4 ml-1" />
                                                        </div>
                                                    )}
                                                </Button>

                                                {/* <BodyText level="body3" className="mt-2 text-primary">
                                                +10 points
                                            </BodyText> */}

                                                {/* Add navigation buttons if this is an edit of previously submitted email */}
                                                {submittedEmail && (
                                                    <div className="flex justify-end mt-4">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setCurrentStep(2)}
                                                            className="flex items-center"
                                                        >
                                                            Skip to next step <ArrowRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                )}

                                                <AnimatePresence>
                                                    {error && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-3 flex items-center space-x-2"
                                                        >
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                            <BodyText level="body3" className="text-red-700">
                                                                {error}
                                                            </BodyText>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.form>
                                        )}

                                        {currentStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex flex-col items-center"
                                            >
                                                <BodyText level="body1" weight="medium" className="text-gray-800 mb-1 text-center">
                                                    Step 2: Earn Superlend Points
                                                </BodyText>
                                                <BodyText level="body2" weight="normal" className="text-gray-800 mb-6 text-center">
                                                    Connect your wallet and earn 50 superlend points for joining the waitlist.
                                                    <ExternalLinkAnchor
                                                        className="pl-1 gap-0"
                                                        iconSize={14}
                                                        href="https://app.superlend.xyz/points"
                                                    >
                                                        Know more
                                                    </ExternalLinkAnchor>
                                                </BodyText>

                                                <div className={`relative w-full md:w-[200px] mb-2 ${isWalletConnected ? 'ring-1 ring-green-500 rounded-4' : ''}`}>
                                                    <ConnectWalletButton />
                                                </div>

                                                <BodyText level="body3" weight="medium" className={`flex items-center gap-1 ${isWalletConnected ? 'text-green-600' : 'text-primary'} mb-4`}>
                                                    {isWalletConnected && <Check className="h-4 w-4 text-green-500" />}
                                                    {isWalletConnected ? 'Wallet Connected' : '+50 points'}
                                                </BodyText>

                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="w-full mt-3 p-3 bg-red-50 border border-red-200 rounded-3 flex items-center space-x-2"
                                                    >
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                        <BodyText level="body3" className="text-red-700">
                                                            {error}
                                                        </BodyText>
                                                    </motion.div>
                                                )}

                                                <div className="flex justify-between w-full mt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setCurrentStep(1)}
                                                        className="flex items-center"
                                                    >
                                                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                                                    </Button>

                                                    <Button
                                                        variant="primary"
                                                        onClick={handleWalletConnected}
                                                        disabled={isLoading || !walletAddress}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                Join Waitlist <ArrowRight className="h-4 w-4 ml-1" />
                                                            </div>
                                                        )}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
} 