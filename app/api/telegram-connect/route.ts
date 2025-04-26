import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

/**
 * API route for connecting a Telegram username to a wallet address
 */
export async function POST(request: Request) {
  try {
    const { wallet, telegram, portfolioValue } = await request.json();

    // Validate the input
    if (!wallet || !telegram) {
      return NextResponse.json(
        { message: 'Bad request: Missing wallet or telegram parameter' },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { message: 'Bad request: Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (!/^@?[a-zA-Z0-9_]{5,}$/.test(telegram)) {
      return NextResponse.json(
        { message: 'Bad request: Invalid telegram username format' },
        { status: 400 }
      );
    }

    // Remove @ prefix if present
    const cleanedTelegram = telegram.startsWith('@') ? telegram.substring(1) : telegram;

    // Check if the wallet address is already in the database
    const existingWallet = await supabaseServer
      .from('telegram_users')
      .select('id, wallet, telegram')
      .eq('wallet', wallet);

    if (existingWallet.error) {
      console.error('Supabase query error:', existingWallet.error);
      return NextResponse.json(
        { message: 'Database query error: ' + existingWallet.error.message },
        { status: 500 }
      );
    }

    // If wallet exists, update the telegram username
    if (existingWallet.data && existingWallet.data.length > 0) {
      const updateResult = await supabaseServer
        .from('telegram_users')
        .update({
          telegram: cleanedTelegram,
          portfolio_value: portfolioValue !== undefined ? portfolioValue : 0,
          updated_at: new Date().toISOString()
        })
        .eq('wallet', wallet);

      if (updateResult.error) {
        console.error('Supabase update error:', updateResult.error);
        return NextResponse.json(
          { message: 'Database update error: ' + updateResult.error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Telegram username updated successfully',
        wallet,
        telegram: cleanedTelegram
      });
    }

    // If wallet doesn't exist, check if the telegram username is already in use
    const existingTelegram = await supabaseServer
      .from('telegram_users')
      .select('id, wallet, telegram')
      .eq('telegram', cleanedTelegram);

    if (existingTelegram.error) {
      console.error('Supabase query error:', existingTelegram.error);
      return NextResponse.json(
        { message: 'Database query error: ' + existingTelegram.error.message },
        { status: 500 }
      );
    }

    // If telegram username is already in use, return an error
    if (existingTelegram.data && existingTelegram.data.length > 0) {
      return NextResponse.json(
        {
          message: 'Telegram username already in use',
          existingWallet: existingTelegram.data[0].wallet
        },
        { status: 409 }
      );
    }

    // Insert a new record
    const insertResult = await supabaseServer
      .from('telegram_users')
      .insert([{
        wallet: wallet,
        telegram: cleanedTelegram,
        portfolio_value: portfolioValue !== undefined ? portfolioValue : 0
      }]);

    if (insertResult.error) {
      console.error('Supabase insert error:', insertResult.error);
      return NextResponse.json(
        { message: 'Database insert error: ' + insertResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Telegram username connected successfully',
      wallet,
      telegram: cleanedTelegram
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 