export const DEFAULT_ROUTE = {
    home: '/discover',
}

export const VAULT_ADDRESS = '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B';
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const USDC_DECIMALS = 6;

// 1 million allocation points
export const TOTAL_ALLOCATION_POINTS = 1_000_000;
// 1% as a cash reserve
export const CASH_RESERVE_POINTS = 10_000;

export const VAULT_STRATEGIES = {
    Morpho: [
        '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61',
        '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca',
        '0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12',
        '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183',
        '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e',
        '0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e'
    ],
    AaveV3: ['0x7A7815B41617e728DbCF4247E46d1CEbd2d81150'],
    Fluid: ['0xf42f5795D9ac7e9D757dB633D693cD548Cfd9169'],
}