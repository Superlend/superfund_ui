import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

/**
 * API route for connecting a Telegram username to a wallet address
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { wallet, telegram } = body;

    // Validate inputs
    if (!wallet || !telegram) {
      return NextResponse.json(
        { success: false, message: 'Wallet address and Telegram username are required' },
        { status: 400 }
      );
    }

    // Validate Telegram username format
    const telegramUsernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
    if (!telegramUsernameRegex.test(telegram)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid Telegram username format. Must be 5-32 characters and contain only letters, numbers, and underscores.' 
        },
        { status: 400 }
      );
    }

    // Check if wallet already has a Telegram username
    const { data: existingData } = await supabaseServer
      .from('telegram_users')
      .select('id')
      .eq('wallet', wallet)
      .maybeSingle();

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabaseServer
        .from('telegram_users')
        .update({ 
          telegram: telegram,
          updated_at: new Date().toISOString()
        })
        .eq('wallet', wallet);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error('Failed to update Telegram username');
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseServer
        .from('telegram_users')
        .insert({ 
          wallet: wallet,
          telegram: telegram,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error('Failed to insert Telegram username');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram username connected successfully'
    });
  } catch (error) {
    console.error('Error in telegram-connect API:', error);
    const message = error instanceof Error ? error.message : 'Failed to connect Telegram username';
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
} 