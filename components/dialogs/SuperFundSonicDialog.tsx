'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { LoaderCircle, X } from 'lucide-react'
import useDimensions from '@/hooks/useDimensions'
import { submitTelegramUsername, checkTelegramExists } from '@/services/telegram-service'

interface SuperFundSonicDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    walletAddress: `0x${string}`
    portfolioValue: string
}

export default function SuperFundSonicDialog({
    open,
    setOpen,
    walletAddress,
    portfolioValue
}: SuperFundSonicDialogProps) {
    return null;
    
    const [telegramUsername, setTelegramUsername] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [validationError, setValidationError] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    // Check if the user has already submitted a Telegram username
    useEffect(() => {
        if (open && walletAddress) {
            checkExistingTelegramUsername()
        }
    }, [open, walletAddress])

    const checkExistingTelegramUsername = async () => {
        try {
            const exists = await checkTelegramExists(walletAddress)
            if (exists) {
                // Close the dialog if they've already submitted
                setOpen(false)
            }
        } catch (error) {
            console.error('Error checking existing Telegram username:', error)
        }
    }

    const handleOpenChange = (open: boolean) => {
        // Only allow closing if not in loading state
        if (!isLoading) {
            setOpen(open)
            // Clear states when dialog is closed
            setValidationError('')
            setIsSuccess(false)
        }
    }

    const validateTelegramUsername = (username: string) => {
        // Telegram usernames must be 5-32 characters and only contain a-z, 0-9 and underscores
        const telegramUsernameRegex = /^[a-zA-Z0-9_]{5,32}$/
        if (!telegramUsernameRegex.test(username)) {
            setValidationError('Please enter a valid Telegram username (5-32 characters, only letters, numbers, and underscores)')
            return false
        }
        setValidationError('')
        return true
    }

    const handleSubmit = async () => {
        if (!validateTelegramUsername(telegramUsername)) {
            return
        }

        setIsLoading(true)
        try {
            await submitTelegramUsername(walletAddress, telegramUsername)
            setIsSuccess(true)

            // Close the dialog after a short delay
            setTimeout(() => {
                setOpen(false)
                setIsSuccess(false)
                setTelegramUsername('')
            }, 2000)
        } catch (error) {
            console.error('Error submitting Telegram username:', error)
            setValidationError('Failed to submit Telegram username. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Dialog content
    const dialogContent = (
        <>
            <div className="flex flex-col gap-6 px-4">
                <div className="flex flex-col items-center text-center gap-2">
                    <HeadingText level="h5" weight="medium">
                        We need your inputs!
                    </HeadingText>
                    <BodyText level="body1" className="text-gray-600">
                        Hope you&apos;ve been enjoying Superfund. Our product manager
                        would like to have a chat with you and ask you a few
                        questions to understand how best we can add value to you.
                        This will help us build the best DeFi products for you.
                    </BodyText>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8H6.01M6 16H6.01M6 12H18M6 12C5.20435 12 4.44129 11.6839 3.87868 11.1213C3.31607 10.5587 3 9.79565 3 9C3 8.20435 3.31607 7.44129 3.87868 6.87868C4.44129 6.31607 5.20435 6 6 6C6.79565 6 7.55871 6.31607 8.12132 6.87868C8.68393 7.44129 9 8.20435 9 9C9 9.79565 8.68393 10.5587 8.12132 11.1213C7.55871 11.6839 6.79565 12 6 12ZM6 12C5.20435 12 4.44129 12.3161 3.87868 12.8787C3.31607 13.4413 3 14.2044 3 15C3 15.7956 3.31607 16.5587 3.87868 17.1213C4.44129 17.6839 5.20435 18 6 18C6.79565 18 7.55871 17.6839 8.12132 17.1213C8.68393 16.5587 9 15.7956 9 15C9 14.2044 8.68393 13.4413 8.12132 12.8787C7.55871 12.3161 6.79565 12 6 12Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <BodyText level="body2" className="text-blue-600">
                        Your portfolio of <span className="font-semibold">${isNaN(parseFloat(portfolioValue)) ? '0.00' : parseFloat(portfolioValue).toFixed(2)}</span> qualifies you for
                        personalized support from our team.
                    </BodyText>
                </div>

                <div className="flex flex-col gap-2 mb-2">
                    <BodyText level="body2" weight="medium" className="text-gray-700">
                        Your Telegram Username <span className="text-gray-400 ml-1">ⓘ</span>
                    </BodyText>
                    <Input
                        placeholder="Enter your Telegram username"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        className={`h-12 rounded-md ${validationError ? 'border-red-500' : ''}`}
                        disabled={isLoading || isSuccess}
                    />
                    {validationError && (
                        <BodyText level="body3" className="text-red-500">
                            {validationError}
                        </BodyText>
                    )}
                    <BodyText level="body3" className="text-gray-500">
                        Your information will only be used for product improvement purposes.
                    </BodyText>
                </div>

                <Button
                    variant="primary"
                    className="w-full h-12 flex items-center justify-center gap-2"
                    onClick={handleSubmit}
                    disabled={isLoading || isSuccess || !telegramUsername}
                >
                    {isLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : isSuccess ? (
                        'Connected!'
                    ) : (
                        <>
                            CONNECT
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.16663 10H15.8333M15.8333 10L9.99996 4.16669M15.8333 10L9.99996 15.8334" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </>
                    )}
                </Button>
            </div>
        </>
    )

    // Desktop dialog
    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md" showCloseButton={false}>
                    <DialogHeader className="pt-2">
                        {/* <DrawerTitle className="text-center">
                            <HeadingText level="h5" weight="medium">
                                We need your inputs!
                            </HeadingText>
                        </DrawerTitle> */}
                        <DrawerDescription className="text-center">
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground h-6 w-6 p-0"
                                disabled={isLoading}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </DrawerDescription>
                    </DialogHeader>
                    {dialogContent}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile drawer
    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent>
                <DrawerHeader className="relative">
                    {/* <DrawerTitle className="text-center">
                        <HeadingText level="h5" weight="medium">
                            We need your inputs!
                        </HeadingText>
                    </DrawerTitle> */}
                    <DrawerDescription className="text-center">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground h-6 w-6 p-0"
                            disabled={isLoading}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DrawerDescription>
                </DrawerHeader>
                {dialogContent}
            </DrawerContent>
        </Drawer>
    )
} 