import type { Metadata } from 'next'
import '../globals.css'
import Link from 'next/link'
import ContextProvider from '@/context'
import { headers } from 'next/headers'

const frame = {
    version: 'next',
    imageUrl:
        'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    button: {
        title: 'Check This Out',
        action: {
            type: 'launch_frame',
            name: 'SuperFund',
            url: 'https://funds.superlend.xyz/',
            splashImageUrl:
                'https://funds.superlend.xyz/images/logos/favicon-32x32.png',
            splashBackgroundColor: '#B4E2FB',
        },
    },
}

export const metadata: Metadata = {
    metadataBase: new URL('https://funds.superlend.xyz'),
    alternates: {
        canonical: '/',
        languages: {
            'en-US': '/en-US',
        },
    },
    keywords: [
        'DeFi',
        'Deposit',
        'Withdraw',
        'DeFi rates',
        'Earn in DeFi',
        'Earn USDC',
    ],
    title: 'Join SuperFund Waitlist - Earn Maximum Yield on USDC',
    description:
        'Earn smarter with SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.',
    icons: [
        { url: '/images/logos/favicon-16x16.png', sizes: '16x16' },
        { url: '/images/logos/favicon-32x32.png', sizes: '32x32' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
    ],
    openGraph: {
        type: 'website',
        url: 'https://funds.superlend.xyz',
        title: 'Join SuperFund Waitlist - Earn Maximum Yield on USDC',
        description:
            'Earn smarter with SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.',
        siteName: 'Superfund',
        images: 'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    twitter: {
        title: 'Join SuperFund Waitlist - Earn Maximum Yield on USDC',
        description:
            'Earn smarter with SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.',
        images: 'https://superlend-public-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    other: {
        'fc:frame': JSON.stringify(frame),
    },
}

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookies = headers().get('cookie')

    return (
        <html lang="en">
            <body>
                <ContextProvider cookies={cookies}>
                    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
                        <div className="flex justify-center pt-8 pb-4">
                            <div className="relative">
                                <Link href="https://www.superlend.xyz/" target="_blank" className="inline-block">
                                    <img
                                        src="/images/logos/superlend-logo.webp"
                                        alt="Superlend logo"
                                        className="object-contain h-auto w-40"
                                    />
                                </Link>
                                {/* <Badge
                                variant="blue"
                                className="absolute top-1 -right-12 w-fit rounded-full px-2 py-0"
                            >
                                Beta
                            </Badge> */}
                            </div>
                        </div>
                        {children}
                    </div>
                </ContextProvider>
            </body>
        </html>
    )
}