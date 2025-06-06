'use client'

import { motion } from 'framer-motion'
import { Calendar, Bell } from 'lucide-react'
import { BodyText } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'

interface CalendarReminderProps {
    depositAmount: number
    tokenSymbol: string
}

export default function CalendarReminder({
    depositAmount,
    tokenSymbol,
}: CalendarReminderProps) {
    const { logEvent } = useAnalytics()
    const { walletAddress } = useWalletConnection()

    const handleSetReminder = () => {
        logEvent('calendar_reminder_clicked', {
            depositAmount,
            tokenSymbol,
            walletAddress,
            source: 'post_deposit_success',
        })

        // Create calendar event data
        const reminderDate = new Date()
        reminderDate.setDate(reminderDate.getDate() + 14) // 14 days from now

        const eventTitle = `Claim SuperFund Rewards - ${depositAmount} ${tokenSymbol}`
        const eventDescription = `Time to claim your accrued rewards from your SuperFund deposit. Your estimated rewards are ready for claiming.`
        const startDate = reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        // Create Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent('https://funds.superlend.xyz')}`

        // Create ICS file content for other calendar apps
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SuperFund//Reward Reminder//EN
BEGIN:VEVENT
UID:${Date.now()}@superlend.xyz
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}
URL:https://funds.superlend.xyz
END:VEVENT
END:VCALENDAR`

        // Try to detect user's preferred calendar
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
        const isApple = /mac|iphone|ipad|ipod/i.test(userAgent)

        if (isMobile) {
            // On mobile, try to open native calendar
            if (isApple) {
                // For iOS, create a data URL and open it
                const dataUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`
                window.open(dataUrl, '_blank')
            } else {
                // For Android, try Google Calendar first
                window.open(googleCalendarUrl, '_blank')
            }
        } else {
            // On desktop, provide options
            // First try Google Calendar
            window.open(googleCalendarUrl, '_blank')
            
            // Also create downloadable ICS file as fallback
            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `superfund-reward-reminder-${Date.now()}.ics`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
            className="bg-amber-50 border border-amber-200 rounded-5 p-4"
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-amber-600" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <BodyText level="body2" weight="medium" className="text-amber-800">
                        Never Miss Your Rewards
                    </BodyText>
                    <BodyText level="body3" weight="normal" className="text-amber-700 mb-3">
                        Set a calendar reminder to claim your rewards in 2 weeks
                    </BodyText>

                    {/* CTA Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetReminder}
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all duration-200 flex items-center gap-1"
                    >
                        <Calendar className="w-3 h-3" />
                        <span>Set Reminder</span>
                    </Button>
                </div>
            </div>
        </motion.div>
    )
} 