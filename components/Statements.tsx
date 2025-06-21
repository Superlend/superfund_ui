import React from 'react';
import useUserStatements from '@/hooks/useUserStatements';
import { Card } from './ui/card';
import ExternalLink from './ExternalLink';
import { BodyText } from './ui/typography';
import { abbreviateNumberWithoutRounding, getBlockExplorerUrl } from '@/lib/utils';
import { ChainId, ChainNameMap } from '@/types/chain';

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
    const { data, isLoading, isError, error } = useUserStatements({
        userAddress,
        vaultAddress,
        chainId,
    });

    // Helper function to format Unix timestamps into a readable date string
    const formatTimestamp = (timestamp: string) => {
        return new Date(parseInt(timestamp)).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Helper function to shorten blockchain addresses for better readability
    const shortenAddress = (address: string) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

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
            {data.rewards.length > 0 && (
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
