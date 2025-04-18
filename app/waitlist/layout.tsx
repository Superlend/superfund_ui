import type { Metadata } from 'next'
import '../globals.css' // Import global styles
import Link from 'next/link' 
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
    title: 'Join SuperFund Waitlist - Earn Maximum Yield on USDC',
    description:
        'Join the waitlist for SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.',
}

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body>
                <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
                    <div className="flex justify-center pt-8 pb-4">
                        <div className="relative">
                            <Link href="/" className="inline-block">
                                <img
                                    src="/images/logos/superlend-logo.webp"
                                    alt="Superlend logo"
                                    className="object-contain h-auto w-40"
                                />
                            </Link>
                            <Badge
                                variant="blue"
                                className="absolute top-1 -right-12 w-fit rounded-full px-2 py-0"
                            >
                                Beta
                            </Badge>
                        </div>
                    </div>
                    {children}
                </div>
            </body>
        </html>
    )
}