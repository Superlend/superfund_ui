import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import Header from '@/components/Header'
import ContextProvider from '@/context'
import Footer from '@/components/Footer'
import { GoogleTagManager } from '@next/third-parties/google'
import ScrollToTop from '@/components/ScrollToTop'
import { Toaster } from 'react-hot-toast'

const frame = {
    version: 'next',
    imageUrl:
        'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    button: {
        title: 'Start Earning',
        action: {
            type: 'launch_frame',
            name: 'SuperFund',
            url: 'https://funds.superlend.xyz/super-fund/base',
            splashImageUrl:
                'https://funds.superlend.xyz/images/logos/superlend-orange-circle.png',
            splashBackgroundColor: '#ffffff',
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
    title: 'SuperFunds - Earn Maximum Yield on USDC',
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
        title: 'SuperFunds - Earn Maximum Yield on USDC',
        description:
            'Earn smarter with SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.',
        siteName: 'Superfund',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    twitter: {
        title: 'SuperFunds - Earn Maximum Yield on USDC',
        description:
            'Earn smarter with SuperFund — an automated DeFi fund that allocates USDC across Aave, Morpho, Euler & more for optimized returns.',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    other: {
        'fc:frame': JSON.stringify(frame),
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookies = headers().get('cookie')
    const GTM_ID = process.env.NEXT_GTM_ID || ''

    return (
        <html lang="en">
            <body className={`bg-[#B4E2FB] font-sans max-md:pb-[50px]`}>
                <ScrollToTop />
                <GoogleTagManager gtmId={GTM_ID} />
                <ContextProvider cookies={cookies}>
                    <Header />
                    {children}
                    <Footer />
                </ContextProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: Infinity,
                        style: {
                            background: '#fff',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            padding: '16px',
                            fontSize: '14px',
                            maxWidth: '400px',
                        },
                    }}
                />
            </body>
        </html>
    )
}
