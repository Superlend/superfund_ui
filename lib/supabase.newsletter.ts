import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_NEWSLETTER_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_NEWSLETTER_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.NEWSLETTER_SUPABASE_SERVICE_ROLE_KEY as string;

// Client for use on the client side
export const newsletterClient = createClient(supabaseUrl, supabaseAnonKey);

// Client for use on the server side with higher privileges
export const newsletterServer = createClient(supabaseUrl, supabaseServiceKey);

// Check if we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Newsletter Supabase environment variables. Please check your .env file.');
}

// Database schema type definitions
export type NewsletterTables = {
  newsletter_subscribers: {
    id: string;
    email: string;
    wallet_address: string | null;
    portfolio_value: number | null;
    timestamp: string;
    created_at: string;
  };
}; 