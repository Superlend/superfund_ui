"use client";

import { USDC_DECIMALS, VAULT_ADDRESS } from '@/lib/constants';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { base } from 'viem/chains';


const VAULT_ABI = parseAbi([
    'function totalAssets() view returns (uint256)',
    // maxWithdraw
    'function maxWithdraw(address user) view returns (uint256)',
]);

// Create public client outside component to prevent recreation
const publicClient = createPublicClient({
    chain: base,
    transport: http(),
    batch: {
        multicall: true,
    },
});

export function useVaultHook() {
    const [totalAssets, setTotalAssets] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchVaultData() {
        try {
            setIsLoading(true);
            const [assets] = await Promise.all([
                publicClient.readContract({
                    address: VAULT_ADDRESS,
                    abi: VAULT_ABI,
                    functionName: 'totalAssets',
                }),
            ]);

            const formattedAssets = formatUnits(assets, USDC_DECIMALS);
            setTotalAssets(formattedAssets);
            setError(null);
        } catch (err) {
            console.error('Error fetching vault data:', err);
            setError('Failed to fetch vault data');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        // Initial fetch
        fetchVaultData();

        // Refresh every 5 seconds
        const interval = setInterval(fetchVaultData, 5000);
        return () => clearInterval(interval);
    }, []);

    return { totalAssets, isLoading, error };
};
