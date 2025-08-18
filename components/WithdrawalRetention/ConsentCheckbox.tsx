'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { BodyText } from '@/components/ui/typography'
import { motion } from 'motion/react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ConsentCheckboxProps {
    onConsentChange: (consented: boolean) => void
    isRequired?: boolean
    className?: string
}

export default function ConsentCheckbox({
    onConsentChange,
    isRequired = true,
    className = '',
}: ConsentCheckboxProps) {
    const [isChecked, setIsChecked] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)

    const handleCheckboxChange = (checked: boolean) => {
        setIsChecked(checked)
        setHasInteracted(true)
        onConsentChange(checked)
    }

    const showError = isRequired && hasInteracted && !isChecked

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
            className={`space-y-3 ${className}`}
        >
            {/* Consent Checkbox */}
            <div className={`flex items-start gap-3 p-4 rounded-5 border-2 transition-all duration-200 ${showError
                ? 'border-red-200 bg-red-50'
                : isChecked
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                <div className="flex items-center pt-0.5">
                    <Checkbox
                        id="withdrawal-consent"
                        checked={isChecked}
                        onCheckedChange={handleCheckboxChange}
                        className="w-5 h-5"
                        aria-describedby="consent-description"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <label
                        htmlFor="withdrawal-consent"
                        className="block cursor-pointer"
                    >
                        <BodyText
                            level="body2"
                            weight="medium"
                            className={`transition-colors ${showError
                                ? 'text-red-800'
                                : isChecked
                                    ? 'text-green-800'
                                    : 'text-gray-800'
                                }`}
                        >
                            I understand that by withdrawing now, I&apos;ll lose part of my recent yield due to the vault&apos;s fair distribution mechanism.
                        </BodyText>
                    </label>
                </div>
                {isChecked && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </motion.div>
                )}
            </div>

            {/* Error Message */}
            {showError && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 text-red-600"
                >
                    <AlertCircle className="w-4 h-4" />
                    <BodyText level="body3" weight="normal" className="text-red-600">
                        Please confirm you understand before proceeding.
                    </BodyText>
                </motion.div>
            )}

            {/* Confirmation Message */}
            {isChecked && !showError && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 text-green-600"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <BodyText level="body3" weight="normal" className="text-green-600">
                        Thank you for your understanding. You may now proceed.
                    </BodyText>
                </motion.div>
            )}
        </motion.div>
    )
} 