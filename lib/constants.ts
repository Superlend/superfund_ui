import { ChainId } from "@/types/chain"

// Add type definitions at the top
export type BaseStrategy = {
    address: string;
    strategy_type: StrategiesType;
    details_url: string;
}

export type SonicStrategy = BaseStrategy & {
    vault_address: string;
}

export const DEFAULT_ROUTE = {
    home: '/discover',
}

const MORPHO_BASE_URL = 'https://app.morpho.org/base'

export enum StrategiesType {
    Morpho = 'Morpho',
    AaveV3 = 'AaveV3',
    Fluid = 'Fluid',
    EulerBaseUSDC = 'Euler Base USDC',
    SILO_V2 = 'Silo V2',
    CASH_RESERVE = 'Cash Reserve',
}

// BASE
export const VAULT_ADDRESS = '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B'
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const USDC_DECIMALS = 6
export const BASE_FLUID_LENDING_RESOLVER_ADDRESS = '0x3aF6FBEc4a2FE517F56E402C65e3f4c3e18C1D86'

// SONIC
export const SONIC_VAULT_ADDRESS = '0x96328cd6fBCc3adC8bee58523Bbc67aBF38f8124'
export const SONIC_USDC_ADDRESS = '0x29219dd400f2Bf60E5a23d13Be72B486D4038894'
export const SONIC_USDC_DECIMALS = 6
// export const SONIC_FLUID_LENDING_RESOLVER_ADDRESS = '0x3aF6FBEc4a2FE517F56E402C65e3f4c3e18C1D86'

export const VAULT_ADDRESS_MAP = {
    [ChainId.Base]: VAULT_ADDRESS,
    [ChainId.Sonic]: SONIC_VAULT_ADDRESS,
}

export const USDC_ADDRESS_MAP = {
    [ChainId.Base]: USDC_ADDRESS,
    [ChainId.Sonic]: SONIC_USDC_ADDRESS,
}

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

export const SONIC_VAULT_STRATEGIES_COLORS = {
    'Aave V3 USDC': "#3366CC",
    'MEV Capital Sonic Cluster': "#8A2BE2",
    'Re7 labs Cluster': "#FF8C00",
    'Cash Reserve': "#F4A460",
    'Silo Finance Borrowable USDC.e Deposit, SiloId: 27': "#171a17",
    'Silo Finance Borrowable USDC.e Deposit, SiloId: 49': "#3f3f3f",
}

export const VAULT_STRATEGIES: Record<string, BaseStrategy> = {
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

export const SONIC_VAULT_STRATEGIES: Record<string, SonicStrategy> = {
    "Aave V3 USDC": {
        address: "0x7342c3387EfBbcc9fa505027bd1fDB0093e6E8bA",
        strategy_type: StrategiesType.AaveV3,
        details_url: "https://app.aave.com/reserve-overview/?underlyingAsset=0x29219dd400f2bf60e5a23d13be72b486d4038894&marketName=proto_sonic_v3",
        vault_address: "0x7342c3387EfBbcc9fa505027bd1fDB0093e6E8bA"
    },
    "MEV Capital Sonic Cluster": {
        address: "0x417B12320601D59A548b67ce08b15F7c4bF4fe4d",
        strategy_type: StrategiesType.EulerBaseUSDC, // EULER_VAULT
        details_url: "https://app.euler.finance/vault/0x196F3C7443E940911EE2Bb88e019Fd71400349D9?network=sonic",
        vault_address: "0x196F3C7443E940911EE2Bb88e019Fd71400349D9"
    },
    "Re7 labs Cluster": {
        address: "0x5001f8Ca9fc7809D13854885E419D11Da12df8AF",
        strategy_type: StrategiesType.EulerBaseUSDC, // EULER_VAULT
        details_url: "https://app.euler.finance/vault/0x3D9e5462A940684073EED7e4a13d19AE0Dcd13bc?network=sonic",
        vault_address: "0x3D9e5462A940684073EED7e4a13d19AE0Dcd13bc"
    },
    'Cash Reserve': {
        address: '0x0000000000000000000000000000000000000000',
        strategy_type: StrategiesType.CASH_RESERVE,
        details_url: `https://sonicscan.org/token/0x29219dd400f2Bf60E5a23d13Be72B486D4038894?a=0x96328cd6fBCc3adC8bee58523Bbc67aBF38f8124`,
        vault_address: '0x0000000000000000000000000000000000000000'
    },
    "Silo Finance Borrowable USDC.e Deposit, SiloId: 27": {
        address: "0x14886c2Fc03D1858e6d097d40EdF92B3bFEBA678",
        strategy_type: StrategiesType.SILO_V2,
        details_url: "https://app.silo.finance/markets/sonic/anon-usdc-27",
        vault_address: "0x7e88AE5E50474A48deA4c42a634aA7485e7CaA62",
    },
    "Silo Finance Borrowable USDC.e Deposit, SiloId: 49": {
        address: "0xa352A4851cc8ae0DA04220a92F4Ce4A0E06912dc",
        strategy_type: StrategiesType.SILO_V2,
        details_url: "https://app.silo.finance/markets/sonic/anon-usdc-49",
        vault_address: "0xa18a8f100f2c976044f2f84fae1eE9f807Ae7893",
    }
}

// Update the type of the map
export const VAULT_STRATEGIES_MAP: {
    [ChainId.Base]: Record<string, BaseStrategy>;
    [ChainId.Sonic]: Record<string, SonicStrategy>;
} = {
    [ChainId.Base]: VAULT_STRATEGIES,
    [ChainId.Sonic]: SONIC_VAULT_STRATEGIES,
}

export const VAULT_STRATEGIES_COLORS_MAP = {
    [ChainId.Base]: VAULT_STRATEGIES_COLORS,
    [ChainId.Sonic]: SONIC_VAULT_STRATEGIES_COLORS,
}
