"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import ImageWithDefault from "@/components/ImageWithDefault";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import { BodyText, Label } from "@/components/ui/typography";
import useDimensions from "@/hooks/useDimensions";
import { abbreviateNumber, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import { TOpportunityTable } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: "tokenSymbol",
        header: "Token",
        accessorFn: item => item.tokenSymbol,
        cell: ({ row }) => {
            const { width: screenWidth } = useDimensions();
            const tokenSymbol: string = row.getValue("tokenSymbol");
            const tokenLogo = row.original.tokenLogo;
            const tokenAddress = row.original.tokenAddress;
            const tokenName = row.original.tokenName;
            const chainId = row.original.chain_id;
            const chainLogo = row.original.chainLogo;
            const chainName = row.original.chainName;
            const platformId = row.original.platform_id;
            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Token</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault alt={tokenSymbol} src={tokenLogo} width={24} height={24} className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]" />
                            <BodyText level="body2" weight="medium">{tokenName}</BodyText>
                        </span>
                    </span>
                    <span className="flex flex-col gap-[4px]">
                        <Label>Chain</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault alt={chainName} src={chainLogo} width={24} height={24} className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]" />
                            <BodyText level="body2" weight="medium">{chainName[0]}{chainName.toLowerCase().slice(1)}</BodyText>
                        </span>
                    </span>
                </span>
            )

            return (
                <span className="flex items-center gap-[8px] w-fit max-w-full">
                    <InfoTooltip
                        hide={screenWidth < 768}
                        label={
                            <ImageWithBadge
                                mainImg={tokenLogo}
                                badgeImg={chainLogo}
                            />
                        }
                        content={tooltipContent}
                    />
                    <Link href={{
                        pathname: "position-management",
                        query: {
                            token: tokenAddress,
                            chain_id: chainId,
                            platform_id: platformId,
                        }
                    }}
                        className="truncate">
                        <span className="truncate block shrink-0 hover:text-secondary-500">
                            {tokenSymbol}
                        </span>
                    </Link>
                    {/* <InfoTooltip iconWidth={16} iconHeight={16} content={tooltipContent} /> */}
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "platformName",
        header: "Platform",
        accessorFn: item => item.platformName,
        cell: ({ row }) => {
            const platformName: string = row.getValue("platformName");
            const platformVersion: string = row.original.platform_id.split("-")[1]

            return (
                <span className="flex items-center gap-[8px]">
                    <img
                        src={row.original.platformLogo || '/images/logos/favicon-32x32.png'}
                        alt={row.original.platformName}
                        width={20}
                        height={20} />
                    <span className="truncate">{`${platformName[0]}${platformName.slice(1).toLowerCase()} ${platformVersion}`}</span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "apy_current",
        accessorFn: item => Number(item.apy_current),
        header: "APY",
        cell: ({ row }) => `${Number(row.getValue("apy_current")).toFixed(2)}%`,
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "max_ltv",
        accessorFn: item => Number(item.max_ltv),
        header: () => (
            <InfoTooltip
                label={
                    <TooltipText>Max LTV</TooltipText>
                }
                content={"Maximum amount that can be borrowed against the value of collateral."}
            />
        ),
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-2">
                    <span>{`${Number(row.getValue("max_ltv")).toFixed(0)}%`}</span>
                    {Number(row.getValue("max_ltv")) === 0 &&
                        <InfoTooltip
                            content="This asset cannot be used as collateral to take out a loan"
                        />}
                </span>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "deposits",
        accessorFn: item => Number(item.deposits),
        header: () => (
            <InfoTooltip
                label={
                    <TooltipText>Deposits</TooltipText>
                }
                content={"Total amount of asset deposited in the pool as collateral so far."}
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue("deposits");
            if (containsNegativeInteger(value)) {
                return `-$${abbreviateNumber(Number(convertNegativeToPositive(value)))}`
            }
            return `$${abbreviateNumber(Number(value))}`
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "utilization",
        accessorFn: item => Number(item.utilization),
        header: () => (
            <InfoTooltip
                label={
                    <TooltipText>Utilization</TooltipText>
                }
                content={"Ratio between the amount borrowed and the amount deposited."}
            />
        ),
        cell: ({ row }) => `${Number(row.getValue("utilization")).toFixed(1)}%`,
        // enableGlobalFilter: false,
    },
]

function TooltipText({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block border-b border-dashed border-gray-800">
            {children}
        </span>
    )
}