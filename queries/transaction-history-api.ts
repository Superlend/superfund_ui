import { requestIndexer, requestSuperlend } from './request'

export interface Transaction {
  user: string
  type: 'deposit' | 'withdraw'
  assets: string
  shares: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export interface TransactionHistoryResponse {
  transactions: Transaction[]
  capital: string
  interest_earned: string
}

export interface TransactionHistoryParams {
  protocolIdentifier: string
  chainId: number
  walletAddress: string
}

export async function getTransactionHistory({
  protocolIdentifier,
  chainId,
  walletAddress,
}: TransactionHistoryParams) {
  return requestIndexer<TransactionHistoryResponse>({
    method: 'GET',
    path: `/vaults/user_tx_history/${protocolIdentifier}/${chainId}/${walletAddress}`,
  })
} 