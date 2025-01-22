import { BodyText, HeadingText } from "@/components/ui/typography";

export default function VaultStats() {
    const vaultStats = [
        {
            title: 'Spot APY',
            stat: 10.00,
        },
        {
            title: 'Vault TVL',
            stat: 23.00,
        },
        {
            title: '7D APY',
            stat: 18.00,
        },
        {
            title: 'Vault Sharpe',
            stat: 239.00,
        },
    ]
    return <section>
        <div className="flex items-center justify-around">
            {vaultStats.map((stat, index) => (
                <div className="block" key={index}>
                    <BodyText level="body1" weight="normal" className="text-gray-600">
                        {stat.title}
                    </BodyText>
                    <HeadingText level="h3" weight="medium">
                        {stat.stat}%
                    </HeadingText>
                </div>
            ))}
        </div>
    </section>
}