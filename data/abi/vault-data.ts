import { TX_EXPLORER_LINKS } from '@/constants'
import { USDC_ADDRESS } from '@/lib/constants'
import { ChainId } from '@/types/chain'

export const rebalancedAssetsList = [
    {
        title: 'AAVE',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/aave.svg',
        link: 'https://aave.com/',
    },
    {
        title: 'MORPHO',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/morpho-logo.svg',
        link: 'https://morpho.org/',
    },
    {
        title: 'FLUID',
        logo: 'https://superlend-assets.s3.ap-south-1.amazonaws.com/fluid_logo.png',
        link: 'https://fluid.instadapp.io/',
    },
]

export const tokensSupportedList = [
    {
        title: 'USDC',
        logo: 'https://cdn.morpho.org/assets/logos/usdc.svg',
        link: `${TX_EXPLORER_LINKS[ChainId.Base]}/address/${USDC_ADDRESS}`,
    },
]
