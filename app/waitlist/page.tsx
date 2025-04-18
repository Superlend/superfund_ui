'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Loader2, Asterisk, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

const emailSchema = z.string().email('Please enter a valid email address')

export default function WaitlistPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        
        try {
            // Validate email
            emailSchema.parse(email)
            
            setIsLoading(true)
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to join waitlist')
            }
            
            setSuccess(true)
            setEmail('')
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

    return (
        <div className="min-h-screen -mt-24 w-full flex items-center justify-center relative overflow-hidden">
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
                className="w-full max-w-3xl z-10 px-4 py-12 pt-24 md:pt-12"
            >
                <motion.div 
                    variants={itemVariants}
                    className="mb-8"
                >
                    <HeadingText level="h1" weight="bold" className="text-center text-3xl md:text-4xl lg:text-5xl capitalize bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Join The SuperFund Waitlist
                    </HeadingText>
                </motion.div>

                <motion.div 
                    variants={itemVariants} 
                    className="mb-8 max-w-lg mx-auto backdrop-blur-sm bg-white/30 p-4 rounded-xl shadow-sm"
                >
                    <div className="flex items-start gap-1">
                        <Asterisk className="w-5 h-5 text-primary/70 flex-shrink-0" />
                        <BodyText level="body2" weight="medium" className="text-gray-700">
                            SuperFund optimally allocates your USDC across trusted lending protocols such as Aave, Morpho, Euler, & Fluid to generate consistent and competitive returns.
                        </BodyText>
                    </div>
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
                                    Thank you for joining the waitlist!
                                </BodyText>
                                <BodyText level="body2" className="text-white/90 text-center">
                                    We'll notify you when we launch.
                                </BodyText>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                onSubmit={handleSubmit}
                                className="space-y-6 backdrop-blur-sm bg-white/80 p-8 rounded-2xl shadow-lg border border-primary/20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <BodyText level="body1" weight="medium" className="text-gray-800 mb-4">
                                        Enter your email to join the waitlist
                                    </BodyText>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your.email@example.com"
                                            className="w-full pr-12 border-primary/20 focus:border-primary text-md py-6 rounded-xl shadow-md bg-white/90 backdrop-blur-sm placeholder:text-md"
                                            disabled={isLoading}
                                        />
                                        <Button 
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 rounded-lg hover:shadow-md transition-all duration-300"
                                            disabled={isLoading}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isLoading ? (
                                                    <motion.div
                                                        key="loading"
                                                        initial={{ opacity: 0, rotate: 0 }}
                                                        animate={{ opacity: 1, rotate: 360 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                    >
                                                        <Loader2 className="h-5 w-5" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="join"
                                                        className="flex items-center gap-1"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        whileHover={{ x: 3 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        Join <ArrowRight className="h-4 w-4 ml-1" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Button>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
                                            >
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <BodyText level="body3" className="text-red-700">
                                                    {error}
                                                </BodyText>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    )
} 