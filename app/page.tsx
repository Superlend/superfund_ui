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

export default function HomePage() {
    const { ready, authenticated } = usePrivy()
    const router = useRouter()
    const [connectionError, setConnectionError] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Handle successful authentication
    React.useEffect(() => {
        if (ready && authenticated) {
            const timer = setTimeout(() => {
                router.push('/super-fund')
            }, 1000)
            return () => clearTimeout(timer)
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

    return (
        <MainContainer className="flex items-center justify-center min-h-[calc(100vh-200px)] my-0">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full"
            >
                <Card className="max-w-3xl w-full mx-auto bg-white/75 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-8 space-y-8">
                        <motion.div variants={childVariants}>
                            <HeadingText level="h1" weight="bold" className="text-center">
                                Exclusive Beta Access
                            </HeadingText>
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
                                {authenticated ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="bg-success-background text-success-foreground p-4 rounded-lg text-center"
                                    >
                                        <BodyText level="body2">
                                            Successfully connected! Redirecting...
                                        </BodyText>
                                    </motion.div>
                                ) : connectionError ? (
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
