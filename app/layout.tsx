import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import Header from '@/components/Header'
import ContextProvider from '@/context'
import Footer from '@/components/Footer'
import { GoogleTagManager } from '@next/third-parties/google'
import ScrollToTop from '@/components/ScrollToTop'

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
        'SuperFund optimally allocates your USDC across trusted lending protocols such as Aave, Morpho, Euler, & Fluid to generate consistent and competitive returns.',
    icons: [
        { url: '/images/logos/favicon-16x16.png', sizes: '16x16' },
        { url: '/images/logos/favicon-32x32.png', sizes: '32x32' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', url: '/images/logos/apple-touch-icon.png' },
    ],
    openGraph: {
        type: 'website',
        url: 'https://funds.superlend.xyz',
        title: 'SuperFund',
        description:
            'SuperFund optimally allocates your USDC across trusted lending protocols such as Aave, Morpho, Euler, & Fluid to generate consistent and competitive returns.',
        siteName: 'Superfund',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
    },
    twitter: {
        title: 'SuperFunds - Earn Maximum Yield on USDC',
        description:
            'SuperFund optimally allocates your USDC across trusted lending protocols such as Aave, Morpho, Euler, & Fluid to generate consistent and competitive returns.',
        images: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/superlend_banner.png',
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
                    {/* <Footer /> */}
                </ContextProvider>
            </body>
        </html>
    )
}
