'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BodyText } from '@/components/ui/typography'
import { usePrivy } from '@privy-io/react-auth'
import { LoaderCircle } from 'lucide-react'
import { storeApprovedWallet } from '@/lib/utils'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
} from '@/components/ui/drawer'
import { X } from 'lucide-react'

interface AccessDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    onError: () => void
}

export default function AccessDialog({ open, setOpen, onError }: AccessDialogProps) {
    const [walletAddress, setWalletAddress] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [validationError, setValidationError] = useState('')
    const [apiError, setApiError] = useState('')
    const router = useRouter()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768

    const handleOpenChange = (open: boolean) => {
        // Only allow closing if not in loading state
        if (!isLoading) {
            setOpen(open)
            // Clear errors when dialog is closed
            setValidationError('')
            setApiError('')
        }
    }

    const validateWalletAddress = (address: string) => {
        // Check if it's a valid Ethereum address format
        const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
        if (!ethereumAddressRegex.test(address)) {
            setValidationError('Please enter a valid Ethereum wallet address (0x followed by 40 characters)')
            return false
        }
        setValidationError('')
        return true
    }

    const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setWalletAddress(value)
        setApiError('') // Clear API error when input changes
        if (value) {
            validateWalletAddress(value)
        } else {
            setValidationError('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateWalletAddress(walletAddress)) {
            return
        }

        setIsLoading(true)
        setApiError('') // Clear any previous API errors

        try {
            // Call the allowlist API
            const response = await fetch('/api/allowlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.code === 'MAX_LIMIT_REACHED') {
                    setApiError(data.error)
                    setIsLoading(false)
                    return
                }
                throw new Error(data.error || 'Failed to add to allowlist')
            }
            
            // Store the approved wallet address with expiration
            storeApprovedWallet(walletAddress)
            
            // If successful, redirect to super-fund page
            router.push('/super-fund')
        } catch (error: any) {
            console.error('Error:', error)
            setApiError(error.message || 'Failed to add wallet to allowlist')
            onError()
        }
    }

    // Close button component
    const closeContentButton = !isLoading ? (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // Content header component
    const contentHeader = (
        <DialogHeader>
            <DialogTitle className="text-center">Access Request</DialogTitle>
            <DialogDescription className="text-center">
                Please provide your wallet address for access verification.
            </DialogDescription>
        </DialogHeader>
    )

    // Content body component
    const contentBody = (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-3 z-50">
                    <div className="flex flex-col items-center space-y-4">
                        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                        <BodyText level="body2">Adding to allowlist...</BodyText>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <BodyText level="body2">Wallet Address</BodyText>
                <Input
                    placeholder="Enter your wallet address (0x...)"
                    value={walletAddress}
                    onChange={handleWalletAddressChange}
                    required
                    className={`rounded-3 ${validationError || apiError ? 'border-destructive' : ''}`}
                />
                {validationError && (
                    <BodyText level="body2" className="text-destructive text-sm font-medium">
                        {validationError}
                    </BodyText>
                )}
                {apiError && (
                    <BodyText level="body2" className="text-destructive text-sm font-medium">
                        {apiError}
                    </BodyText>
                )}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => handleOpenChange(false)}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading || !walletAddress || !!validationError}
                >
                    {isLoading ? 'Verifying...' : 'Verify Access'}
                </Button>
            </div>
        </form>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px] bg-white/75 backdrop-blur-sm pt-[25px]" showCloseButton={false}>
                    {closeContentButton}
                    {contentHeader}
                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={open} dismissible={false}>
            <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                {closeContentButton}
                <DrawerHeader>{contentHeader}</DrawerHeader>
                {contentBody}
            </DrawerContent>
        </Drawer>
    )
} 