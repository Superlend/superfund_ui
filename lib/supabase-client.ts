import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Client for use on the client side
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Client for use on the server side with higher privileges
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// Check if we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Database schema type definitions
export type Tables = {
  telegram_users: {
    id: number;
    wallet_address: string;
    telegram_username: string;
    created_at: string;
    updated_at: string;
  };
}; 