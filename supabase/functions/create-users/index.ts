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

    // Create each user
    for (const userData of users) {
      try {
        const { email, password, metadata = {} } = userData;
        
        if (!email || !password) {
          results.push({
            id: `temp-${email || 'unknown'}`,
            email: email || 'unknown',
            status: 'error',
            message: 'Email and password are required'
          });
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
          const msg = (error as any)?.message || '';
          let status: 'error' | 'exists' = 'error'
          let resolvedId: string = data?.user?.id || `temp-${email}`
          let friendly = msg

          if (/duplicate key|already registered|exists/i.test(msg)) {
            status = 'exists'
            friendly = 'User already exists'
            try {
              const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
              if (!listErr) {
                const found = list.users?.find((u: any) => (u.email || '').toLowerCase() === String(email).toLowerCase())
                if (found?.id) resolvedId = found.id
              }
            } catch (e) {
              console.error('Lookup existing user failed:', e)
            }
          }

          results.push({ id: resolvedId, email, status, message: friendly })
        } else {
          console.log(`Successfully created user: ${email} with ID: ${data.user.id}`);
          results.push({
            id: data.user.id,
            email,
            status: 'success',
            message: 'User created successfully'
          });
        }
      } catch (err) {
        console.error(`Exception creating user ${userData.email}:`, err);
        results.push({
          id: `temp-${userData.email || 'unknown'}`,
          email: userData.email || 'unknown',
          status: 'error',
          message: err.message
        });
      }
    }

    const createdCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    const response = {
      success: true,
      createdCount,
      errorCount,
      results
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