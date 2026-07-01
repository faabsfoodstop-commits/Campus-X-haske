import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to call Edge Functions
export const callEdgeFunction = async (
  functionName: string,
  payload: Record<string, any>
) => {
  const { data: session } = await supabase.auth.getSession();

  if (!session?.session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Function call failed');
  }

  return response.json();
};

// Export types for TypeScript support
export type { Session } from '@supabase/supabase-js';
