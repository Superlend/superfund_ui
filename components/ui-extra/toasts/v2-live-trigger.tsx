'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { V2LiveToast } from './v2-live.toast'

const STORAGE_KEY = 'v2-live-toast-dismissed'
const TOAST_ID = 'v2-live-toast'

const V2LiveTrigger = () => {
    const toastRef = useRef<string | number | null>(null)

    useEffect(() => {
        // Check if dismissed
        const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true'
        if (isDismissed) {
            return
        }

        // Show toast if not already shown
        const timer = setTimeout(() => {
            if (!toastRef.current) {
                const id = toast.custom(
                    (t) => (
                        <V2LiveToast
                            id={t}
                            onDismiss={() => {
                                localStorage.setItem(STORAGE_KEY, 'true')
                                toastRef.current = null
                            }}
                        />
                    ),
                    {
                        id: TOAST_ID,
                        duration: Infinity,
                        position: 'bottom-right',
                        className:
                            '!bg-transparent !border-none !shadow-none !p-0 !bottom-4',
                    }
                )
                toastRef.current = id
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [])

    return null
}

export { V2LiveTrigger }
