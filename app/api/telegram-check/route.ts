import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

/**
 * API route for checking if a wallet address has already submitted a Telegram username
 */
export async function GET(request: Request) {
  try {
    // Get wallet address from query string
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { exists: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Query Supabase to check if the wallet address exists
    const { data, error } = await supabaseServer
      .from('telegram_users')
      .select('id')
      .eq('wallet', walletAddress)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to query database');
    }

    // Return whether a record exists
    return NextResponse.json({
      exists: !!data,
      message: data ? 'Telegram username found' : 'No Telegram username found'
    });
  } catch (error) {
    console.error('Error in telegram-check API:', error);
    return NextResponse.json(
      { 
        exists: false, 
        message: error instanceof Error ? error.message : 'Failed to check Telegram username' 
      },
      { status: 500 }
    );
  }
} 