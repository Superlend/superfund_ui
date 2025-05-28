import { TChartConfig } from '@/types/benchmark-chart'

export const CHART_CONFIG: TChartConfig = {
    superfund: {
        label: 'Superfund',
        color: '#ff8533',
    },
    superfundReward: {
        label: 'Superfund + Reward',
        color: '#fb5900',
    },
    aave: {
        label: 'Aave',
        color: '#1E90FF',
    },
    morphoGauntletPrime: {
        label: 'Morpho Gauntlet Prime',
        color: '#FF6B6B',
    },
    morphoMoonwell: {
        label: 'Morpho Moonwell',
        color: '#4ECDC4',
    },
    morphoGauntletCore: {
        label: 'Morpho Gauntlet Core',
        color: '#45B7D1',
    },
    morphoSteakhouse: {
        label: 'Morpho Steakhouse',
        color: '#96CEB4',
    },
    morphoIonic: {
        label: 'Morpho Ionic',
        color: '#FFEEAD',
    },
    morphoRe7: {
        label: 'Morpho Re7',
        color: '#D4A5A5',
    },
    fluid: {
        label: 'Fluid',
        color: '#00C853',
    },
    euler: {
        label: 'Euler',
        color: '#08131f',
    },
}

export const PROTOCOL_IDENTIFIERS = {
    SONIC: {
        aave: '0x0b1d26d64c197f8644f6f24ef29af869793188f521c37dc35052c5aebf1e1b1e' as `0x${string}`,
    },
    BASE: {
        aave: '0x8ef0fa7f46a36d852953f0b6ea02f9a92a8a2b1b9a39f38654bee0792c4b4304' as `0x${string}`,
        fluid: '0xfce6a6b40d1d1f1158b5ce2f4f983ee3b6c1883f8cbdb11d6ff2cb04755eccdd' as `0x${string}`,
        morphoGauntletPrime: '0x516b4912495a3aa0071acefe8f6f6444393c85cd3219b5af3a8acd54cb30c018' as `0x${string}`,
        morphoMoonwell: '0x85f993c2d2706818124616951e2c98f6ed174568141316cc20f8f0c17103c01c' as `0x${string}`,
        morphoGauntletCore: '0x16bbde3bc6fc2247f0734b88d14fea971ec5c222caeb3a868e06b7b58d748ef2' as `0x${string}`,
        morphoSteakhouse: '0xd54545c6103cd824ef74d3c7f9c9e42393521aa093aac66c6714de2201d2757e' as `0x${string}`,
        morphoIonic: '0x0acac7b189a953d42bb4af2a7147328c3dc5fc8b2949f590ecad2bc1b4da23af' as `0x${string}`,
        morphoRe7: '0x4c3ee701174bb8e3b83a219bbfd4bb4782ac0c4569a89acb1c23563a26b42312' as `0x${string}`,
        euler: '0x24d996023d16c8cb105e72c92b9652401a4fa1cfc6e675b6c7bc67cc842c6b15' as `0x${string}`,
    }
} 