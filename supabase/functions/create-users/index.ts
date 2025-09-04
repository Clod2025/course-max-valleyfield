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

    const { users } = await req.json();

    if (!Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid users array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to create ${users.length} users`);

    const results = [];
    const errors = [];

    // Create each user
    for (const userData of users) {
      try {
        const { email, password, metadata = {} } = userData;
        
        if (!email || !password) {
          errors.push({ email, error: 'Email and password are required' });
          continue;
        }

        console.log(`Creating user: ${email}`);
        
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: metadata,
          email_confirm: true // Auto-confirm email
        });
        
        if (error) {
          console.error(`Error creating user ${email}:`, error);
          errors.push({ email, error: error.message });
        } else {
          console.log(`Successfully created user: ${email} with ID: ${data.user.id}`);
          results.push({ 
            email, 
            userId: data.user.id, 
            status: 'created' 
          });
        }
      } catch (err) {
        console.error(`Exception creating user ${userData.email}:`, err);
        errors.push({ email: userData.email, error: err.message });
      }
    }

    const response = {
      success: true,
      createdCount: results.length,
      errorCount: errors.length,
      results,
      errors
    };

    console.log('Creation operation completed:', response);

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