'use client'

import React, { useState, useEffect } from 'react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useChain } from '@/context/chain-context'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isYesterday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronRight, ExternalLink, Copy, ArrowUpRight, ArrowDownRight, CheckCircle2, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatUnits } from 'ethers/lib/utils'
import Link from 'next/link'
import { ChainId } from '@/types/chain'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import useTransactionHistory from '@/hooks/useTransactionHistory'
import { Transaction } from '@/queries/transaction-history-api'
import { HeadingText } from '@/components/ui/typography'
import { useActiveAccount } from 'thirdweb/react'
import { TTxContext, useTxContext } from '@/context/super-vault-tx-provider'

interface TransactionHistoryProps {
  protocolIdentifier: string
}

// Helper function to convert Unix timestamp to user's local timezone
const convertTimestampToLocalDate = (timestamp: string): Date => {
  // Convert string timestamp to number and multiply by 1000 for milliseconds
  const timestampMs = parseInt(timestamp) * 1000;
  
  // Create date object which automatically uses user's local timezone
  const date = new Date(timestampMs);
  
  // Debug log to help identify timestamp issues
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('Timestamp conversion:', {
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

export default function TransactionHistory({ protocolIdentifier }: TransactionHistoryProps) {
  // const { walletAddress, isWalletConnected } = useWalletConnection()
  const account = useActiveAccount();
  const walletAddress = account?.address as `0x${string}`
  const isWalletConnected = !!account
  const { selectedChain } = useChain()
  const router = useRouter()
  const { depositTxCompleted, withdrawTxCompleted } = useTxContext() as TTxContext
  const { data: { transactions }, isLoading, startRefreshing } = useTransactionHistory({
    protocolIdentifier,
    chainId: selectedChain || 0,
    walletAddress: walletAddress || '',
    refetchOnTransaction: true
  })

  // Listen for transaction events from the global event system if available
  useEffect(() => {
    if (depositTxCompleted || withdrawTxCompleted) {
      startRefreshing();
    }
  }, [depositTxCompleted, withdrawTxCompleted, startRefreshing]);

  // Get the chain name for routing
  const getChainName = () => {
    if (selectedChain === ChainId.Base) return 'base'
    if (selectedChain === ChainId.Sonic) return 'sonic'
    return 'sonic'
  }

  // Hide if wallet not connected
  if (!isWalletConnected) {
    return null
  }

  // Group transactions by date with improved timezone handling
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {}
    const userTimezone = getUserTimezone();

    transactions.slice(0, 3).forEach(tx => {
      const date = convertTimestampToLocalDate(tx.blockTimestamp);
      let dateKey = ''

      // Use timezone-aware date comparison
      if (isToday(date)) {
        dateKey = 'Today'
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
      } else {
        // Format date in user's local timezone
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

  return (
    <div className="bg-card rounded-2xl p-4 flex flex-col">
      <div className="mb-4">
        <HeadingText level="h5" weight="medium" className="text-gray-800 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Your Recent Transactions
        </HeadingText>
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-muted-foreground mt-1">
            Timezone: {getUserTimezone()}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <TransactionSkeleton count={3} />
        ) : transactions.length === 0 ? (
          <EmptyTransactionsState />
        ) : (
          Object.entries(groupedTransactions).map(([dateGroup, txs]) => (
            <div key={dateGroup} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-gradient-to-r from-accent/10 to-accent/5 py-1.5 px-3 rounded-3 border border-accent/20">
                  <Calendar className="w-3 h-3 text-accent" />
                  {dateGroup}
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
              </div>
              <div className="space-y-2">
                {txs.map(tx => (
                  <TransactionItem key={tx.transactionHash} transaction={tx} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full text-primary border-primary/30 hover:bg-primary/5 hover:shadow-md transition-all duration-200"
          onClick={() => router.push(`/super-fund/${getChainName()}/txs`)}
        >
          View all transactions
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { type, assets, shares, blockTimestamp, transactionHash } = transaction
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

  // Truncate transaction hash for display
  const truncatedHash = `${transactionHash.substring(0, 6)}...${transactionHash.substring(transactionHash.length - 4)}`

  // Copy tx hash
  const copyHash = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(transactionHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // USDC logo for amount display
  const USDCIcon = (
    <Image
      src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg"
      alt="USDC"
      width={14}
      height={14}
      className="inline-block ml-1"
    />
  )

  // Direction icon with background
  const DirectionIcon = type === 'deposit' ? (
    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
      <ArrowUpRight className="h-2.5 w-2.5 text-green-500" />
    </div>
  ) : (
    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
      <ArrowDownRight className="h-2.5 w-2.5 text-red-500" />
    </div>
  )

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
                      {/* <p className="text-[10px] text-muted-foreground mt-1">Block: {blockTimestamp}</p> */}
                    </div>
                  </TooltipContent>
                </Tooltip>
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
                      <ExternalLink className="h-2.5 w-2.5 group-hover/link:scale-110 group-hover/link:translate-x-0.5 transition-all duration-200" />
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
  )
}

function TransactionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="space-y-2">
            {index === 0 && (
              <Skeleton className="h-4 w-16 rounded-2" />
            )}
            <Skeleton className="h-[88px] w-full rounded-3" />
          </div>
        ))}
    </>
  )
}

function EmptyTransactionsState() {
  return (
    <div className="text-center py-8 px-2">
      <div className="mb-4 text-muted-foreground">
        <div className="relative mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
          <Image
            src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg"
            alt="USDC"
            width={24}
            height={24}
            className="opacity-60"
          />
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            <ArrowUpRight className="w-2 h-2 text-white" />
          </div>
        </div>
        <p className="text-sm font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          No transactions yet
        </p>
        <p className="text-xs leading-relaxed">
          Your transaction history will appear here after your first deposit or withdrawal
        </p>
      </div>
    </div>
  )
} 