'use client'

import React, { useState, useEffect } from 'react'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useChain } from '@/context/chain-context'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isYesterday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronRight, ExternalLink, Copy, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react'
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
import useTransactionHistory from '@/hooks/useTransactionHistory'
import { Transaction } from '@/queries/transaction-history-api'

interface TransactionHistoryProps {
  protocolIdentifier: string
}

export default function TransactionHistory({ protocolIdentifier }: TransactionHistoryProps) {
  const { walletAddress, isWalletConnected } = useWalletConnection()
  const { selectedChain, chainDetails } = useChain()
  const router = useRouter()

  const { transactions, isLoading, startRefreshing } = useTransactionHistory({
    protocolIdentifier,
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

  // Group transactions by date
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {}

    transactions.slice(0, 5).forEach(tx => {
      const date = new Date(parseInt(tx.blockTimestamp) * 1000)
      let dateKey = ''

      if (isToday(date)) {
        dateKey = 'Today'
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
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

  return (
    <div className="bg-card rounded-2xl p-4 flex flex-col mt-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Your Recent Transactions</h3>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <TransactionSkeleton count={3} />
        ) : transactions.length === 0 ? (
          <EmptyTransactionsState />
        ) : (
          Object.entries(groupedTransactions).map(([dateGroup, txs]) => (
            <div key={dateGroup} className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {dateGroup}
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

      <div className="mt-3">
        <Button
          variant="outline"
          className="w-full text-primary border-primary/30 hover:bg-primary/5"
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

  // Truncate hash for display (first 6 chars)
  const shortenedHash = `0x${transactionHash.substring(2, 7)}`

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
      width={16}
      height={16}
      className="inline-block ml-1"
    />
  )

  // slUSD label for display
  const slUSDLabel = (
    <span className="rounded-full bg-blue-500 text-white text-[10px] px-2 py-0.5 ml-1">slUSD</span>
  )

  // Direction icon
  const DirectionIcon = type === 'deposit' ? (
    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-1">
      <ArrowUpRight className="h-3 w-3 text-green-500" />
    </div>
  ) : (
    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mr-1">
      <ArrowDownRight className="h-3 w-3 text-red-500" />
    </div>
  )

  return (
    <TooltipProvider>
      <div className="bg-background rounded-lg py-2">
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 items-center">
          {/* Row 1: Type and time */}
          <div className="flex items-center self-start pl-2">
            {DirectionIcon}
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <span className={`text-sm font-medium capitalize ${type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                {type}
              </span>
            </div>

            {/* Hash with copy button */}
            <div className="flex items-center text-xs text-orange-500">
              {truncatedHash}
              <button
                onClick={copyHash}
                className="ml-1 focus:outline-none"
              >
                {copied ? (
                  <CheckCircle2 className="text-green-500 h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3 hover:text-orange-400" />
                )}
              </button>
            </div>

            {/* View tx link */}
            <div>
              <Link
                href={`${getExplorerUrl()}${transactionHash}`}
                target="_blank"
                className="text-xs text-orange-500 hover:underline flex items-center w-fit"
              >
                View tx
                <ExternalLink className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Time and amounts */}
          <div className="flex flex-col space-y-1 items-end pr-2">
            <div className="text-xs text-muted-foreground">
              {format(date, 'HH:mm')}
            </div>

            {/* Amounts */}
            <div className="text-right text-red-500 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-end">
                    -{type === 'deposit' ? formattedAssets : formattedShares}
                    {type === 'deposit' ? USDCIcon : slUSDLabel}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-card">
                  <p className="text-xs">
                    {type === 'deposit' ? 'USDC sent to vault' : 'Shares redeemed'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="text-right text-green-500 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-end">
                    +{type === 'deposit' ? formattedShares : formattedAssets}
                    {type === 'deposit' ? slUSDLabel : USDCIcon}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-card">
                  <p className="text-xs">
                    {type === 'deposit' ? 'Shares received' : 'USDC received from vault'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
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
          <div key={index} className="space-y-1">
            {index === 0 && (
              <Skeleton className="h-4 w-16 rounded-md" />
            )}
            <Skeleton className="h-[76px] w-full rounded-lg" />
          </div>
        ))}
    </>
  )
}

function EmptyTransactionsState() {
  return (
    <div className="text-center py-4 px-2">
      <div className="mb-2 text-muted-foreground">
        <Image
          src="https://superlend-assets.s3.ap-south-1.amazonaws.com/100-usdc.svg"
          alt="USDC"
          width={32}
          height={32}
          className="mx-auto opacity-50 mb-2"
        />
        <p className="text-sm">No transactions found</p>
        <p className="text-xs">Deposit funds to start earning yield</p>
      </div>
    </div>
  )
} 