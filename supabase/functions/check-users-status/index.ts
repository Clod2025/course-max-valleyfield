import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];

    for (const userId of userIds) {
      try {
        console.log(`Checking user status: ${userId}`);
        
        const { data: user, error } = await supabase.auth.admin.getUserById(userId);
        
        if (error) {
          console.error(`Error checking user ${userId}:`, error);
          results.push({
            id: userId,
            email: `user-${userId.substring(0, 8)}@test.com`,
            status: 'error',
            message: error.message
          });
        } else if (user) {
          console.log(`User ${userId} exists:`, user.email);
          results.push({
            id: userId,
            email: user.email || `user-${userId.substring(0, 8)}@test.com`,
            status: 'success',
            message: 'User exists'
          });
        } else {
          console.log(`User ${userId} not found`);
          results.push({
            id: userId,
            email: `user-${userId.substring(0, 8)}@test.com`,
            status: 'error',
            message: 'User not found'
          });
        }
      } catch (error) {
        console.error(`Exception checking user ${userId}:`, error);
        results.push({
          id: userId,
          email: `user-${userId.substring(0, 8)}@test.com`,
          status: 'error',
          message: error.message
        });
      }
    }

    const response = {
      success: true,
      users: results,
      checkedCount: results.length
    };

    console.log('Check status completed:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in check-users-status function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});