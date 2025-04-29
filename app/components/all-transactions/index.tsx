'use client'

import React, { useEffect, useState } from 'react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useChain } from '@/context/chain-context'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isYesterday, parseISO, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { formatUnits } from 'ethers/lib/utils'
import { ExternalLink, ArrowUpRight, ArrowDownRight, CheckCircle2, Copy, Filter } from 'lucide-react'
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

interface AllTransactionsProps {
  protocolIdentifier?: string // Optional if we want to pass it directly
}

type FilterType = 'all' | 'deposit' | 'withdraw'

export default function AllTransactions({ protocolIdentifier }: AllTransactionsProps) {
  const { walletAddress, isWalletConnected } = useWalletConnection()
  const { selectedChain, chainDetails } = useChain()
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')

  // Skip for Base chain
  const isBaseChain = selectedChain === ChainId.Base;
  
  // Get protocol identifier from chain context if not provided
  const getProtocolIdentifier = () => {
    if (protocolIdentifier) return protocolIdentifier
    if (!selectedChain) return ''
    return chainDetails[selectedChain as keyof typeof chainDetails]?.contractAddress || ''
  }

  // Use the custom hook instead of direct fetch and local state
  const protocolId = getProtocolIdentifier()
  const { transactions, isLoading, startRefreshing } = useTransactionHistory({
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

  // Group transactions by month and date
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredTransactions.forEach(tx => {
      const date = new Date(parseInt(tx.blockTimestamp) * 1000)
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

  // This check is redundant with the page-level check, but adding as a safeguard
  if (isBaseChain) {
    return null;
  }

  const hasTransactions = transactions.length > 0

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 flex flex-col">
      {hasTransactions && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 md:gap-0">
          <h3 className="text-lg font-semibold">Your Transactions</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 px-3 w-full md:w-auto">
                {currentFilter === 'all' ? 'All Transactions' : 
                 currentFilter === 'deposit' ? 'Deposits Only' : 'Withdrawals Only'}
                <Filter className="h-3 w-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setCurrentFilter('all')}>
                  All Transactions
                  {currentFilter === 'all' && <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentFilter('deposit')}>
                  Deposits Only
                  {currentFilter === 'deposit' && <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentFilter('withdraw')}>
                  Withdrawals Only
                  {currentFilter === 'withdraw' && <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <TransactionSkeleton count={5} />
        ) : transactions.length === 0 ? (
          <EmptyTransactionsState />
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No {currentFilter} transactions found</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setCurrentFilter('all')}
            >
              View all transactions
            </Button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([dateGroup, txs]) => (
            <div key={dateGroup} className="space-y-3">
              <div className="text-sm text-muted-foreground font-medium bg-accent/5 py-1 px-3 rounded-md">
                {dateGroup}
              </div>
              <div className="space-y-2 pl-1">
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
  const date = new Date(parseInt(blockTimestamp) * 1000)
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
      <div className="flex flex-col md:flex-row justify-between p-3.5 bg-background rounded-lg hover:bg-accent/10 transition-colors border border-transparent hover:border-accent/20">
        <div className="flex items-start gap-2.5">
          {DirectionIcon}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`font-medium capitalize ${type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                {type}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal whitespace-nowrap">
                CONFIRMED
                <CheckCircle2 className="h-2.5 w-2.5 ml-0.5 text-green-500" />
              </Badge>
            </div>
            
            <div className="flex flex-col gap-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(date, 'MMM dd, yyyy • HH:mm')}
                </span>
                {expanded && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    BLOCK: {blockNumber}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <button 
                  onClick={copyTxHash}
                  className="text-xs text-orange-500 flex items-center hover:underline"
                >
                  {truncatedHash}
                  <Copy className="h-3 w-3 ml-0.5" />
                </button>
                
                <Link 
                  href={`${getExplorerUrl()}${transactionHash}`} 
                  target="_blank"
                  className="text-xs text-orange-500 hover:underline flex items-center"
                >
                  View on explorer
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end justify-center gap-1 mt-3 md:mt-0">
          {type === 'deposit' ? (
            <>
              <div className="text-red-500 text-sm flex items-center justify-end tabular-nums">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      -{formattedAssets}
                      {USDCIcon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card">
                    <p className="text-xs">USDC sent to vault</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-green-500 text-sm flex items-center justify-end tabular-nums">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      +{formattedShares}
                      <Badge variant="secondary" className="ml-1 py-0 h-4 px-1.5 text-[10px] font-normal normal-case">slUSD</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card">
                    <p className="text-xs">Shares received</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-500 text-sm flex items-center justify-end tabular-nums">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      -{formattedShares}
                      <Badge variant="secondary" className="ml-1 py-0 h-4 px-1.5 text-[10px] font-normal normal-case">slUSD</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card">
                    <p className="text-xs">Shares redeemed</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-green-500 text-sm flex items-center justify-end tabular-nums">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      +{formattedAssets}
                      {USDCIcon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card">
                    <p className="text-xs">USDC received from vault</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
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
            <Skeleton className="h-6 w-32 rounded-md" />
            <div className="space-y-2 pl-1">
              {Array(Math.ceil(count / 2))
                .fill(0)
                .map((_, index) => (
                  <Skeleton key={index} className="h-[90px] md:h-[88px] w-full rounded-lg" />
                ))}
            </div>
          </div>
        ))}
    </>
  )
}

function EmptyTransactionsState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="mb-4 text-muted-foreground">
        <Image 
          src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg" 
          alt="USDC" 
          width={60} 
          height={60}
          className="mx-auto opacity-50 mb-4"
        />
        <p className="text-lg mb-2">No transactions found</p>
        <p className="text-sm">Your transaction history will appear here after your first deposit</p>
      </div>
    </div>
  )
} 