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
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BodyText } from '@/components/ui/typography'
import { usePrivy } from '@privy-io/react-auth'
import { LoaderCircle, X, Wallet, Check } from 'lucide-react'
import { storeApprovedWallet } from '@/lib/utils'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
} from '@/components/ui/drawer'

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
    const [isSuccess, setIsSuccess] = useState(false)
    const [isError, setIsError] = useState(false)
    const [isWarning, setIsWarning] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [warningMessage, setWarningMessage] = useState('')
    const router = useRouter()
    const pathname = usePathname()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isOnSuperFundPage = pathname === '/super-fund'

    const handleOpenChange = (open: boolean) => {
        // Only allow closing if not in loading state
        if (!isLoading) {
            setOpen(open)
            // Clear all states when dialog is closed
            setValidationError('')
            setApiError('')
            setIsSuccess(false)
            setIsError(false)
            setIsWarning(false)
            setErrorMessage('')
            setWarningMessage('')
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

    const checkIfWalletIsWhitelisted = async (address: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/allowlist/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress: address }),
            })

            const data = await response.json()
            return data.hasAccess
        } catch (error) {
            console.error('Error checking wallet status:', error)
            return false
        }
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
        setIsError(false) // Reset error state
        setIsWarning(false) // Reset warning state

        try {
            // Check if wallet is already whitelisted when on super-fund page
            if (isOnSuperFundPage) {
                const isWhitelisted = await checkIfWalletIsWhitelisted(walletAddress)
                if (isWhitelisted) {
                    setIsWarning(true)
                    setWarningMessage('This wallet address is already whitelisted. You can close this dialog or try a different address.')
                    setIsLoading(false)
                    return
                }
            }

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
                    setIsError(true)
                    setErrorMessage(data.error)
                    setIsLoading(false)
                    return
                }
                throw new Error(data.error || 'Failed to add to allowlist')
            }

            // Store the approved wallet address with expiration
            storeApprovedWallet(walletAddress)

            // Show success state
            setIsLoading(false)
            setIsSuccess(true)

            // Redirect after a short delay if not on super-fund page
            if (!isOnSuperFundPage) {
                setTimeout(() => {
                    router.push('/super-fund')
                }, 2000)
            }
        } catch (error: any) {
            console.error('Error:', error)
            setIsError(true)
            setErrorMessage(error.message || 'Failed to add wallet to allowlist')
            setIsLoading(false)
            onError()
        }
    }

    // Error content component
    const errorContent = (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4 py-8"
        >
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </div>
            <DialogTitle className="text-center">Error</DialogTitle>
            <DialogDescription className="text-center text-red-600">
                {errorMessage}
            </DialogDescription>
            <div className="w-full max-w-md bg-red-50/50 border border-red-200 rounded-lg p-3 font-mono text-sm break-all flex items-center gap-2">
                <Wallet className="w-4 h-4 text-red-500 shrink-0" />
                {walletAddress}
            </div>
            <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                    setIsError(false)
                    setErrorMessage('')
                }}
            >
                Try Again
            </Button>
        </motion.div>
    )

    // Warning content component
    const warningContent = (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4"
        >
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <svg
                    className="w-8 h-8 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <DialogTitle className="text-center text-orange-700">Already Whitelisted</DialogTitle>
            <DialogDescription className="text-center text-orange-600">
                {warningMessage}
            </DialogDescription>
            <div className="w-full max-w-md bg-orange-50/50 border border-orange-200 rounded-lg p-3 font-mono text-sm break-all flex items-center gap-2">
                <Wallet className="w-4 h-4 text-orange-500 shrink-0" />
                {walletAddress}
            </div>
            <div className="flex gap-2 w-full">
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleOpenChange(false)}
                    className="w-full flex-1"
                >
                    Close
                </Button>
                <Button
                    variant="secondaryOutline"
                    size="lg"
                    onClick={() => {
                        setWalletAddress('')
                        setIsWarning(false)
                        setWarningMessage('')
                    }}
                    className="w-full flex-1"
                >
                    Try Different Address
                </Button>
            </div>
        </motion.div>
    )

    // Success content component
    const successContent = (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4 py-8"
        >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            </div>
            <DialogTitle className="text-center">Success!</DialogTitle>
            <DialogDescription className="text-center">
                Your wallet has been successfully added to the allowlist.
                {!isOnSuperFundPage && " Redirecting..."}
            </DialogDescription>
            <div className="w-full max-w-md bg-green-50/50 border border-green-200 rounded-lg p-3 font-mono text-sm break-all flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-500 shrink-0" />
                {walletAddress}
            </div>
        </motion.div>
    )

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
    const contentHeader = !isSuccess && !isError && !isWarning ? (
        <DialogHeader>
            <DialogTitle className="text-center">Access Request</DialogTitle>
            <DialogDescription className="text-center">
                Please provide your wallet address for access verification.
            </DialogDescription>
        </DialogHeader>
    ) : null

    // Content body component
    const contentBody = isSuccess ? (
        successContent
    ) : isError ? (
        errorContent
    ) : isWarning ? (
        warningContent
    ) : (
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
                    <BodyText level="body2" className="text-red-500 text-sm font-medium">
                        {validationError}
                    </BodyText>
                )}
                {apiError && (
                    <BodyText level="body2" className="text-red-500 text-sm font-medium">
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
                    className="w-full flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading || !walletAddress || !!validationError}
                    className="w-full flex-1"
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