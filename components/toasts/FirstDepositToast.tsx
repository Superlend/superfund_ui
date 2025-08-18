import React from 'react'
import { motion } from 'motion/react'
import { X, Sparkles } from 'lucide-react'
import { HeadingText, BodyText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

interface FirstDepositToastProps {
    onDismiss: () => void
}

export default function FirstDepositToast({ onDismiss }: FirstDepositToastProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.4 
            }}
            className="relative bg-white rounded-5 shadow-lg p-4 max-w-[380px] min-w-[320px]"
        >
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/20 via-primary/20 to-secondary-500/20 rounded-5 p-[1px]">
                <div className="bg-white rounded-5 h-full w-full" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-2">
                {/* Header with icon and close button */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-primary rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                            You&apos;re New Here?
                        </HeadingText>
                    </div>
                    {/* Enhanced dismiss button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full border border-gray-300 hover:border-gray-300 transition-all duration-200 hover:shadow-sm"
                    >
                        <X className="h-4 w-4 text-gray-600 hover:text-gray-800 shrink-0" />
                    </Button>
                </div>

                {/* Message */}
                <BodyText level="body2" weight="normal" className="text-gray-600 leading-relaxed">
                    Hey! You&apos;re new here, so your APY will start slow. But don&apos;t worry, you&apos;ll catch up in about 7 days. This helps keep the rewards flowing smoothly for everyone!
                </BodyText>

                {/* Progress indicator - commented out since auto-dismiss is disabled */}
                {/* Keep this for future use if auto-dismiss is re-enabled */}
                {/* 
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 8, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-secondary-500 to-primary"
                        />
                    </div>
                    <BodyText level="body3" weight="normal" className="text-gray-400 text-xs">
                        8s
                    </BodyText>
                </div>
                */}
            </div>
        </motion.div>
    )
} 