'use client'

import React, { useState } from 'react'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import MainContainer from '@/components/MainContainer'
import { Card, CardContent } from '@/components/ui/card'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import AccessDialog from '@/components/AccessDialog'
import Image from 'next/image'
import { Asterisk } from 'lucide-react'

export default function HomePage() {
    const [connectionError, setConnectionError] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

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

                        <motion.div className="w-full flex max-sm:flex-col items-center justify-center sm:gap-8 max-w-2xl mx-auto" variants={childVariants}>
                            {/* New Wallet Section */}
                            <div className="flex-1 space-y-2">
                                <BodyText level="body1" weight="medium" className="text-gray-600 text-center">
                                    New wallet?
                                </BodyText>
                                <div className="w-[200px] mx-auto">
                                    <Button
                                        variant="secondaryOutline"
                                        size="lg"
                                        className="w-full rounded-4"
                                        onClick={() => setDialogOpen(true)}
                                    >
                                        Request access
                                    </Button>
                                </div>
                            </div>

                            <div className="w-[1px] h-16 sm:h-12 bg-gray-500/75 max-sm:rotate-90"></div>

                            {/* Already Registered Section */}
                            <div className="flex-1 space-y-2">
                                <BodyText level="body1" weight="medium" className="text-gray-600 text-center">
                                    Already registered?
                                </BodyText>
                                <div className="w-[200px] mx-auto">
                                    <ConnectWalletButton />
                                </div>
                            </div>
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
