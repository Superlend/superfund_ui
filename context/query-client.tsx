import { isServer, QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // ✅ Optimization 1.3: Enhanced query client configuration for better caching
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 60 * 1000, // 1 minute
                gcTime: 10 * 60 * 1000, // 10 minutes (replaces deprecated cacheTime)
                refetchOnWindowFocus: false, // Prevent refetch on window focus during tab switching
                refetchOnMount: false, // Prevent refetch on mount if we have cached data
                retry: 2, // Reduce retry attempts for failed requests
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (isServer) {
        // Server: always make a new query client
        return makeQueryClient()
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

// Set up queryClient
export const queryClient = getQueryClient()
