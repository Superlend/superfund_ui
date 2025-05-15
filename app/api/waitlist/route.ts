import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase.waitlist'

const waitlistSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  wallet_address: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json()
    const { email, wallet_address } = waitlistSchema.parse(body)
    
    // Check if email already exists
    const { data: existingEmails } = await supabase
      .from('waitlist')
      .select('email, id, wallet_address')
      .eq('email', email)
      .limit(1)
    
    if (existingEmails && existingEmails.length > 0) {
      // If email exists but wallet_address is provided, update the record
      if (wallet_address) {
        const { error: updateError } = await supabase
          .from('waitlist')
          .update({ wallet_address, updated_at: new Date().toISOString() })
          .eq('id', existingEmails[0].id)
        
        if (updateError) {
          console.error('Error updating Supabase record:', updateError)
          return NextResponse.json(
            { message: 'Failed to update wallet address' },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { message: 'Wallet address updated successfully' },
          { status: 200 }
        )
      }
      
      // Return the wallet_address info with the error
      return NextResponse.json(
        { 
          message: 'Email is already on the waitlist',
          has_wallet: !!existingEmails[0].wallet_address
        },
        { status: 409 }
      )
    }
    
    // Insert the new email with wallet_address if provided
    const { error } = await supabase
      .from('waitlist')
      .insert([{ 
        email, 
        wallet_address: wallet_address || null, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
    
    if (error) {
      console.error('Error inserting to Supabase:', error)
      return NextResponse.json(
        { message: 'Failed to join waitlist' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Successfully joined the waitlist' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 