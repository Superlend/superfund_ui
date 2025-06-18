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
    }
}

export default nextConfig
