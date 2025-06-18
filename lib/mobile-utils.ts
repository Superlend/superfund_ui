// Mobile detection utilities for wallet connection
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isSafari = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isIOSSafari = (): boolean => {
    return isIOS() && isSafari();
};

// Check if wallet app is installed on mobile
export const isWalletInstalled = (walletScheme: string): boolean => {
    if (!isMobile()) return false;
    
    try {
        // This is a best-effort check for installed wallets
        const link = document.createElement('a');
        link.href = walletScheme;
        return link.protocol === walletScheme.split(':')[0] + ':';
    } catch {
        return false;
    }
};

// Get wallet deep link URL for mobile
export const getWalletDeepLink = (walletId: string, wcUri: string): string => {
    const walletSchemes: Record<string, string> = {
        'io.metamask': 'metamask:',
        'com.coinbase.wallet': 'cbwallet:',
        'me.rainbow': 'rainbow:',
        'com.trustwallet.trustedapp': 'trust:'
    };

    const scheme = walletSchemes[walletId];
    if (!scheme) return wcUri;

    // Encode the WalletConnect URI for deep linking
    const encodedUri = encodeURIComponent(wcUri);
    return `${scheme}//wc?uri=${encodedUri}`;
};

// Open wallet app on mobile with fallback
export const openWalletApp = (walletId: string, wcUri: string): void => {
    if (!isMobile()) return;

    const deepLink = getWalletDeepLink(walletId, wcUri);
    
    try {
        // Try to open the wallet app
        window.location.href = deepLink;
        
        // Fallback: If wallet doesn't open after 2 seconds, open app store
        setTimeout(() => {
            const appStoreLinks: Record<string, string> = {
                'io.metamask': isIOS() 
                    ? 'https://apps.apple.com/app/metamask/id1438144202'
                    : 'https://play.google.com/store/apps/details?id=io.metamask',
                'com.coinbase.wallet': isIOS()
                    ? 'https://apps.apple.com/app/coinbase-wallet/id1278383455'
                    : 'https://play.google.com/store/apps/details?id=org.toshi',
                'me.rainbow': isIOS()
                    ? 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021'
                    : 'https://play.google.com/store/apps/details?id=me.rainbow',
                'com.trustwallet.trustedapp': isIOS()
                    ? 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
                    : 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
            };

            const appStoreLink = appStoreLinks[walletId];
            if (appStoreLink && !document.hidden) {
                window.open(appStoreLink, '_blank');
            }
        }, 2000);
    } catch (error) {
        console.error('Failed to open wallet app:', error);
    }
}; 