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
    'Morpho Gauntlet USDC Prime': "#201CB0",
    'Morpho Moonwell Flagship USDC': "#201CB0",
    'Morpho Gauntlet USDC Core': "#201CB0",
    'Morpho Steakhouse USDC': "#201CB0",
    'Morpho Ionic Ecosystem USDC': "#201CB0",
    'Morpho Re7 USDC': "#201CB0",
    AaveV3: "#9293F7",
    Fluid: "#753FFD",
    'Euler Base USDC': "#17395e",
    CASH_RESERVE: "#17395e",
}

export enum StrategiesType {
    Morpho = 'Morpho',
    AaveV3 = 'AaveV3',
    Fluid = 'Fluid',
    EulerBaseUSDC = 'Euler Base USDC',
    CASH_RESERVE = 'CASH_RESERVE',
}

export const VAULT_STRATEGIES = {
    'Morpho Gauntlet USDC Prime': {
        address: '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61',
        strategy_type: StrategiesType.Morpho,
    },
    'Morpho Moonwell Flagship USDC': {
        address: '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca',
        strategy_type: StrategiesType.Morpho,
    },
    'Morpho Gauntlet USDC Core': {
        address: '0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12',
        strategy_type: StrategiesType.Morpho,
    },
    'Morpho Steakhouse USDC': {
        address: '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183',
        strategy_type: StrategiesType.Morpho,
    },
    'Morpho Ionic Ecosystem USDC': {
        address: '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e',
        strategy_type: StrategiesType.Morpho,
    },
    'Morpho Re7 USDC': {
        address: '0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e',
        strategy_type: StrategiesType.Morpho,
    },
    AaveV3: {
        address: '0x7A7815B41617e728DbCF4247E46d1CEbd2d81150',
        strategy_type: StrategiesType.AaveV3,
    },
    Fluid: {
        address: '0xf42f5795D9ac7e9D757dB633D693cD548Cfd9169',
        strategy_type: StrategiesType.Fluid,
    },
    'Euler Base USDC': {
        address: '0x0A1a3b5f2041F33522C4efc754a7D096f880eE16',
        strategy_type: StrategiesType.EulerBaseUSDC,
    },
    // CASH_RESERVE: {
    //     address: '0x0000000000000000000000000000000000000000',
    //     strategy_type: StrategiesType.CASH_RESERVE,
    // },
}
