import ImageWithDefault from "@/components/ImageWithDefault"
import { BodyText, Label } from "@/components/ui/typography"
import { TReward } from "@/types"
import { ChartNoAxesColumnIncreasing } from "lucide-react"
import { abbreviateNumber } from "../utils"

/**
 * Get rewards tooltip content
 * @param baseRateFormatted
 * @param rewards
 * @param apyCurrent
 * @returns rewards tooltip content
 */
export function getRewardsTooltipContent({
    baseRateFormatted,
    rewards,
    apyCurrent,
    positionTypeParam,
}: {
    baseRateFormatted: string
    rewards: TReward[]
    apyCurrent: number
    positionTypeParam: string
}) {
    const baseRateOperator = positionTypeParam === 'lend' ? '+' : '-'
    const isLend = positionTypeParam === 'lend'

    return (
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800/75"
            >
                Rate & Rewards
            </BodyText>
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ChartNoAxesColumnIncreasing className="w-[16px] h-[16px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Base rate
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
            {rewards?.map((reward: TReward) => (
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
                        {`${(Math.floor(Number(isLend ? reward.supply_apy : reward.borrow_apy) * 100) / 100).toFixed(2)}%`}
                    </BodyText>
                </div>
            ))}
            <div
                className="flex items-center justify-between gap-[100px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ImageWithDefault
                        src="/icons/sparkles.svg"
                        alt="Net APY"
                        width={16}
                        height={16}
                        className="inline-block"
                    />
                    <Label weight="medium" className="text-gray-800">
                        Net APY
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
        </div>
    )
}