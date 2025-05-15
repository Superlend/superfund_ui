import { NextResponse } from 'next/server'
import { newsletterServer } from '@/lib/supabase.newsletter'

export async function POST(request: Request) {
  try {
    const { email, wallet_address, portfolio_value } = await request.json()

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingEmail } = await newsletterServer
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email already subscribed' },
        { status: 409 }
      )
    }

    // Insert new subscriber
    const { error } = await newsletterServer.from('newsletter_subscribers').insert([
      {
        email,
        wallet_address: wallet_address || null,
        portfolio_value: portfolio_value || null,
      },
    ])

    if (error) {
      console.error('Error inserting subscriber:', error)
      return NextResponse.json(
        { message: 'Failed to subscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 