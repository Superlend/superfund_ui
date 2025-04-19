import { TX_EXPLORER_LINKS } from '@/constants'
import { SONIC_USDC_ADDRESS, USDC_ADDRESS } from '@/lib/constants'
import { ChainId } from '@/types/chain'

export const rebalancedAssetsList = [
    {
        title: 'AAVE',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/aave.svg',
        link: 'https://aave.com/',
        chainIds: [ChainId.Base, ChainId.Sonic],
    },
    {
        title: 'MORPHO',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/morpho-logo.svg',
        link: 'https://morpho.org/',
        chainIds: [ChainId.Base],
    },
    {
        title: 'FLUID',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/fluid_logo.png',
        link: 'https://fluid.io/',
        chainIds: [ChainId.Base],
    },
    {
        title: 'Euler',
        logo: '/images/logos/euler-symbol.svg',
        link: 'https://euler.finance/',
        chainIds: [ChainId.Base, ChainId.Sonic],
    },
    {
        title: 'Silo V2',
        logo: 'https://v2.silo.finance/favicon.ico',
        link: 'https://v2.silo.finance',
        chainIds: [ChainId.Sonic],
    },
]

export const tokensSupportedList = [
    {
        title: 'USDC',
        logo: 'https://cdn.morpho.org/assets/logos/usdc.svg',
        link: `${TX_EXPLORER_LINKS[ChainId.Base]}/address/${USDC_ADDRESS}`,
        chainId: ChainId.Base,
    },
    {
        title: 'USDC',
        logo: 'https://cdn.morpho.org/assets/logos/usdc.svg',
        link: `${TX_EXPLORER_LINKS[ChainId.Sonic]}/address/${SONIC_USDC_ADDRESS}`,
        chainId: ChainId.Sonic,
    },
]
