'use client'

import React, { useState } from 'react'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import MainContainer from '@/components/MainContainer'
import { Card, CardContent } from '@/components/ui/card'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AccessDialog from '@/components/AccessDialog'
import Image from 'next/image'
import { Asterisk } from 'lucide-react'
import { LoaderCircle } from 'lucide-react'

export default function HomePage() {
    const { ready, authenticated } = usePrivy()
    const router = useRouter()
    const [connectionError, setConnectionError] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)
    const [accessStatus, setAccessStatus] = useState<'checking' | 'verified' | 'denied'>('checking')

    // Handle initial access check and authentication
    React.useEffect(() => {
        const checkAccess = async () => {
            setIsCheckingAccess(true)
            setAccessStatus('checking')

            const approvedWallet = localStorage.getItem('approvedWalletAddress')
            if (!approvedWallet) {
                setIsCheckingAccess(false)
                setAccessStatus('denied')
                return
            }

            // If we have an approved wallet but not authenticated, keep checking
            if (!authenticated) {
                setIsCheckingAccess(false)
                // Redirect to super-fund page since we have an approved wallet
                router.push('/super-fund')
                return
            }

            try {
                const response = await fetch('/api/allowlist/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ walletAddress: approvedWallet }),
                })

                const data = await response.json()
                
                if (data.hasAccess) {
                    setAccessStatus('verified')
                    // Wait for 1.5 seconds to show the success message
                    setTimeout(() => {
                        router.push('/super-fund')
                    }, 1500)
                } else {
                    // If API says no access, clear localStorage and show invite
                    localStorage.removeItem('approvedWalletAddress')
                    setAccessStatus('denied')
                }
            } catch (error) {
                console.error('Error checking access:', error)
                setAccessStatus('denied')
            } finally {
                setIsCheckingAccess(false)
            }
        }

        // Always check access when component mounts and ready
        if (ready) {
            checkAccess()
        }
    }, [ready, authenticated, router])

    const handleError = () => {
        setConnectionError(true)
        setTimeout(() => {
            setConnectionError(false)
        }, 3000)
    }

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

    return (
        <MainContainer className="flex items-center justify-center min-h-[calc(100vh-200px)] my-0">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full"
            >
                <Card className="max-w-3xl w-full mx-auto bg-white/75 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                    {/* Main Decorative Background Images */}
                    <motion.div
                        variants={imageVariants}
                        className="absolute -left-10 -top-10 w-40 h-40 pointer-events-none"
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
                        className="absolute -right-8 -top-8 w-32 h-32 pointer-events-none"
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
                        className="absolute -bottom-12 right-8 w-36 h-36 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-orange-circle.png"
                            alt=""
                            width={144}
                            height={144}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>

                    {/* Small Decorative Elements */}
                    <motion.div
                        variants={smallImageVariants}
                        className="absolute left-1/4 top-8 w-8 h-8 pointer-events-none"
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
                        className="absolute right-1/4 bottom-12 w-7 h-7 pointer-events-none"
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
                        className="absolute left-1/3 bottom-16 w-8 h-8 pointer-events-none"
                    >
                        <Image
                            src="/images/logos/superlend-orange-circle.png"
                            alt=""
                            width={32}
                            height={32}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>

                    <CardContent className="p-8 space-y-8 relative z-10">
                        {isCheckingAccess || accessStatus === 'verified' ? (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <div className="w-12 h-12">
                                    <LoaderCircle className="w-full h-full text-primary animate-spin" />
                                </div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <HeadingText level="h2" className="text-center">
                                        {accessStatus === 'verified' 
                                            ? 'Access verified! Redirecting to SuperFund...'
                                            : 'Checking access status...'}
                                    </HeadingText>
                                </motion.div>
                            </div>
                        ) : (
                            <>
                                <motion.div variants={childVariants}>
                                    <HeadingText level="h1" weight="bold" className="text-center capitalize">
                                        SuperFund exclusive beta access
                                    </HeadingText>
                                </motion.div>

                                <motion.div className="space-y-4 max-w-lg mx-auto" variants={childVariants}>
                                    <div className="flex items-start justify-start">
                                        <Asterisk className="w-12 h-6 text-primary" />
                                        <BodyText level="body1" weight="medium" className="text-gray-800 text-center">
                                            SuperFund optimally allocates your USDC across trusted lending protocols such as Aave, Morpho, Euler, & Fluid to generate consistent and competitive returns.
                                        </BodyText>
                                    </div>
                                </motion.div>

                                <motion.div className="space-y-4 max-w-xs mx-auto" variants={childVariants}>
                                    <BodyText level="body1" className="text-gray-800 text-center">
                                        This beta is exclusive invite-only. Drop your wallet address for exclusive access!
                                    </BodyText>
                                </motion.div>

                                <motion.div
                                    className="max-w-xs mx-auto"
                                    variants={childVariants}
                                >
                                    <AnimatePresence mode="wait">
                                        {connectionError ? (
                                            <motion.div
                                                key="error"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="bg-destructive-background text-destructive-foreground p-4 rounded-lg text-center mb-4"
                                            >
                                                <BodyText level="body2">
                                                    Access denied. Please try with a different wallet.
                                                </BodyText>
                                            </motion.div>
                                        ) : null}
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                className="w-full"
                                                onClick={() => setDialogOpen(true)}
                                            >
                                                Share wallet address
                                            </Button>
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
            <AccessDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                onError={handleError}
            />
        </MainContainer>
    )
}
