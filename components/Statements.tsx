import React from 'react';
import useUserStatements from '@/hooks/useUserStatements';
import { Card } from './ui/card';
import ExternalLink from './ExternalLink';
import { BodyText } from './ui/typography';
import { abbreviateNumberWithoutRounding, getBlockExplorerUrl } from '@/lib/utils';
import { ChainId, ChainNameMap } from '@/types/chain';
import { format, isToday, isYesterday } from 'date-fns';
import { formatUnits } from 'ethers/lib/utils';
import { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink as LucideExternalLink, Copy, ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft, CheckCircle2, Calendar, ChevronLeft, CalendarIcon, CalendarRange, ChevronDown, ArrowDownLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook';
import useGetUsdcExchangeRate from '@/hooks/useGetUsdcExchangeRate';
import { VAULT_ADDRESS_MAP } from '@/lib/constants';

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
    // Statement selection state
    const [selectedStatementIndex, setSelectedStatementIndex] = useState(0);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(5);

    // Reset to page 1 when key parameters change
    useEffect(() => {
        setCurrentPage(1);
    }, [userAddress, vaultAddress, chainId]);

    // Reset selected statement when key parameters change
    useEffect(() => {
        setSelectedStatementIndex(0);
    }, [userAddress, vaultAddress, chainId]);

    const { data: response, isLoading, isError, error } = useUserStatements({
        userAddress,
        vaultAddress,
        chainId,
    });

    // Get fallback USDC price from vault hook
    const { usdcPrice } = useVaultHook();

    // Safeguard: if selectedStatementIndex is out of bounds, reset to 0
    useEffect(() => {
        if (response && selectedStatementIndex >= response.length) {
            setSelectedStatementIndex(0);
        }
    }, [response, selectedStatementIndex]);

    const data = response?.[selectedStatementIndex]

    // Helper function to format Unix timestamps into a readable date string
    const formatTimestamp = (timestamp: string) => {
        return new Date(parseInt(timestamp)).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Helper function to format date range for dropdown options
    const formatDateRange = (openingTimestamp: string, closingTimestamp: string) => {
        const startDate = new Date(parseInt(openingTimestamp));
        const endDate = new Date(parseInt(closingTimestamp));

        const startFormatted = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const endFormatted = endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `${startFormatted} - ${endFormatted}`;
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
    // Helper function to convert decimal string to wei-like format without precision loss
    const parseDecimalToWei = (decimalStr: string, decimals: number = 6): string => {
        if (!decimalStr || decimalStr === '0') return '0';
        
        // Remove any whitespace
        const cleanStr = decimalStr.trim();
        
        // Split by decimal point
        const [integerPart = '0', fractionalPart = ''] = cleanStr.split('.');
        
        // Pad or truncate fractional part to exactly `decimals` places
        const paddedFractional = fractionalPart.padEnd(decimals, '0').substring(0, decimals);
        
        // Combine and convert to number string
        const weiValue = integerPart + paddedFractional;
        
        // Remove leading zeros but keep at least one digit
        return weiValue.replace(/^0+/, '') || '0';
    };

    const transformStatementTransaction = (tx: any) => {
        return {
            type: tx.type,
            assets: parseDecimalToWei(tx.tokenAmount, 6), // Convert to Wei format without precision loss
            shares: parseDecimalToWei(tx.shareAmount, 6), // Convert to Wei format without precision loss
            blockTimestamp: convertBlockNumberToTimestamp(tx.blockNumber),
            transactionHash: tx.txHash,
            blockNumber: tx.blockNumber,
            from: tx.from,
            to: tx.to
        };
    };

    // Client-side pagination logic
    const allTransactions = data?.transactions || [];
    const totalTransactions = allTransactions.length;
    const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const currentTransactions = allTransactions.slice(startIndex, endIndex);

    // Extract unique block numbers from current page transactions for exchange rate API
    const uniqueBlockNumbers = React.useMemo(() => {
        const blockNumbers = currentTransactions.map(tx => tx.blockNumber?.toString()).filter(Boolean);
        return blockNumbers.filter((blockNumber, index) => blockNumbers.indexOf(blockNumber) === index);
    }, [currentTransactions]);

    // Get block-specific exchange rates with fallback to live USDC price
    const { 
        getExchangeRateForBlock, 
        isLoading: isLoadingExchangeRates,
        isUsingFallback 
    } = useGetUsdcExchangeRate({
        vaultAddress: VAULT_ADDRESS_MAP[chainId as keyof typeof VAULT_ADDRESS_MAP] || vaultAddress,
        chainId: chainId,
        blockNumbers: uniqueBlockNumbers,
        fallbackUsdcPrice: usdcPrice,
        enabled: !!vaultAddress && !!chainId && uniqueBlockNumbers.length > 0
    });

    // Pagination state
    const hasMorePages = currentPage < totalPages;
    const isLastPage = currentPage >= totalPages;

    // Debug log
    console.log('Client-side Pagination Debug:', {
        totalTransactions,
        currentPage,
        totalPages,
        startIndex,
        endIndex: Math.min(endIndex, totalTransactions),
        currentTransactionsShown: currentTransactions.length
    });

    // Pagination handlers
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPreviousPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);

    // Pagination component for client-side pagination
    function PaginationControls() {
        // Don't show pagination if no transactions or only one page
        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pageNumbers = [];
            const maxPagesToShow = 5;

            if (totalPages <= maxPagesToShow) {
                for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                const startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(i);
                }
            }

            return pageNumbers;
        };

        return (
            <div className="flex flex-col lg:flex-row items-center justify-between max-lg:gap-8 mt-6 pt-4 border-t border-gray-200">
                {/* Left side - Page info */}
                <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions} transactions
                </div>

                {/* Center - Page numbers and navigation */}
                <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1 || isLoading}
                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-800 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:block">Previous</span>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                disabled={isLoading}
                                className={`px-3 py-1 text-sm font-medium transition-colors rounded-full duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${pageNum === currentPage
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'text-gray-700'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>

                    {/* Next button */}
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage >= totalPages || isLoading}
                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-800 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <span className="hidden sm:block">Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Right side - Go to page input */}
                {/* <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Go to:</span>
                    <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        disabled={isLoading}
                        onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (!isNaN(page) && page >= 1) {
                                goToPage(page);
                            }
                        }}
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div> */}
            </div>
        );
    }

    // Extracted TransactionItem component for statements
    function StatementTransactionItem({ 
        transaction, 
        chainId, 
        getExchangeRateForBlock 
    }: { 
        transaction: any; 
        chainId: number;
        getExchangeRateForBlock?: (blockNumber: string) => number;
    }) {
        const { type, assets, shares, blockTimestamp, transactionHash, from, to, blockNumber } = transaction;
        const date = convertTimestampToLocalDate(blockTimestamp);
        const [copied, setCopied] = useState(false);

        const formattedAssets = abbreviateNumberWithoutRounding(Number(formatUnits(assets, 6)));
        const formattedShares = abbreviateNumberWithoutRounding(Number(formatUnits(shares, 6)));
        
        // Get block-specific exchange rate or fallback to 1:1 ratio
        const blockSpecificExchangeRate = getExchangeRateForBlock && blockNumber
            ? getExchangeRateForBlock(blockNumber.toString())
            : 1;
        
        const formattedUsdcTransferAmount = abbreviateNumberWithoutRounding(Number(formatUnits(shares, 6)) * blockSpecificExchangeRate, 4)

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
        ) : type === 'transfer-received' ? (
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="h-2.5 w-2.5 text-green-500" />
            </div>
        ) : type === 'transfer-sent' ? (
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="h-2.5 w-2.5 text-red-500" />
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
                                    <span className={`text-sm font-semibold capitalize ${type === 'deposit' || type === 'transfer-received' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {type.startsWith('transfer') ? 'Transfer' : type}
                                    </span>
                                    <Badge variant="outline" className="hidden md:flex gap-0.5 text-[9px] px-1.5 py-0.5 h-4 font-medium whitespace-nowrap bg-green-50 border-green-200 text-green-700">
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
                            ) : type === 'transfer-sent' ? (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-2 bg-red-50/70 border border-red-100/70 hover:bg-red-50 hover:border-red-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-red-500 font-medium tabular-nums text-xs">-{formattedUsdcTransferAmount}</span>
                                                {USDCIcon}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">USDC sent</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-1.5 py-1 rounded-2 bg-orange-50/70 border border-orange-100/70 hover:bg-orange-50 hover:border-orange-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-orange-600 font-mono text-[10px]">To: {shortenAddress(to)}</span>
                                                {/* <Link
                                                    href={`${getExplorerUrl()}${transactionHash}`}
                                                    target="_blank"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <LucideExternalLink className="h-2 w-2 text-orange-500 hover:text-orange-600" />
                                                </Link> */}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">Recipient address: {to}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            ) : type === 'transfer-received' ? (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-2 bg-green-50/70 border border-green-100/70 hover:bg-green-50 hover:border-green-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-green-500 font-medium tabular-nums text-xs">+{formattedUsdcTransferAmount}</span>
                                                {USDCIcon}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">USDC received</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-1.5 py-1 rounded-2 bg-blue-50/70 border border-blue-100/70 hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200 cursor-pointer">
                                                <span className="text-blue-600 font-mono text-[10px]">From: {shortenAddress(from)}</span>
                                                {/* <Link
                                                    href={`${getExplorerUrl()}${transactionHash}`}
                                                    target="_blank"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <LucideExternalLink className="h-2 w-2 text-blue-500 hover:text-blue-600" />
                                                </Link> */}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-card border shadow-lg">
                                            <p className="text-xs font-medium">Sender address: {from}</p>
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
                <div className="flex items-center gap-2 w-fit mx-auto">
                    <p className="text-lg text-gray-600">
                        Period: <span className="font-semibold">{formatTimestamp(data.openingBlockTimestamp)}</span> to <span className="font-semibold">{formatTimestamp(data.closingBlockTimestamp)}</span>
                    </p>
                    {(response && (response.length > 1)) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type='button'>
                                    <CalendarRange className="w-4 h-4 text-secondary-500 hover:text-secondary-500/80" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-64 rounded-4 overflow-hidden p-0 divide-y divide-tertiary-charcoal/10">
                                {response.map((statement, index) => (
                                    <DropdownMenuItem
                                        key={index}
                                        onClick={() => setSelectedStatementIndex(index)}
                                        className={`cursor-pointer hover:bg-tertiary-charcoal/5 py-2 px-4`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-sm">
                                                {formatDateRange(statement.openingBlockTimestamp, statement.closingBlockTimestamp)}
                                            </span>
                                        </div>
                                        {index === selectedStatementIndex && (
                                            <CheckCircle2 className="h-5 w-5 fill-secondary-500 text-white" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
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
            {allTransactions.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">Transactions</h2>

                    {/* Top pagination controls */}
                    {/* <PaginationControls /> */}

                    {/* Exchange rate status indicator */}
                    {isUsingFallback && currentTransactions.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-3 border border-amber-200 w-fit">
                                Using estimated exchange rates for transaction amounts
                            </p>
                        </div>
                    )}

                    {/* Transaction list */}
                    <div className="space-y-3 my-6">
                        {isLoading || isLoadingExchangeRates ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-sm text-gray-500">
                                    {isLoading ? 'Loading transactions...' : 'Loading exchange rates...'}
                                </p>
                            </div>
                        ) : currentTransactions.length > 0 ? (
                            currentTransactions.map((tx, index) => {
                                const transformedTx = transformStatementTransaction(tx);
                                return (
                                    <StatementTransactionItem
                                        key={startIndex + index}
                                        transaction={transformedTx}
                                        chainId={data.chainId}
                                        getExchangeRateForBlock={getExchangeRateForBlock}
                                    />
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No transactions found for this page.</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom pagination controls */}
                    <PaginationControls />
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
