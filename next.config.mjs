/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'superlend-assets.s3.ap-south-1.amazonaws.com',
                protocol: 'https',
            },
            {
                hostname: 'coin-images.coingecko.com',
                protocol: 'https',
            },
            {
                hostname: 'v2.silo.finance',
                protocol: 'https',
            },
        ],
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false }
        return config
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // Allow iframe embedding for WalletConnect
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    // Enable cross-origin requests for WalletConnect
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                    // Content Security Policy for WalletConnect
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://verify.walletconnect.com https://explorer-api.walletconnect.com; connect-src 'self' https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://registry.walletconnect.com https://explorer-api.walletconnect.com;",
                    },
                ],
            },
            {
                // Apple App Site Association for deep linking
                source: '/.well-known/apple-app-site-association',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/json',
                    },
                ],
            },
        ]
    },
}

export default nextConfig
