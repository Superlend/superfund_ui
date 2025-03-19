export const DEFAULT_ROUTE = {
    home: '/discover',
}

export const VAULT_ADDRESS = '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B'
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const USDC_DECIMALS = 6
export const BASE_FLUID_LENDING_RESOLVER_ADDRESS = '0x3aF6FBEc4a2FE517F56E402C65e3f4c3e18C1D86'

// 1 million allocation points
export const TOTAL_ALLOCATION_POINTS = 1_000_000
// 1% as a cash reserve
export const CASH_RESERVE_POINTS = 10_000

export const VAULT_STRATEGIES_COLORS = {
    'Morpho Gauntlet USDC Prime': "#3366CC",
    'Morpho Moonwell Flagship USDC': "#8A2BE2",
    'Morpho Gauntlet USDC Core': "#FF8C00",
    'Morpho Steakhouse USDC': "#DEB887",
    'Morpho Ionic Ecosystem USDC': "#4169E1",
    'Morpho Re7 USDC': "#9370DB",
    AaveV3: "#1E90FF",
    Fluid: "#FFA500",
    'Euler Base USDC': "#6A5ACD",
    'Cash Reserve': "#F4A460",
}

export enum StrategiesType {
    Morpho = 'Morpho',
    AaveV3 = 'AaveV3',
    Fluid = 'Fluid',
    EulerBaseUSDC = 'Euler Base USDC',
    CASH_RESERVE = 'Cash Reserve',
}

const MORPHO_BASE_URL = 'https://app.morpho.org/base'

export const VAULT_STRATEGIES = {
    'Morpho Gauntlet USDC Prime': {
        address: '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61',
        strategy_type: StrategiesType.Morpho,
        details_url: `${MORPHO_BASE_URL}/vault/0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61/gauntlet-usdc-prime`,
    },
    'Morpho Moonwell Flagship USDC': {
        address: '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca',
        strategy_type: StrategiesType.Morpho,
        details_url: `${MORPHO_BASE_URL}/vault/0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca/moonwell-flagship-usdc`,
    },
    'Morpho Gauntlet USDC Core': {
        address: '0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12',
        strategy_type: StrategiesType.Morpho,
        details_url: `${MORPHO_BASE_URL}/vault/0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12/gauntlet-usdc-core`,
    },
    'Morpho Steakhouse USDC': {
        address: '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183',
        strategy_type: StrategiesType.Morpho,
        details_url: `${MORPHO_BASE_URL}/vault/0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183/steakhouse-usdc`,
    },
    'Morpho Ionic Ecosystem USDC': {
        address: '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e',
        strategy_type: StrategiesType.Morpho,
        details_url: `${MORPHO_BASE_URL}/vault/0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e/ionic-ecosystem-usdc`,
    },
    'Morpho Re7 USDC': {
        address: '0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e',
        strategy_type: StrategiesType.Morpho,
        details_url: `${MORPHO_BASE_URL}/vault/0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e/re7-usdc`,
    },
    AaveV3: {
        address: '0x7A7815B41617e728DbCF4247E46d1CEbd2d81150',
        strategy_type: StrategiesType.AaveV3,
        details_url: `https://app.aave.com/reserve-overview/?underlyingAsset=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&marketName=proto_base_v3`,
    },
    Fluid: {
        address: '0xf42f5795D9ac7e9D757dB633D693cD548Cfd9169',
        strategy_type: StrategiesType.Fluid,
        details_url: `https://fluid.io/lending/8453`,
    },
    'Euler Base USDC': {
        address: '0x0A1a3b5f2041F33522C4efc754a7D096f880eE16',
        strategy_type: StrategiesType.EulerBaseUSDC,
        details_url: `https://app.euler.finance/vault/0x0A1a3b5f2041F33522C4efc754a7D096f880eE16?network=base`,
    },
    'Cash Reserve': {
        address: '0x0000000000000000000000000000000000000000',
        strategy_type: StrategiesType.CASH_RESERVE,
        details_url: `https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913?a=0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B`,
    },
}
