import { createClient } from '@supabase/supabase-js';
import type { Product, Transaction, User } from './types';

// The Supabase URL and anon key are now hardcoded with the user's project details.
const supabaseUrl = 'https://bjoosqbstrmijjkevlgw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb29zcWJzdHJuaWpqa2V3bGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzU2NDQsImV4cCI6MjA3NDA1MTY0NH0.vk1EmC7V6BwGAVmt_sukBR2aWFS2_fVSG9ftgmsJ01Y';

// A custom type for the Supabase client to provide type safety.
// This ensures that when we interact with tables like 'products',
// the client knows about the specific row types (Product, User, Transaction).
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id'>;
        // FIX: Supabase's generic types can incorrectly resolve to `never` if the Update
        // type allows modification of primary keys. Explicitly omitting `id` makes the
        // type definition more precise and resolves the issue for update and insert operations.
        Update: Partial<Omit<Product, 'id'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id'>;
        // FIX: Similar to the 'products' table, explicitly omitting the primary key `id` from
        // the Update type prevents type inference issues that lead to `never`.
        Update: Partial<Omit<User, 'id'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'timestamp'>;
        // FIX: For transactions, both the primary key `id` and the auto-generated `timestamp`
        // should be omitted from the Update type to ensure type safety and prevent errors.
        Update: Partial<Omit<Transaction, 'id' | 'timestamp'>>;
      };
    };
  };
}


if (!supabaseUrl || !supabaseAnonKey) {
  // Instead of throwing an error that crashes the app,
  // we'll return a helpful message in the UI by exporting a null client.
  // The useInventory hook will handle this case.
  console.error("Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set.");
}


export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;