import React from 'react';
import useUserStatements from '@/hooks/useUserStatements';
import { Card } from './ui/card';
import ExternalLink from './ExternalLink';
import { BodyText } from './ui/typography';
import { abbreviateNumberWithoutRounding, getBlockExplorerUrl } from '@/lib/utils';
import { ChainId, ChainNameMap } from '@/types/chain';
import { format, isToday, isYesterday } from 'date-fns';
import { formatUnits } from 'ethers/lib/utils';
import { useState } from 'react';
import { ChevronRight, ExternalLink as LucideExternalLink, Copy, ArrowUpRight, ArrowDownRight, CheckCircle2, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";

interface StatementsProps {
    userAddress: string;
    vaultAddress: string;
    chainId: number;
}

/**
 * Statements Component
 * 
 * Usage:
 * <Statements
 *   userAddress="0x03adFaA573aC1a9b19D2b8F79a5aAFFb9c2A0532"
 *   vaultAddress="0x10076ed296571ce4fde5b1fdf0eb9014a880e47b"
 *   chainId={8453}
 * />
 */
function Statements({ userAddress, vaultAddress, chainId }: StatementsProps) {
    const { data: response, isLoading, isError, error } = useUserStatements({
        userAddress,
        vaultAddress,
        chainId,
    });
    const data = response?.[0]
    console.log(data)

    // Helper function to format Unix timestamps into a readable date string
    const formatTimestamp = (timestamp: string) => {
        return new Date(parseInt(timestamp)).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Helper function to shorten blockchain addresses for better readability
    const shortenAddress = (address: string) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    // Helper function to convert block number to timestamp (placeholder for now)
    const convertBlockNumberToTimestamp = (blockNumber: number): string => {
        // For now, return empty string as requested
        return '';
    };

    // Helper function to convert Unix timestamp to user's local timezone
    const convertTimestampToLocalDate = (timestamp: string): Date => {
        if (!timestamp) {
            // Fallback to current date if no timestamp
            return new Date();
        }
        const timestampMs = parseInt(timestamp) * 1000;
        return new Date(timestampMs);
    };

    // Helper function to get user's timezone for display
    const getUserTimezone = (): string => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return 'UTC';
        }
    };

    // Transform statements transaction data to match TransactionHistory format
    const transformStatementTransaction = (tx: any) => {
        return {
            type: tx.type,
            assets: (parseFloat(tx.tokenAmount) * 1e6).toString(), // Convert to Wei format
            shares: (parseFloat(tx.shareAmount) * 1e6).toString(), // Convert to Wei format
            blockTimestamp: convertBlockNumberToTimestamp(tx.blockNumber),
            transactionHash: tx.txHash,
            blockNumber: tx.blockNumber
        };
    };

    // Extracted TransactionItem component for statements
    function StatementTransactionItem({ transaction, chainId }: { transaction: any; chainId: number }) {
        const { type, assets, shares, blockTimestamp, transactionHash } = transaction;
        const date = convertTimestampToLocalDate(blockTimestamp);
        const [copied, setCopied] = useState(false);

        // Format the asset amount (using 1e6 decimals as specified)
        const formattedAssets = parseFloat(formatUnits(assets, 6)).toFixed(4);
        const formattedShares = parseFloat(formatUnits(shares, 6)).toFixed(4);

        // Get explorer URL based on the chain
        const getExplorerUrl = () => {
            return getBlockExplorerUrl(chainId, 'tx', '');
        };

        // Truncate transaction hash for display
        const truncatedHash = `${transactionHash.substring(0, 6)}...${transactionHash.substring(transactionHash.length - 4)}`;

        // Copy tx hash
        const copyHash = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(transactionHash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        // USDC logo for amount display
        const USDCIcon = (
            <Image
                src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg"
                alt="USDC"
                width={14}
                height={14}
                className="inline-block ml-1"
            />
        );

        // Direction icon with background
        const DirectionIcon = type === 'deposit' ? (
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="h-2.5 w-2.5 text-green-500" />
            </div>
        ) : (
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-2.5 w-2.5 text-red-500" />
            </div>
        );

        return (
            <TooltipProvider>
                <div className="group relative p-3 bg-gradient-to-r from-background to-background/50 rounded-3 hover:from-accent/5 hover:to-accent/10 transition-all duration-300 border border-border/50 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5">
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3 pointer-events-none" />
                    
                    <div className="relative flex items-start justify-between gap-3">
                        {/* Left section */}
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            {DirectionIcon}
                            <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold capitalize ${type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {type}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-4 font-medium whitespace-nowrap bg-green-50 border-green-200 text-green-700">
                                        <CheckCircle2 className="h-2 w-2 mr-0.5 text-green-500" />
                                        CONFIRMED
                                    </Badge>
                                </div>

                                <div className="text-xs text-muted-foreground font-medium">
                                    {blockTimestamp ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-help">
                                                    {format(date, 'MMM dd • HH:mm')}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-card border shadow-lg">
                                                <div className="text-xs">
                                                    <p className="font-medium">{format(date, 'EEEE, MMMM dd, yyyy')}</p>
                                                    <p className="text-muted-foreground">{format(date, 'HH:mm:ss')} ({getUserTimezone()})</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <span>Block #{transaction.blockNumber}</span>
                                    )}
                                </div>

                                {/* Transaction hash and explorer link */}
                                <div className="flex max-sm:flex-wrap items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={copyHash}
                                                className="group/copy text-xs text-orange-500 hover:text-orange-600 active:text-orange-700 flex items-center gap-1 px-2 py-1 rounded-2 hover:bg-orange-50 active:bg-orange-100 transition-all duration-200"
                                            >
                                                <span className="font-mono text-[10px]">{truncatedHash}</span>
                                                {copied ? (
                                                    <CheckCircle2 className="text-green-500 h-2.5 w-2.5 transition-all duration-200" />
                                                ) : (
                                                    <Copy className="h-2.5 w-2.5 group-hover/copy:scale-110 transition-transform duration-200" />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-card">
                                            <p className="text-xs">{copied ? 'Copied!' : 'Copy transaction hash'}</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={`${getExplorerUrl()}${transactionHash}`}
                                                target="_blank"
                                                className="group/link text-xs text-orange-500 hover:text-orange-600 active:text-orange-700 flex items-center gap-1 px-2 py-1 rounded-2 hover:bg-orange-50 active:bg-orange-100 transition-all duration-200"
                                            >
                                                <span className="text-[10px]">Explorer</span>
                                                <LucideExternalLink className="h-2.5 w-2.5 group-hover/link:scale-110 group-hover/link:translate-x-0.5 transition-all duration-200" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-card">
                                            <p className="text-xs">View on block explorer</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>

                        {/* Right section - amounts */}
                        <div className="flex flex-col gap-1.5 items-end">
                            {type === 'deposit' ? (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-2 bg-red-50/70 border border-red-100/70 hover:bg-red-50 hover:border-red-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-red-500 font-medium tabular-nums text-xs">-{formattedAssets}</span>
                                                {USDCIcon}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">USDC sent to vault</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-2 bg-green-50/70 border border-green-100/70 hover:bg-green-50 hover:border-green-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-green-500 font-medium tabular-nums text-xs">+{formattedShares}</span>
                                                <span className="text-[9px] font-medium text-green-600/80 bg-green-100/50 px-1 py-0.5 rounded">
                                                    slUSD
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">Shares received</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            ) : (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-2 bg-red-50/70 border border-red-100/70 hover:bg-red-50 hover:border-red-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-red-500 font-medium tabular-nums text-xs">-{formattedShares}</span>
                                                <span className="text-[9px] font-medium text-red-600/80 bg-red-100/50 px-1 py-0.5 rounded">
                                                    slUSD
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">Shares redeemed</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-2 bg-green-50/70 border border-green-100/70 hover:bg-green-50 hover:border-green-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-green-500 font-medium tabular-nums text-xs">+{formattedAssets}</span>
                                                {USDCIcon}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">USDC received from vault</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-xl p-6 sm:p-8 lg:p-10 my-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading weekly statement...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="w-full bg-white rounded-xl shadow-xl p-6 sm:p-8 lg:p-10 my-8">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Statement</h2>
                    <p className="text-gray-600 mb-4">
                        {error?.message || 'Unable to fetch your weekly statement. Please try again later.'}
                    </p>
                </div>
            </div>
        );
    }

    // No data state
    if (!data) {
        return (
            <div className="w-full bg-white rounded-xl shadow-xl p-6 sm:p-8 lg:p-10 my-8">
                <div className="text-center">
                    <p className="text-lg text-gray-600">No statement data available.</p>
                </div>
            </div>
        );
    }

    return (
        // Outer container for the entire statement page, styled with Tailwind CSS for responsiveness
        // Changed background to match the light blue gradient from the provided UI example
        <Card className="w-full p-6 sm:p-8 lg:p-10 my-8">
            {/* Header Section */}
            <header className="text-center mb-8 pb-6 border-b border-tertiary-charcoal/20">
                {/* Adjusted text color to a darker shade for professionalism */}
                <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Weekly Statement</h1>
                <p className="text-lg text-gray-600">
                    Period: <span className="font-semibold">{formatTimestamp(data.openingBlockTimestamp)}</span> to <span className="font-semibold">{formatTimestamp(data.closingBlockTimestamp)}</span>
                </p>
                <p className="text-md text-gray-600 mt-2">
                    Chain: <span className="text-tertiary-charcoal font-medium">{ChainNameMap[data.chainId as ChainId]}</span>
                </p>
            </header>

            {/* Summary Section */}
            <section className="mb-8">
                {/* Section heading color changed to a more prominent blue from the example */}
                <h2 className="text-2xl font-bold text-gray-800 mb-5">Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Opening Balance */}
                    {/* Background and text colors adjusted to blend with the professional theme */}
                    <div className="relative bg-tertiary-cream/40 p-6 rounded-4 shadow-sm text-center">
                        <p className="text-3xl font-extrabold text-tertiary-navy">${abbreviateNumberWithoutRounding(data.openingBalance)}</p>
                        <h3 className="text-md font-normal text-tertiary-navy/75">Opening Balance</h3>
                    </div>
                    {/* Closing Balance */}
                    <div className="bg-tertiary-cream/40 p-6 rounded-4 shadow-sm text-center">
                        <p className="text-3xl font-extrabold text-tertiary-navy">${abbreviateNumberWithoutRounding(data.closingBalance)}</p>
                        <h3 className="text-md font-normal text-tertiary-navy/75">Closing Balance</h3>
                    </div>
                    {/* Total Earned USD */}
                    {/* Green accent for earnings, similar to the "Low Risk" badge in the example */}
                    <div className="bg-tertiary-lightgreen/40 p-6 rounded-4 shadow-sm text-center">
                        <p className="text-3xl font-extrabold text-tertiary-green">${abbreviateNumberWithoutRounding(data.totalEarnedUsd)}</p>
                        <h3 className="text-md font-normal text-tertiary-green">Total Earned (USD)</h3>
                    </div>
                    {/* Total APR */}
                    {/* Another accent color, perhaps a slightly different blue/purple to differentiate */}
                    <div className="bg-tertiary-cream/40 p-6 rounded-4 shadow-sm text-center">
                        <p className="text-3xl font-extrabold text-tertiary-navy">{abbreviateNumberWithoutRounding(data.totalApr)}%</p>
                        <h3 className="text-md font-normal text-tertiary-navy/75">Total APR</h3>
                    </div>
                </div>
            </section>

            {/* Rewards Section */}
            {((data.rewards) && (data.rewards.length > 0)) && (
                <section className="mb-8">
                    {/* Section heading color changed */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">Rewards Earned</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.rewards.map((reward, index) => (
                            <Card key={index} className="bg-white p-5 rounded-3 hover:shadow-md hover:border-tertiary-charcoal/20 hover:bg-gray-300 flex items-center border border-gray-200 transition-all duration-300">
                                {/* Token Logo */}
                                {reward.token.logoUrl ? (
                                    <img
                                        src={reward.token.logoUrl}
                                        alt={reward.token.name}
                                        className="w-10 h-10 rounded-full mr-4 object-contain flex-shrink-0"
                                    //   onError={(e) => { e.target.src = `https://placehold.co/40x40/4A90E2/FFFFFF?text=${reward.token.symbol ? reward.token.symbol.substring(0,1) : '?'}`; }} // Corrected syntax for template literal
                                    />
                                ) : (
                                    // Placeholder if no logo URL
                                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                                        {reward.token.symbol ? reward.token.symbol.substring(0, 1) : '?'}
                                    </div>
                                )}
                                {/* Reward Details */}
                                <div className="flex-grow">
                                    <h3 className="text-lg font-semibold text-gray-800">{reward.token.name} ({reward.token.symbol})</h3>
                                    <p className="text-gray-600">Value: <span className="font-bold text-green-700">${abbreviateNumberWithoutRounding((reward.amount * reward.priceUsd), 4)} USD</span></p>
                                    <p className="text-gray-600 text-sm">Amount: <strong>{abbreviateNumberWithoutRounding(reward.amount, Math.min(reward.token.decimals, 4))}</strong></p>
                                    <p className="text-gray-600 text-sm">Price per {reward.token.symbol}: <strong>${abbreviateNumberWithoutRounding(reward.priceUsd, 4)} USD</strong></p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Transactions Section */}
            {data.transactions && data.transactions.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">Transactions</h2>
                    <div className="space-y-3">
                        {data.transactions.map((tx, index) => {
                            const transformedTx = transformStatementTransaction(tx);
                            return (
                                <StatementTransactionItem 
                                    key={index} 
                                    transaction={transformedTx} 
                                    chainId={data.chainId}
                                />
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Additional Details Section */}
            <section>
                {/* Section heading color changed */}
                <h2 className="text-2xl font-bold text-gray-800 mb-5">Additional Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Vault Address */}
                    {/* Background and text colors adjusted for detail items */}
                    <Card className="bg-blue-50 p-4 shadow-sm">
                        <BodyText level="body2" weight='medium' className="text-gray-600">
                            Vault Address:
                        </BodyText>
                        <ExternalLink href={getBlockExplorerUrl(data.chainId, 'address', data.vault)} className="font-medium text-sm break-all">
                            {shortenAddress(data.vault)}
                        </ExternalLink>
                    </Card>
                    {/* Base APR */}
                    <Card className="bg-blue-50 p-4 shadow-sm">
                        <BodyText level="body2" weight='medium' className="text-gray-600">
                            Base APR:
                        </BodyText>
                        <BodyText level="body1" weight='semibold' className="text-gray-800">
                            {abbreviateNumberWithoutRounding(data.baseApr, 4)}%
                        </BodyText>
                    </Card>
                    {/* Reward APR */}
                    <Card className="bg-blue-50 p-4 shadow-sm">
                        <BodyText level="body2" weight='medium' className="text-gray-600">
                            Reward APR:
                        </BodyText>
                        <BodyText level="body1" weight='semibold' className="text-gray-800">
                            {abbreviateNumberWithoutRounding(data.rewardApr, 4)}%
                        </BodyText>
                    </Card>
                    {/* Interest Earned USD */}
                    <Card className="bg-blue-50 p-4 shadow-sm">
                        <BodyText level="body2" weight='medium' className="text-gray-600">
                            Interest Earned:
                        </BodyText>
                        <BodyText level="body2" weight='semibold' className="text-gray-800">
                            ${abbreviateNumberWithoutRounding(data.interestEarnedUsd, 4)} USD
                        </BodyText>
                    </Card>
                    {/* Opening Exchange Rate */}
                    <Card className="bg-blue-50 p-4 shadow-sm">
                        <BodyText level="body2" weight='medium' className="text-gray-600">
                            Opening Exchange Rate:
                        </BodyText>
                        <BodyText level="body1" weight='semibold' className="text-gray-800">
                            {abbreviateNumberWithoutRounding(data.openingExchangeRate, 6)}
                        </BodyText>
                    </Card>
                    {/* Closing Exchange Rate */}
                    <Card className="bg-blue-50 p-4 shadow-sm">
                        <BodyText level="body2" weight='medium' className="text-gray-600">
                            Closing Exchange Rate:
                        </BodyText>
                        <BodyText level="body1" weight='semibold' className="text-gray-800">
                            {abbreviateNumberWithoutRounding(data.closingExchangeRate, 6)}
                        </BodyText>
                    </Card>
                </div>
            </section>
        </Card>
    );
}

export default Statements;
