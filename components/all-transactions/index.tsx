'use client'

import React, { useEffect, useState } from 'react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useChain } from '@/context/chain-context'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isYesterday, parseISO, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import Link from 'next/link'
import { formatUnits } from 'ethers/lib/utils'
import { ExternalLink, ArrowUpRight, ArrowDownRight, ArrowLeft, ArrowRight, CheckCircle2, Copy, Filter, Calendar as CalendarIcon, CalendarRange, X, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ArrowDownLeft } from 'lucide-react'
import { ChainId } from '@/types/chain'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import useTransactionHistory from '@/hooks/useTransactionHistory'
import { Transaction } from '@/queries/transaction-history-api'
import { useActiveAccount } from "thirdweb/react"
import useDimensions from '@/hooks/useDimensions'
import { useVaultHook } from '@/hooks/vault_hooks/vaultHook'
import { abbreviateNumberWithoutRounding } from '@/lib/utils'
import useGetUsdcExchangeRate from '@/hooks/useGetUsdcExchangeRate'
import { VAULT_ADDRESS_MAP } from '@/lib/constants'
import { TTxContext, useTxContext } from '@/context/super-vault-tx-provider'

interface AllTransactionsProps {
  protocolIdentifier?: string // Optional if we want to pass it directly
}

type FilterType = 'all' | 'deposit' | 'withdraw' | 'transfer'

interface DateRange {
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string   // ISO date string (YYYY-MM-DD)
}

