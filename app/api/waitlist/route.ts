import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const waitlistSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
})

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json()
    const { email } = waitlistSchema.parse(body)
    
    // Check if email already exists
    const { data: existingEmails } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .limit(1)
    
    if (existingEmails && existingEmails.length > 0) {
      return NextResponse.json(
        { message: 'Email is already on the waitlist' },
        { status: 409 }
      )
    }
    
    // Insert the new email
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email, created_at: new Date().toISOString() }])
    
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