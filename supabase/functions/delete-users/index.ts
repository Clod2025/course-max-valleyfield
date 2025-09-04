import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = "https://vexgjrrqbjurgiqfjxwk.supabase.co";
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid userIds array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to delete ${userIds.length} users:`, userIds);

    const results = [];
    const errors = [];

    // Delete each user
    for (const userId of userIds) {
      try {
        console.log(`Deleting user: ${userId}`);
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) {
          console.error(`Error deleting user ${userId}:`, error);
          errors.push({ userId, error: error.message });
        } else {
          console.log(`Successfully deleted user: ${userId}`);
          results.push({ userId, status: 'deleted' });
        }
      } catch (err) {
        console.error(`Exception deleting user ${userId}:`, err);
        errors.push({ userId, error: err.message });
      }
    }

    const response = {
      success: true,
      deletedCount: results.length,
      errorCount: errors.length,
      results,
      errors
    };

    console.log('Deletion operation completed:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});