// Helper function to convert Unix timestamp to user's local timezone
const convertTimestampToLocalDate = (timestamp: string): Date => {
  // Convert string timestamp to number and multiply by 1000 for milliseconds
  const timestampMs = parseInt(timestamp) * 1000;

  // Create date object which automatically uses user's local timezone
  const date = new Date(timestampMs);

  // Debug log to help identify timestamp issues
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('All-transactions timestamp conversion:', {
  //     originalTimestamp: timestamp,
  //     timestampMs,
  //     localDate: date.toLocaleString(),
  //     utcDate: date.toUTCString(),
  //     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  //   });
  // }

  return date;
};

// Helper function to get user's timezone for display
const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

// Helper function to check if transaction falls within date range
const isTransactionInDateRange = (transaction: Transaction, dateRange: DateRange | null): boolean => {
  if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) return true;

  const transactionDate = convertTimestampToLocalDate(transaction.blockTimestamp);
  const transactionDayStart = startOfDay(transactionDate);

  // If only start date is provided
  if (dateRange.startDate && !dateRange.endDate) {
    const startDate = startOfDay(new Date(dateRange.startDate));
    return isAfter(transactionDayStart, startDate) || transactionDayStart.getTime() === startDate.getTime();
  }

  // If only end date is provided
  if (!dateRange.startDate && dateRange.endDate) {
    const endDate = endOfDay(new Date(dateRange.endDate));
    return isBefore(transactionDayStart, endDate) || transactionDayStart.getTime() === startOfDay(endDate).getTime();
  }

  // If both dates are provided
  if (dateRange.startDate && dateRange.endDate) {
    const startDate = startOfDay(new Date(dateRange.startDate));
    const endDate = endOfDay(new Date(dateRange.endDate));

    return (isAfter(transactionDayStart, startDate) || transactionDayStart.getTime() === startDate.getTime()) &&
      (isBefore(transactionDayStart, endDate) || transactionDayStart.getTime() === startOfDay(endDate).getTime());
  }

  return true;
};

export default function AllTransactions({ protocolIdentifier }: AllTransactionsProps) {
  // const { walletAddress, isWalletConnected } = useWalletConnection()
  const { depositTxCompleted, withdrawTxCompleted } = useTxContext() as TTxContext
  const account = useActiveAccount();
  const walletAddress = account?.address as `0x${string}`
  const isWalletConnected = !!account
  const { selectedChain, chainDetails } = useChain()
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // Default descending
  const { width } = useDimensions()
  const isDesktop = width > 768;

  // Pagination state
  const [itemsToShow, setItemsToShow] = useState(10)

  // Get protocol identifier from chain context if not provided
  const getProtocolIdentifier = () => {
    if (protocolIdentifier) return protocolIdentifier
    if (!selectedChain) return ''
    return chainDetails[selectedChain as keyof typeof chainDetails]?.contractAddress || ''
  }

  // Use the custom hook instead of direct fetch and local state
  const protocolId = getProtocolIdentifier()
  const { data: { transactions }, isLoading, refetch: refetchTransactionHistory } = useTransactionHistory({
    protocolIdentifier: protocolId,
    chainId: selectedChain || 0,
    walletAddress: walletAddress || '',
    refetchOnTransaction: true
  })

  // Get vault address for exchange rate API
  const vaultAddress = VAULT_ADDRESS_MAP[selectedChain as keyof typeof VAULT_ADDRESS_MAP]
  
  // Get fallback USDC price from vault hook
  const { usdcPrice } = useVaultHook()

  // Calculate date bounds from transaction history
  const getDateBounds = () => {
    if (transactions.length === 0) return { minDate: null, maxDate: null }

    const dates = transactions.map(tx => convertTimestampToLocalDate(tx.blockTimestamp))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    return {
      minDate: format(minDate, 'yyyy-MM-dd'),
      maxDate: format(maxDate, 'yyyy-MM-dd')
    }
  }

  const { minDate, maxDate } = getDateBounds()

  useEffect(() => {
    if (depositTxCompleted || withdrawTxCompleted) {
      refetchTransactionHistory();
    }
  }, [depositTxCompleted, withdrawTxCompleted]);

  // Filter and sort transactions by type and date range
  const filteredAndSortedTransactions = React.useMemo(() => {
    // First filter transactions
    const filtered = transactions.filter(tx => {
      // Filter out edge case transfers (self-transfers and unknown transfers)
      if (tx.type === 'transfer') {
        const isReceived = tx.to?.toLowerCase() === walletAddress?.toLowerCase()
        const isSent = tx.from?.toLowerCase() === walletAddress?.toLowerCase()
        
        // Only show transfers that have a clear direction (either received OR sent, not both or neither)
        const hasValidDirection = (isReceived && !isSent) || (!isReceived && isSent)
        if (!hasValidDirection) return false
      }

      // Filter by type
      const typeMatch = currentFilter === 'all' || tx.type === currentFilter;

      // Filter by date range
      const dateMatch = isTransactionInDateRange(tx, dateRange);

      return typeMatch && dateMatch;
    });

    // Then sort based on current sort order
    const sorted = [...filtered].sort((a, b) => {
      const dateA = convertTimestampToLocalDate(a.blockTimestamp);
      const dateB = convertTimestampToLocalDate(b.blockTimestamp);

      if (sortOrder === 'asc') {
        return dateA.getTime() - dateB.getTime(); // Ascending (earliest first)
      } else {
        return dateB.getTime() - dateA.getTime(); // Descending (latest first)
      }
    });

    return sorted;
  }, [transactions, currentFilter, dateRange, sortOrder, walletAddress])

  // Extract unique block numbers from filtered transactions for exchange rate API
  const uniqueBlockNumbers = React.useMemo(() => {
    const blockNumbers = filteredAndSortedTransactions.map(tx => tx.blockNumber)
    return blockNumbers.filter((blockNumber, index) => blockNumbers.indexOf(blockNumber) === index)
  }, [filteredAndSortedTransactions])

  // Get block-specific exchange rates with fallback to live USDC price
  const { 
    getExchangeRateForBlock, 
    isLoading: isLoadingExchangeRates,
    isUsingFallback 
  } = useGetUsdcExchangeRate({
    vaultAddress,
    chainId: selectedChain || 0,
    blockNumbers: uniqueBlockNumbers,
    fallbackUsdcPrice: usdcPrice,
    enabled: !!vaultAddress && !!selectedChain && uniqueBlockNumbers.length > 0
  })

  // Reset pagination when filter changes
  useEffect(() => {
    setItemsToShow(10)
  }, [currentFilter, dateRange])

  // Group transactions by month and date with improved timezone handling and pagination
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: { transactions: Transaction[], sortIndex: number } } = {}

    // Limit transactions based on itemsToShow
    const transactionsToShow = filteredAndSortedTransactions.slice(0, itemsToShow)

    transactionsToShow.forEach(tx => {
      const date = convertTimestampToLocalDate(tx.blockTimestamp);
      let dateKey = ''
      let sortIndex = 0 // Used to sort groups properly

      if (isToday(date)) {
        dateKey = 'Today'
        sortIndex = 0
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
        sortIndex = 1
      } else if (differenceInDays(new Date(), date) < 7) {
        // Show day name for transactions within the last week
        dateKey = format(date, 'EEEE') // Monday, Tuesday, etc.
        sortIndex = differenceInDays(new Date(), date)
      } else {
        dateKey = format(date, 'MMM dd, yyyy')
        sortIndex = differenceInDays(new Date(), date)
      }

      if (!groups[dateKey]) {
        groups[dateKey] = { transactions: [], sortIndex }
      }

      groups[dateKey].transactions.push(tx)
    })

    // Sort groups based on sort order
    const sortedGroups = Object.entries(groups).sort(([, a], [, b]) => {
      if (sortOrder === 'asc') {
        return b.sortIndex - a.sortIndex // Reverse for ascending (oldest first)
      } else {
        return a.sortIndex - b.sortIndex // Normal for descending (newest first)
      }
    })

    // Convert back to the expected format
    const finalGroups: { [key: string]: Transaction[] } = {}
    sortedGroups.forEach(([dateKey, { transactions }]) => {
      finalGroups[dateKey] = transactions
    })

    return finalGroups
  }

  const groupedTransactions = groupTransactionsByDate()

  // Check if there are more transactions to show
  const hasMoreTransactions = filteredAndSortedTransactions.length > itemsToShow
  const displayedTransactionCount = Math.min(itemsToShow, filteredAndSortedTransactions.length)

  // Handle filter changes with pagination reset
  const handleFilterChange = (newFilter: FilterType) => {
    setCurrentFilter(newFilter)
    // itemsToShow will be reset by the useEffect
  }

  // Handle date range changes - apply immediately 
  const handleDateRangeChange = (newDateRange: DateRange | null) => {
    setDateRange(newDateRange)

    // Auto-adjust sort order: ascending when date filter is active, descending when no filter
    const hasDateFilter = newDateRange && (newDateRange.startDate || newDateRange.endDate)
    setSortOrder(hasDateFilter ? 'asc' : 'desc')
  }

  // Handle individual date changes - immediate filtering
  const handleStartDateChange = (startDate: string) => {
    const newDateRange = {
      startDate,
      endDate: dateRange?.endDate || ''
    }
    handleDateRangeChange(newDateRange)
  }

  const handleEndDateChange = (endDate: string) => {
    const newDateRange = {
      startDate: dateRange?.startDate || '',
      endDate
    }
    handleDateRangeChange(newDateRange)
  }

  // Clear date range filter
  const clearDateRange = () => {
    handleDateRangeChange(null)
  }

  // Toggle sort order manually
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  // Check if sort order has changed from default (due to date filter)
  const hasDateFilter = dateRange && (dateRange.startDate || dateRange.endDate)
  const isSortChanged = hasDateFilter || sortOrder !== 'desc'

  // Check if any filters are active
  const hasActiveFilters = currentFilter !== 'all' || dateRange

  if (!isWalletConnected) {
    return (
      <div className="bg-card rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground">
        <p>Please connect your wallet to view your transactions</p>
      </div>
    )
  }

  const hasTransactions = transactions.length > 0

  return (
    <TooltipProvider>
      <div className="bg-card rounded-2xl p-4 sm:p-6 flex flex-col">
        {hasTransactions && (
          <div className="flex flex-wrap justify-between gap-4 mb-6">
            {/* Header */}
            <div className="flex justify-between items-start md:items-center gap-4 md:gap-0 max-lg:w-full">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Your Transactions
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasMoreTransactions ? (
                    <>Showing {displayedTransactionCount} of {filteredAndSortedTransactions.length} {filteredAndSortedTransactions.length === 1 ? 'transaction' : 'transactions'}</>
                  ) : (
                    <>{filteredAndSortedTransactions.length} {filteredAndSortedTransactions.length === 1 ? 'transaction' : 'transactions'}</>
                  )}
                </p>
                {/* Exchange rate status indicator */}
                {isUsingFallback && filteredAndSortedTransactions.length > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-2 border border-amber-200 w-fit">
                    Using estimated exchange rates
                  </p>
                )}
                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-muted-foreground">
                    Timezone: {getUserTimezone()}
                  </p>
                )}
              </div>

              {/* Mobile Filter Dropdown */}
              {!isDesktop &&
                <div className="">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 border-dashed hover:border-solid transition-all duration-200 hover:shadow-sm"
                      >
                        <Filter className="h-4 w-4" />
                        {hasActiveFilters && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-1" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-3 rounded-4">
                      <div className="space-y-4">
                        {/* Type Filter Section */}
                        <div>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Transaction Type
                          </div>
                          <div className="space-y-1">
                            <DropdownMenuItem
                              onClick={() => handleFilterChange('all')}
                              className={`relative rounded-3 cursor-pointer transition-all duration-200 overflow-hidden ${currentFilter === 'all' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-accent/50'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full bg-blue-500 transition-all duration-200 ${currentFilter === 'all' ? 'scale-125' : 'scale-100'
                                    }`}></div>
                                  <span>All Transactions</span>
                                </div>
                                {currentFilter === 'all' && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFilterChange('deposit')}
                              className={`relative rounded-3 cursor-pointer transition-all duration-200 overflow-hidden ${currentFilter === 'deposit' ? 'bg-green-50 text-green-700 border border-green-200' : 'hover:bg-accent/50'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full bg-green-500 transition-all duration-200 ${currentFilter === 'deposit' ? 'scale-125' : 'scale-100'
                                    }`}></div>
                                  <span>Deposits Only</span>
                                </div>
                                {currentFilter === 'deposit' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFilterChange('withdraw')}
                              className={`relative rounded-3 cursor-pointer transition-all duration-200 overflow-hidden ${currentFilter === 'withdraw' ? 'bg-red-50 text-red-700 border border-red-200' : 'hover:bg-accent/50'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full bg-red-500 transition-all duration-200 ${currentFilter === 'withdraw' ? 'scale-125' : 'scale-100'
                                    }`}></div>
                                  <span>Withdrawals Only</span>
                                </div>
                                {currentFilter === 'withdraw' && (
                                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFilterChange('transfer')}
                              className={`relative rounded-3 cursor-pointer transition-all duration-200 overflow-hidden ${currentFilter === 'transfer' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'hover:bg-accent/50'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full bg-purple-500 transition-all duration-200 ${currentFilter === 'transfer' ? 'scale-125' : 'scale-100'
                                    }`}></div>
                                  <span>Transfers Only</span>
                                </div>
                                {currentFilter === 'transfer' && (
                                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                                )}
                              </div>
                            </DropdownMenuItem>
                          </div>
                        </div>

                        <DropdownMenuSeparator />

                        {/* Date Range Filter Section */}
                        <div>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Date Range
                          </div>
                          <DateRangePicker
                            dateRange={dateRange}
                            onStartDateChange={handleStartDateChange}
                            onEndDateChange={handleEndDateChange}
                            onClear={clearDateRange}
                            minDate={minDate}
                            maxDate={maxDate}
                            isMobile={true}
                          />

                          {/* Sort Toggle for Mobile */}
                          {isSortChanged && (
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/30">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {sortOrder === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}
                                <span>
                                  {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleSortOrder}
                                className="h-7 px-2 text-xs"
                              >
                                Switch to {sortOrder === 'asc' ? 'newest' : 'oldest'} first
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>}
            </div>

            {/* Desktop Filters */}
            {isDesktop &&
              <div className="flex items-center gap-4 flex-wrap">
                {/* Type Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-4 border">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 overflow-hidden min-w-[60px] ${currentFilter === 'all'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className={`absolute inset-0 bg-blue-500 rounded-3 transition-all duration-300 ease-out ${currentFilter === 'all'
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                      }`} />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-blue-500 transition-all duration-500 ease-out ${currentFilter === 'all'
                        ? 'scale-0 opacity-0 hidden'
                        : 'scale-100 opacity-100'
                        }`} />
                      <span>All</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleFilterChange('deposit')}
                    className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 overflow-hidden min-w-[80px] ${currentFilter === 'deposit'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className={`absolute inset-0 bg-green-500 rounded-3 transition-all duration-300 ease-out ${currentFilter === 'deposit'
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                      }`} />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-green-500 transition-all duration-500 ease-out ${currentFilter === 'deposit'
                        ? 'scale-0 opacity-0 hidden'
                        : 'scale-100 opacity-100'
                        }`} />
                      <span>Deposits</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleFilterChange('withdraw')}
                    className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 overflow-hidden min-w-[100px] ${currentFilter === 'withdraw'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className={`absolute inset-0 bg-red-500 rounded-3 transition-all duration-300 ease-out ${currentFilter === 'withdraw'
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                      }`} />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-red-500 transition-all duration-500 ease-out ${currentFilter === 'withdraw'
                        ? 'scale-0 opacity-0 hidden'
                        : 'scale-100 opacity-100'
                        }`} />
                      <span>Withdrawals</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleFilterChange('transfer')}
                    className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 overflow-hidden min-w-[90px] ${currentFilter === 'transfer'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className={`absolute inset-0 bg-purple-500 rounded-3 transition-all duration-300 ease-out ${currentFilter === 'transfer'
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                      }`} />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-purple-500 transition-all duration-500 ease-out ${currentFilter === 'transfer'
                        ? 'scale-0 opacity-0 hidden'
                        : 'scale-100 opacity-100'
                        }`} />
                      <span>Transfers</span>
                    </div>
                  </button>
                </div>

                {/* Date Range Picker */}
                <div className="flex items-center gap-2">
                  <DateRangePicker
                    dateRange={dateRange}
                    onStartDateChange={handleStartDateChange}
                    onEndDateChange={handleEndDateChange}
                    onClear={clearDateRange}
                    minDate={minDate}
                    maxDate={maxDate}
                    isMobile={false}
                  />

                  {/* Sort Toggle Button */}
                  {isSortChanged && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSortOrder}
                          className="h-9 px-3 border-dashed hover:border-solid transition-all duration-200 hover:shadow-sm"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-card border shadow-lg">
                        <div className="text-xs">
                          <p className="font-medium">
                            {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
                          </p>
                          <p className="text-muted-foreground">
                            Click to sort by {sortOrder === 'asc' ? 'newest' : 'oldest'} first
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Clear All Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentFilter('all')
                      clearDateRange()
                      setSortOrder('desc') // Reset to default sort
                    }}
                    className="text-muted-foreground hover:text-foreground p-0"
                  >
                    Clear filters
                    <X className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            }
          </div>
        )}

        <div className="space-y-6">
          {isLoading || isLoadingExchangeRates ? (
            <TransactionSkeleton count={5} />
          ) : transactions.length === 0 ? (
            <EmptyTransactionsState />
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mb-6 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Filter className="w-8 h-8 text-accent" />
                </div>
                <p className="text-lg font-semibold mb-2">No transactions found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 hover:shadow-md transition-all duration-200"
                onClick={() => {
                  setCurrentFilter('all')
                  clearDateRange()
                  setSortOrder('desc') // Reset to default sort
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              {Object.entries(groupedTransactions).map(([dateGroup, txs]) => (
                <div key={dateGroup} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground bg-gradient-to-r from-accent/10 to-accent/5 py-2 px-4 rounded-3 border border-accent/20">
                      <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                      {dateGroup}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                    <Badge variant="outline" className="text-[10px] px-2 py-1 font-medium">
                      {txs.length} {txs.length === 1 ? 'transaction' : 'transactions'}
                    </Badge>
                  </div>
                  <div className="space-y-3 pl-2">
                    {txs.map(tx => (
                      <TransactionItem 
                        key={tx.transactionHash} 
                        transaction={tx} 
                        expanded={true} 
                        walletAddress={walletAddress}
                        getExchangeRateForBlock={getExchangeRateForBlock}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Show More section */}
              {hasMoreTransactions && (
                <div className="flex flex-col items-center gap-4 pt-6 border-t border-border/30">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Showing {displayedTransactionCount} of {filteredAndSortedTransactions.length} transactions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filteredAndSortedTransactions.length - displayedTransactionCount} more available
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setItemsToShow(prev => Math.min(prev + 10, filteredAndSortedTransactions.length))}
                      className="flex-1 sm:flex-none hover:shadow-md transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                    >
                      Show 10 more
                      <ArrowDownRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setItemsToShow(filteredAndSortedTransactions.length)}
                      className="flex-1 sm:flex-none text-primary hover:text-primary/80 hover:bg-primary/5"
                    >
                      Show all {filteredAndSortedTransactions.length}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Shadcn Date Picker Component (following official documentation pattern)
function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  className = "",
  side = "bottom",
  disabled = false
}: {
  date: string
  onDateChange: (date: string) => void
  placeholder?: string
  minDate?: string | null
  maxDate?: string | null
  className?: string
  side?: "top" | "bottom" | "left" | "right"
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  // Convert string date to Date object for Calendar component
  const selectedDate = date ? new Date(date) : undefined

  // Create disabled function for Calendar
  const isDateDisabled = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')

    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true

    return false
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const isoDate = format(selectedDate, 'yyyy-MM-dd')
      onDateChange(isoDate)
    } else {
      onDateChange('')
    }
    setOpen(false)
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 text-xs",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {selectedDate ? format(selectedDate, "MMM dd, yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side={side}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Date Range Picker Component
function DateRangePicker({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  onClear,
  minDate,
  maxDate,
  isMobile = false
}: {
  dateRange: DateRange | null
  onStartDateChange: (startDate: string) => void
  onEndDateChange: (endDate: string) => void
  onClear: () => void
  minDate?: string | null
  maxDate?: string | null
  isMobile?: boolean
}) {
  const hasDateRange = dateRange && (dateRange.startDate || dateRange.endDate)

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <DatePicker
              date={dateRange?.startDate || ''}
              onDateChange={onStartDateChange}
              placeholder="Start date"
              minDate={minDate}
              maxDate={dateRange?.endDate || maxDate}
              side="bottom"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <DatePicker
              date={dateRange?.endDate || ''}
              onDateChange={onEndDateChange}
              placeholder="End date"
              minDate={dateRange?.startDate || minDate}
              maxDate={maxDate}
              side="bottom"
              disabled={!dateRange?.startDate}
            />
          </div>
        </div>
        {/* {hasDateRange && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 text-xs px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )} */}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-4 border">
      <div className="flex items-center gap-1">
        {/* <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" /> */}
        <DatePicker
          date={dateRange?.startDate || ''}
          onDateChange={onStartDateChange}
          placeholder="Start date"
          minDate={minDate}
          maxDate={dateRange?.endDate || maxDate}
          className="w-36"
          side="bottom"
        />
        <span className="text-xs text-muted-foreground px-1">to</span>
        <DatePicker
          date={dateRange?.endDate || ''}
          onDateChange={onEndDateChange}
          placeholder="End date"
          minDate={dateRange?.startDate || minDate}
          maxDate={maxDate}
          className="w-36"
          side="bottom"
          disabled={!dateRange?.startDate}
        />
      </div>
      {/* {hasDateRange && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0 hover:bg-muted/80"
        >
          <X className="h-3 w-3" />
        </Button>
      )} */}
    </div>
  )
}

function TransactionItem({ 
  transaction, 
  expanded = false, 
  walletAddress,
  getExchangeRateForBlock
}: { 
  transaction: Transaction
  expanded?: boolean
  walletAddress: string
  getExchangeRateForBlock?: (blockNumber: string) => number
}) {
  const { type, assets, shares, blockNumber, blockTimestamp, transactionHash, from, to } = transaction
  const date = convertTimestampToLocalDate(blockTimestamp);
  const { selectedChain, chainDetails } = useChain()
  const [copied, setCopied] = useState(false)

  // Format the asset amount (using 1e6 decimals as specified)
  const formattedAssets = abbreviateNumberWithoutRounding(parseFloat(formatUnits(assets, 6)))
  const formattedShares = abbreviateNumberWithoutRounding(parseFloat(formatUnits(shares, 6)))
  
  // Get block-specific exchange rate or fallback to 1:1 ratio
  const blockSpecificExchangeRate = getExchangeRateForBlock 
    ? getExchangeRateForBlock(blockNumber)
    : 1
  
  const formattedUsdcTransferAmount = abbreviateNumberWithoutRounding(Number(formattedShares) * blockSpecificExchangeRate)

  // Transfer direction logic
  const isTransferReceived = type === 'transfer' && to?.toLowerCase() === walletAddress?.toLowerCase()
  const isTransferSent = type === 'transfer' && from?.toLowerCase() === walletAddress?.toLowerCase()

  // Helper function to shorten addresses
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Get explorer URL based on the chain
  const getExplorerUrl = () => {
    if (!selectedChain) return 'https://basescan.org/tx/'
    return chainDetails[selectedChain as keyof typeof chainDetails]?.explorerUrl.replace('/address/', '/tx/') || 'https://basescan.org/tx/'
  }

  const copyTxHash = () => {
    navigator.clipboard.writeText(transactionHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Transaction direction icon with background
  const DirectionIcon = type === 'deposit' ? (
    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
      <ArrowUpRight className="h-3 w-3 text-green-500" />
    </div>
  ) : type === 'transfer' && isTransferReceived ? (
    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
      <ArrowDownLeft className="h-3 w-3 text-green-500" />
    </div>
  ) : type === 'transfer' && isTransferSent ? (
    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
      <ArrowUpRight className="h-3 w-3 text-red-500" />
    </div>
  ) : (
    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
      <ArrowDownRight className="h-3 w-3 text-red-500" />
    </div>
  )

  // USDC logo for amount display
  const USDCIcon = (
    <Image
      src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg"
      alt="USDC"
      width={16}
      height={16}
      className="inline-block ml-1"
    />
  )

  // Truncate transaction hash for display
  const truncatedHash = `${transactionHash.substring(0, 6)}...${transactionHash.substring(transactionHash.length - 4)}`

  return (
    <TooltipProvider>
      <div className="group relative flex flex-col p-3 sm:p-4 bg-gradient-to-r from-background to-background/50 rounded-xl hover:from-accent/5 hover:to-accent/10 transition-all duration-300 border border-border/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

        {/* Mobile-first layout */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="hidden md:block">{DirectionIcon}</div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1">
                  <div className="block md:hidden">{DirectionIcon}</div>
                  <span className={`font-semibold capitalize text-sm ${
                    type === 'deposit' || (type === 'transfer' && isTransferReceived) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {type === 'transfer' ? 'Transfer' : type}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 font-medium whitespace-nowrap bg-green-50 border-green-200 text-green-700">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-green-500" />
                  CONFIRMED
                </Badge>
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground font-medium cursor-help">
                        {format(date, 'MMM dd, yyyy • HH:mm')}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card border shadow-lg">
                      <div className="text-xs">
                        <p className="font-medium">{format(date, 'EEEE, MMMM dd, yyyy')}</p>
                        <p className="text-muted-foreground">{format(date, 'HH:mm:ss')} ({getUserTimezone()})</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Block: {blockTimestamp}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  {expanded && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 font-medium bg-blue-50 text-blue-700 border-blue-200">
                      BLOCK: {blockNumber}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={copyTxHash}
                        className="group/copy text-xs text-orange-500 hover:text-orange-600 active:text-orange-700 flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-1 rounded-2 hover:bg-orange-50 active:bg-orange-100 transition-all duration-200 min-h-[32px] sm:min-h-auto"
                      >
                        <span className="font-mono text-xs sm:text-xs">{truncatedHash}</span>
                        {copied ? (
                          <CheckCircle2 className="text-green-500 h-3.5 w-3.5 sm:h-3 sm:w-3 transition-all duration-200" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 sm:h-3 sm:w-3 group-hover/copy:scale-110 transition-transform duration-200" />
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
                        className="group/link text-xs text-orange-500 hover:text-orange-600 active:text-orange-700 flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-1 rounded-2 hover:bg-orange-50 active:bg-orange-100 transition-all duration-200 min-h-[32px] sm:min-h-auto"
                      >
                        <span className="text-xs sm:text-xs">Explorer</span>
                        <ExternalLink className="h-3.5 w-3.5 sm:h-3 sm:w-3 group-hover/link:scale-110 group-hover/link:translate-x-0.5 transition-all duration-200" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card">
                      <p className="text-xs">View on block explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Amount display - responsive */}
          <div className="flex flex-col items-end gap-1.5 ml-2 sm:ml-3">
            {type === 'deposit' ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2 sm:rounded-3 bg-red-50/70 border border-red-100/70 hover:bg-red-50 hover:border-red-200 transition-colors duration-200 cursor-pointer">
                      <span className="text-red-500 font-medium tabular-nums text-sm">-{formattedAssets}</span>
                      {USDCIcon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card border shadow-lg">
                    <p className="text-xs font-medium">USDC sent to vault</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2 sm:rounded-3 bg-green-50/70 border border-green-100/70 hover:bg-green-50 hover:border-green-200 transition-colors duration-200 cursor-pointer">
                      <span className="text-green-500 font-medium tabular-nums text-sm">+{formattedShares}</span>
                      <span className="text-[10px] font-medium text-green-600/80 bg-green-100/50 px-1 py-0.5 rounded">
                        slUSD
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card border shadow-lg">
                    <p className="text-xs font-medium">Shares received</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : type === 'transfer' && isTransferReceived ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2 sm:rounded-3 bg-green-50/70 border border-green-100/70 hover:bg-green-50 hover:border-green-200 transition-colors duration-200 cursor-pointer">
                      <span className="text-green-500 font-medium tabular-nums text-sm">+{formattedUsdcTransferAmount}</span>
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
                      <span className="text-blue-600 font-mono text-[10px]">From: {shortenAddress(from || '')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card border shadow-lg">
                    <p className="text-xs font-medium">Sender address: {from}</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : type === 'transfer' && isTransferSent ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2 sm:rounded-3 bg-red-50/70 border border-red-100/70 hover:bg-red-50 hover:border-red-200 transition-colors duration-200 cursor-pointer">
                      <span className="text-red-500 font-medium tabular-nums text-sm">-{formattedUsdcTransferAmount}</span>
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
                      <span className="text-orange-600 font-mono text-[10px]">To: {shortenAddress(to || '')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card border shadow-lg">
                    <p className="text-xs font-medium">Recipient address: {to}</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2 sm:rounded-3 bg-red-50/70 border border-red-100/70 hover:bg-red-50 hover:border-red-200 transition-colors duration-200 cursor-pointer">
                      <span className="text-red-500 font-medium tabular-nums text-sm">-{formattedShares}</span>
                      <span className="text-[10px] font-medium text-red-600/80 bg-red-100/50 px-1 py-0.5 rounded">
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
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2 sm:rounded-3 bg-green-50/70 border border-green-100/70 hover:bg-green-50 hover:border-green-200 transition-colors duration-200 cursor-pointer">
                      <span className="text-green-500 font-medium tabular-nums text-sm">+{formattedAssets}</span>
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
  )
}

function TransactionSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array(2)
        .fill(0)
        .map((_, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <Skeleton className="h-6 w-32 rounded-2" />
            <div className="space-y-2 pl-1">
              {Array(Math.ceil(count / 2))
                .fill(0)
                .map((_, index) => (
                  <Skeleton key={index} className="h-[90px] md:h-[88px] w-full rounded-3" />
                ))}
            </div>
          </div>
        ))}
    </>
  )
}

function EmptyTransactionsState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="mb-8 text-muted-foreground">
        <div className="relative mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
          <Image
            src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg"
            alt="USDC"
            width={40}
            height={40}
            className="opacity-60"
          />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            <ArrowUpRight className="w-3 h-3 text-white" />
          </div>
        </div>
        <p className="text-xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          No transactions yet
        </p>
        <p className="text-sm max-w-md mx-auto leading-relaxed">
          Your transaction history will appear here after your first deposit or withdrawal
        </p>
      </div>
    </div>
  )
} 