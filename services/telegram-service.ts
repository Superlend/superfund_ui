/**
 * Service for handling Telegram-related API calls
 */

/**
 * Check if a wallet address has already submitted a Telegram username
 * @param walletAddress The user's wallet address
 * @returns A boolean indicating whether a Telegram username exists for this wallet
 */
export async function checkTelegramExists(walletAddress: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/telegram-check?wallet=${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check Telegram existence');
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking if Telegram exists:', error);
    throw error;
  }
}

/**
 * Submit a Telegram username for a wallet address
 * @param walletAddress The user's wallet address
 * @param telegramUsername The Telegram username to submit
 * @returns The API response data
 */
export async function submitTelegramUsername(
  walletAddress: string,
  telegramUsername: string
): Promise<any> {
  try {
    const response = await fetch('/api/telegram-connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: walletAddress,
        telegram: telegramUsername,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit Telegram username');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting Telegram username:', error);
    throw error;
  }
} 