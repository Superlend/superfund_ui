import ImageWithDefault from "@/components/ImageWithDefault"
import { BodyText, Label } from "@/components/ui/typography"
import { TReward } from "@/types"
import { ChartNoAxesColumnIncreasing, CirclePercent, Percent } from "lucide-react"
import { abbreviateNumber } from "../utils"

/**
 * Get rewards tooltip content
 * @param baseRateFormatted
 * @param rewards
 * @param apyCurrent
 * @returns rewards tooltip content
 */
export function getRewardsTooltipContent({
    title,
    baseRateFormatted,
    baseRateLabel,
    rewards,
    rewardsCustomList,
    apyCurrent,
    positionTypeParam,
    note,
    netApyLabel,
}: {
    title?: string | (() => React.ReactNode)
    baseRateFormatted: string
    baseRateLabel?: string
    rewards?: TReward[]
    rewardsCustomList?: {
        [key: string]: string | boolean | undefined
        show?: boolean
    }[]
    apyCurrent: number
    positionTypeParam?: string
    netApyLabel?: string
    note?: string | (() => React.ReactNode)
}) {
    const baseRateOperator = positionTypeParam === 'lend' ? '+' : '-'
    const isLend = positionTypeParam === 'lend'

    return (
        <div className="flex flex-col divide-y divide-gray-400">
            {(!title || typeof title === 'string') &&
                <BodyText
                    level="body1"
                    weight="medium"
                    className="py-2 text-gray-800"
                >
                    {title || 'Rate & Rewards'}
                </BodyText>
            }
            {typeof title === 'function' && title()}
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ChartNoAxesColumnIncreasing className="w-[16px] h-[16px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        {baseRateLabel || 'Base Rate'}
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    {baseRateFormatted}%
                </BodyText>
            </div>
            {rewards?.map((reward) => {
                if ('asset' in reward && 'supply_apy' in reward) {
                    return (
                        <div
                            key={reward.asset.address}
                            className="flex items-center justify-between gap-[100px] py-2"
                            style={{ gap: '70px' }}
                        >
                            <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={reward?.asset?.logo || ''}
                                    width={16}
                                    height={16}
                                    alt={reward?.asset?.name || ''}
                                    className="inline-block rounded-full object-contain"
                                />
                                <Label
                                    weight="medium"
                                    className="truncate text-gray-800 max-w-[100px] truncate"
                                    title={reward?.asset?.name || ''}
                                >
                                    {reward?.asset?.name || ''}
                                </Label>
                            </div>
                            <BodyText
                                level="body3"
                                weight="medium"
                                className="text-gray-800"
                            >
                                {baseRateOperator}{' '}
                                {`${(Math.floor(Number(reward.supply_apy) * 100) / 100).toFixed(2)}%`}
                            </BodyText>
                        </div>
                    )
                }

                return null
            })}
            {rewardsCustomList && rewardsCustomList?.map((reward: any) => {
                if (reward.show ?? true) {
                return (
                    <div
                        key={reward.key}
                        className="flex items-center justify-between gap-[100px] py-2"
                        style={{ gap: '70px' }}
                    >
                        <div className="flex items-center gap-1">
                            {!reward.logo && <Percent className="text-gray-800" width={14} height={14} />}
                            {reward.logo &&
                                <ImageWithDefault
                                    src={reward?.logo || ''}
                                    width={16}
                                    height={16}
                                    alt={reward?.key_name || ''}
                                    className="inline-block rounded-full grow-0 shrink-0 object-cover"
                                />
                            }
                            <Label weight="medium" className="text-gray-800">
                                {reward.key_name}
                            </Label>
                        </div>
                        <BodyText level="body3" weight="medium" className="text-gray-800">
                            {reward.value}%
                        </BodyText>
                    </div>
                    )
                }
                return null
            })}
            <div
                className="flex items-center justify-between gap-[100px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ImageWithDefault
                        src="/icons/twinkle-stars.svg"
                        alt="Net APY"
                        width={16}
                        height={16}
                        className="inline-block"
                    />
                    <Label weight="medium" className="text-gray-800">
                        {netApyLabel || 'Net APY'}
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    = {abbreviateNumber(apyCurrent)}%
                </BodyText>
            </div>
            {note && typeof note === 'string' &&
                <BodyText level="body3" weight="medium" className="text-gray-800 py-2 mt-2">
                    {note}
                </BodyText>
            }
            {note && typeof note === 'function' && note()}
        </div>
    )
}

