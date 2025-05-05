import { Period } from './periodButtons'

export type TBenchmarkProtocol = {
    protocol_identifier: string
    token: string
    color: string
    label: string
    isApproximated?: boolean
}

export type TBenchmarkDataPoint = {
    timestamp: number
    superfund: number | null
    aave: number | null
    fluid?: number | null
    morphoGauntletPrime?: number | null
    morphoMoonwell?: number | null
    morphoGauntletCore?: number | null
    morphoSteakhouse?: number | null
    morphoIonic?: number | null
    morphoRe7?: number | null
    isAaveApproximated?: boolean
    isFluidApproximated?: boolean
    isMorphoGauntletPrimeApproximated?: boolean
    isMorphoMoonwellApproximated?: boolean
    isMorphoGauntletCoreApproximated?: boolean
    isMorphoSteakhouseApproximated?: boolean
    isMorphoIonicApproximated?: boolean
    isMorphoRe7Approximated?: boolean
}

export type TFormattedBenchmarkDataPoint = TBenchmarkDataPoint & {
    rawTimestamp: number
    xValue: number
    date: string
    monthDay: string
    timestamp: string
    timeValue: string
    superfundDisplay: string
    aaveDisplay: string
    fluidDisplay?: string
    morphoGauntletPrimeDisplay?: string
    morphoMoonwellDisplay?: string
    morphoGauntletCoreDisplay?: string
    morphoSteakhouseDisplay?: string
    morphoIonicDisplay?: string
    morphoRe7Display?: string
}

export type TChartConfig = {
    [key: string]: {
        label: string
        color: string
    }
}

export type TCustomYAxisTickProps = {
    x: number
    y: number
    payload: {
        value: number
    }
    index: number
    length: number
}

export type TCustomXAxisTickProps = {
    x: number
    y: number
    selectedRange: Period
    payload: {
        value: number
    }
    index: number
    length: number
}

export type TCustomTooltipProps = {
    active: boolean
    payload: Array<{
        payload: TFormattedBenchmarkDataPoint
    }>
    visibleLines?: Record<string, boolean>
} 