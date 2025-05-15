'use client'

import React, { useState } from 'react'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useUserBalance } from '@/hooks/vault_hooks/useUserBalanceHook'
// import { useAnalytics } from '@/context/amplitude-analytics-provider'

export default function SubscribeWithEmail({ onEmailChange }: { onEmailChange?: (email: string) => void }) {
    // const { logEvent } = useAnalytics()
    const { walletAddress } = useWalletConnection()
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const { userMaxWithdrawAmount } = useUserBalance(
        walletAddress as `0x${string}`
    )

    // Custom email change handler to notify parent component
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value
        setEmail(newEmail)
        if (onEmailChange) onEmailChange(newEmail)
    }

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setSubmissionStatus('error')
            setErrorMessage('Please enter a valid email address')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    wallet_address: walletAddress || null,
                    portfolio_value: userMaxWithdrawAmount || null
                }),
            })

            if (response.ok) {
                setEmail('')
                setSubmissionStatus('success')
                if (onEmailChange) onEmailChange('') // Clear the parent's tracked email
                // logEvent('newsletter_subscribed', {
                //     section: 'footer'
                // })
            } else {
                const error = await response.json()
                throw new Error(error.message || 'Something went wrong')
            }
        } catch (error: any) {
            setSubmissionStatus('error')
            setErrorMessage(error.message || "Failed to subscribe, please try again")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setSubmissionStatus('idle')
        setEmail('')
        setErrorMessage('')
        if (onEmailChange) onEmailChange('') // Clear parent's tracked email
    }

    return (
        <div className="w-full">
            <HeadingText level="h5" weight="semibold" className="text-gray-900">
                Stay up to date
            </HeadingText>
            <BodyText level="body3" className="text-gray-600 mb-4">
                Get the latest updates on SuperFund
            </BodyText>

            {submissionStatus === 'idle' && (
                <>
                    <form onSubmit={handleSubscribe} className="flex flex-col gap-2 subscribe-email-form">
                        <div className="relative">
                            <Input
                                type="email"
                                placeholder="Type email here"
                                className="pr-12 bg-gray-200/50 border-0 ring-1 ring-primary/40 focus:ring-1 focus:!ring-primary focus-visible:!ring-1 focus-visible:!ring-primary hover:!ring-primary rounded-4"
                                value={email}
                                onChange={handleEmailChange}
                                required
                            />
                            <Button
                                type="submit"
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 h-8 w-fit shrink-0 bg-primary hover:bg-primary/90 text-white rounded-4 flex items-center justify-center gap-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin stroke-white" /> : <ArrowRight className="h-4 w-4 stroke-white" />}
                            </Button>
                        </div>
                    </form>
                    <BodyText level="body3" className="text-gray-600 mt-2 ml-1">
                        Your email will be used to share announcements and keep you updated on upgrades on our vault.
                    </BodyText>
                </>
            )}

            {submissionStatus === 'success' && (
                <div className="bg-green-50/50 p-3 rounded-4 border border-green-200 flex items-start gap-2 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-green-800 text-sm font-medium">Thank you!</p>
                        <p className="text-green-700 text-xs mt-1">Stay tuned for future updates.</p>
                        {/* <Button
                            type="button"
                            onClick={resetForm}
                            className="mt-2 text-xs h-7 bg-white hover:bg-green-50 text-green-600 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            Share another email
                        </Button> */}
                    </div>
                </div>
            )}

            {submissionStatus === 'error' && (
                <div className="bg-red-50/50 p-3 rounded-4 border border-red-200 flex items-start gap-2 shadow-sm">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-red-800 text-sm font-medium">That didn&apos;t work!</p>
                        <p className="text-red-700 text-xs mt-1">{errorMessage}</p>
                        <Button
                            type="button"
                            onClick={resetForm}
                            className="mt-2 text-xs h-7 bg-white hover:bg-red-50 text-red-600 border border-red-200"
                        >
                            Try again
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