/**
 * Get rewards tooltip content
 * @param baseRateFormatted
 * @param rewards
 * @param apyCurrent
 * @returns rewards tooltip content
 */
export function getRewardsTooltipMobileContent({
    title,
    baseRateFormatted,
    baseRateLabel,
    rewards,
    rewardsCustomList,
    apyCurrent,
    positionTypeParam,
    note,
    netApyLabel,
}: {
    title?: string | (() => React.ReactNode)
    baseRateFormatted: string
    baseRateLabel?: string
    rewards?: TReward[]
    rewardsCustomList?: {
        [key: string]: string | boolean | undefined
        show?: boolean
    }[]
    apyCurrent: number
    positionTypeParam?: string
    netApyLabel?: string
    note?: string | (() => React.ReactNode)
}) {
    const baseRateOperator = positionTypeParam === 'lend' ? '+' : '-'
    const isLend = positionTypeParam === 'lend'

    return (
        <div className="flex flex-col divide-y divide-gray-400 max-w-[200px]">
            {(!title || typeof title === 'string') &&
                <BodyText
                    level="body1"
                    weight="medium"
                    className="py-2 text-gray-800"
                >
                    {title || 'Rate & Rewards'}
                </BodyText>
            }
            {typeof title === 'function' && title()}
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ChartNoAxesColumnIncreasing className="w-[16px] h-[16px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        {baseRateLabel || 'Base Rate'}
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    {baseRateFormatted}%
                </BodyText>
            </div>
            {rewards?.map((reward) => {
                if ('asset' in reward && 'supply_apy' in reward) {
                    return (
                        <div
                            key={reward.asset.address}
                            className="flex items-center justify-between gap-[100px] py-2"
                            style={{ gap: '70px' }}
                        >
                            <div className="flex items-center gap-1">
                                <ImageWithDefault
                                    src={reward?.asset?.logo || ''}
                                    width={16}
                                    height={16}
                                    alt={reward?.asset?.name || ''}
                                    className="inline-block rounded-full object-contain"
                                />
                                <Label
                                    weight="medium"
                                    className="truncate text-gray-800 max-w-[100px] truncate"
                                    title={reward?.asset?.name || ''}
                                >
                                    {reward?.asset?.name || ''}
                                </Label>
                            </div>
                            <BodyText
                                level="body3"
                                weight="medium"
                                className="text-gray-800"
                            >
                                {baseRateOperator}{' '}
                                {`${(Math.floor(Number(reward.supply_apy) * 100) / 100).toFixed(2)}%`}
                            </BodyText>
                        </div>
                    )
                }

                return null
            })}
            {rewardsCustomList && rewardsCustomList?.map((reward: any) => {
                if (reward.show ?? true) {
                return (
                    <div
                        key={reward.key}
                        className="flex items-center justify-between gap-[100px] py-2"
                        style={{ gap: '70px' }}
                    >
                        <div className="flex items-center gap-1">
                            {!reward.logo && <Percent className="text-gray-800" width={14} height={14} />}
                            {reward.logo &&
                                <ImageWithDefault
                                    src={reward?.logo || ''}
                                    width={16}
                                    height={16}
                                    alt={reward?.key_name || ''}
                                    className="inline-block rounded-full grow-0 shrink-0 object-cover"
                                />
                            }
                            <Label weight="medium" className="text-gray-800">
                                {reward.key_name}
                            </Label>
                        </div>
                        <BodyText level="body3" weight="medium" className="text-gray-800">
                            {reward.value}%
                        </BodyText>
                    </div>
                    )
                }
                return null
            })}
            <div
                className="flex items-center justify-between gap-[100px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ImageWithDefault
                        src="/icons/twinkle-stars.svg"
                        alt="Net APY"
                        width={16}
                        height={16}
                        className="inline-block"
                    />
                    <Label weight="medium" className="text-gray-800">
                        {netApyLabel || 'Net APY'}
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800 shrink-0"
                >
                    = {abbreviateNumber(apyCurrent)}%
                </BodyText>
            </div>
            {note && typeof note === 'string' &&
                <BodyText level="body3" weight="medium" className="text-gray-800 py-2 mt-2">
                    {note}
                </BodyText>
            }
            {note && typeof note === 'function' && note()}
        </div>
    )
}