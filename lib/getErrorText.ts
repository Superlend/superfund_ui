import {
    SOMETHING_WENT_WRONG_MESSAGE,
    TRANSACTION_CANCEL_TEXT,
    NETWORK_ERROR_MESSAGE,
    INSUFFICIENT_FUNDS_MESSAGE,
} from '../constants'

export const getErrorText = (error: any) => {
    // Add logging to help debug error structure in development
    if (process.env.NODE_ENV === 'development') {
        console.log('Error object received:', error)
        console.log('Error message:', error?.message)
        console.log('Error reason:', error?.reason)
        console.log('Error code:', error?.code)
    }

    // Handle case where error is not an object or has no message
    if (!error || typeof error !== 'object') {
        return SOMETHING_WENT_WRONG_MESSAGE
    }

    // Extract message from various possible error structures
    const errorMessage = error.message || error.reason || error.data?.message || ''
    
    if (typeof errorMessage !== 'string') {
        return SOMETHING_WENT_WRONG_MESSAGE
    }

    // Check for our specific transaction failure messages first
    if (errorMessage.includes('Transaction failed on the blockchain')) {
        return 'Transaction failed on the blockchain. Please try again.'
    }

    if (errorMessage.includes('Transaction status unclear')) {
        return 'Transaction status unclear. Please check the explorer.'
    }

    // Check for various user rejection patterns
    const rejectionPatterns = [
        'User rejected the request',
        'user rejected',
        'User denied',
        'user denied',
        'Transaction was rejected',
        'transaction was rejected',
        'User cancelled',
        'user cancelled',
        'User canceled',
        'user canceled',
        'MetaMask Tx Signature: User denied',
        'User rejected transaction',
        'ACTION_REJECTED',
        'UNAUTHORIZED',
        'User closed modal',
        'user closed modal'
    ]

    // Check if any rejection pattern matches (case insensitive)
    const isUserRejection = rejectionPatterns.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )

    if (isUserRejection) {
        return TRANSACTION_CANCEL_TEXT
    }

    // Check for network/connection related errors
    if (errorMessage.toLowerCase().includes('network') || 
        errorMessage.toLowerCase().includes('connection') ||
        errorMessage.toLowerCase().includes('timeout')) {
        return NETWORK_ERROR_MESSAGE
    }

    // Check for insufficient funds
    if (errorMessage.toLowerCase().includes('insufficient funds') ||
        errorMessage.toLowerCase().includes('insufficient balance')) {
        return INSUFFICIENT_FUNDS_MESSAGE
    }

    // Default fallback
    return SOMETHING_WENT_WRONG_MESSAGE
}
