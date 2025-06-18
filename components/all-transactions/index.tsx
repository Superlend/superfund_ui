'use client'

import React, { useEffect, useState } from 'react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useChain } from '@/context/chain-context'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isYesterday, parseISO, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { formatUnits } from 'ethers/lib/utils'
import { ExternalLink, ArrowUpRight, ArrowDownRight, CheckCircle2, Copy, Filter, Calendar } from 'lucide-react'
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
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import useTransactionHistory from '@/hooks/useTransactionHistory'
import { Transaction } from '@/queries/transaction-history-api'
import { useActiveAccount } from "thirdweb/react"

interface AllTransactionsProps {
  protocolIdentifier?: string // Optional if we want to pass it directly
}

type FilterType = 'all' | 'deposit' | 'withdraw'

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

export default function AllTransactions({ protocolIdentifier }: AllTransactionsProps) {
  // const { walletAddress, isWalletConnected } = useWalletConnection()
  const account = useActiveAccount();
  const walletAddress = account?.address as `0x${string}`
  const isWalletConnected = !!account
  const { selectedChain, chainDetails } = useChain()
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')

  // Get protocol identifier from chain context if not provided
  const getProtocolIdentifier = () => {
    if (protocolIdentifier) return protocolIdentifier
    if (!selectedChain) return ''
    return chainDetails[selectedChain as keyof typeof chainDetails]?.contractAddress || ''
  }

  // Use the custom hook instead of direct fetch and local state
  const protocolId = getProtocolIdentifier()
  const { data: { transactions }, isLoading, startRefreshing } = useTransactionHistory({
    protocolIdentifier: protocolId,
    chainId: selectedChain || 0,
    walletAddress: walletAddress || '',
    refetchOnTransaction: true
  })

  // Listen for transaction events from the global event system if available
  useEffect(() => {
    const handleTransactionComplete = () => {
      // Manually trigger refreshing for 30 seconds when transaction completes
      startRefreshing();
    };

    // Add event listener if window exists
    if (typeof window !== 'undefined') {
      window.addEventListener('transaction-complete', handleTransactionComplete);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('transaction-complete', handleTransactionComplete);
      }
    };
  }, [startRefreshing]);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (currentFilter === 'all') return true
    return tx.type === currentFilter
  })

  // Group transactions by month and date with improved timezone handling
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {}

    filteredTransactions.forEach(tx => {
      const date = convertTimestampToLocalDate(tx.blockTimestamp);
      let dateKey = ''

      if (isToday(date)) {
        dateKey = 'Today'
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
      } else if (differenceInDays(new Date(), date) < 7) {
        // Show day name for transactions within the last week
        dateKey = format(date, 'EEEE') // Monday, Tuesday, etc.
      } else {
        dateKey = format(date, 'MMM dd, yyyy')
      }

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }

      groups[dateKey].push(tx)
    })

    return groups
  }

  const groupedTransactions = groupTransactionsByDate()

  if (!isWalletConnected) {
    return (
      <div className="bg-card rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground">
        <p>Please connect your wallet to view your transactions</p>
      </div>
    )
  }

  const hasTransactions = transactions.length > 0

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 flex flex-col">
      {hasTransactions && (
        <div className="flex flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Your Transactions
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
            </p>
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground">
                Timezone: {getUserTimezone()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-auto">
            {/* Tablet & above Filter Pills */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-4 border w-full md:w-auto">
              <button
                onClick={() => setCurrentFilter('all')}
                className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 flex-1 md:flex-none overflow-hidden min-w-[60px] ${currentFilter === 'all'
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
                onClick={() => setCurrentFilter('deposit')}
                className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 flex-1 md:flex-none overflow-hidden min-w-[80px] ${currentFilter === 'deposit'
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
                onClick={() => setCurrentFilter('withdraw')}
                className={`relative px-4 py-2 text-xs font-medium rounded-3 transition-all duration-300 flex-1 md:flex-none overflow-hidden min-w-[100px] ${currentFilter === 'withdraw'
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
            </div>

            {/* Mobile Filter Dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 border-dashed hover:border-solid transition-all duration-200 hover:shadow-sm"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-4">
                  <div className="space-y-2">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Filter Options
                    </div>
                    <DropdownMenuGroup className="space-y-1">
                      <DropdownMenuItem
                        onClick={() => setCurrentFilter('all')}
                        className={`relative rounded-2 cursor-pointer transition-all duration-200 rounded-3 overflow-hidden ${currentFilter === 'all' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-accent/50'
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
                        onClick={() => setCurrentFilter('deposit')}
                        className={`relative rounded-3 cursor-pointer transition-all duration-200 rounded-3 overflow-hidden ${currentFilter === 'deposit' ? 'bg-green-50 text-green-700 border border-green-200' : 'hover:bg-accent/50'
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
                        onClick={() => setCurrentFilter('withdraw')}
                        className={`relative rounded-3 cursor-pointer transition-all duration-200 rounded-3 overflow-hidden ${currentFilter === 'withdraw' ? 'bg-red-50 text-red-700 border border-red-200' : 'hover:bg-accent/50'
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
                    </DropdownMenuGroup>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <TransactionSkeleton count={5} />
        ) : transactions.length === 0 ? (
          <EmptyTransactionsState />
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mb-6 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Filter className="w-8 h-8 text-accent" />
              </div>
              <p className="text-lg font-semibold mb-2">No {currentFilter} transactions found</p>
              <p className="text-sm">Try adjusting your filter or check back later</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 hover:shadow-md transition-all duration-200"
              onClick={() => setCurrentFilter('all')}
            >
              View all transactions
            </Button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([dateGroup, txs]) => (
            <div key={dateGroup} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground bg-gradient-to-r from-accent/10 to-accent/5 py-2 px-4 rounded-3 border border-accent/20">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  {dateGroup}
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                <Badge variant="outline" className="text-[10px] px-2 py-1 font-medium">
                  {txs.length} {txs.length === 1 ? 'transaction' : 'transactions'}
                </Badge>
              </div>
              <div className="space-y-3 pl-2">
                {txs.map(tx => (
                  <TransactionItem key={tx.transactionHash} transaction={tx} expanded={true} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TransactionItem({ transaction, expanded = false }: { transaction: Transaction; expanded?: boolean }) {
  const { type, assets, shares, blockNumber, blockTimestamp, transactionHash } = transaction
  const date = convertTimestampToLocalDate(blockTimestamp);
  const { selectedChain, chainDetails } = useChain()
  const [copied, setCopied] = useState(false)

  // Format the asset amount (using 1e6 decimals as specified)
  const formattedAssets = parseFloat(formatUnits(assets, 6)).toFixed(4)
  const formattedShares = parseFloat(formatUnits(shares, 6)).toFixed(4)

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
                  <span className={`font-semibold capitalize text-sm ${type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {type}
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