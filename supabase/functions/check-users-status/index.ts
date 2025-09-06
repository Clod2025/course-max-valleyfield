import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserStatus {
  email: string;
  status: 'exists' | 'not_found' | 'error';
  hasProfile: boolean;
  emailConfirmed: boolean;
  lastSignIn: string | null;
  role?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vexgjrrqbjurgiqfjxwk.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Emails array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking status for ${emails.length} users: ${emails.join(', ')}`);

    // Récupérer tous les utilisateurs Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ 
      page: 1, 
      perPage: 1000 
    });

    if (authError) {
      console.error('Error listing auth users:', authError);
      return new Response(
        JSON.stringify({ success: false, message: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer tous les profils
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, role');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const userStatuses: UserStatus[] = [];

    for (const email of emails) {
      try {
        // Trouver l'utilisateur dans auth.users
        const authUser = authUsers.users?.find(
          (u: any) => (u.email || '').toLowerCase() === email.toLowerCase()
        );

        if (!authUser) {
          userStatuses.push({
            email,
            status: 'not_found',
            hasProfile: false,
            emailConfirmed: false,
            lastSignIn: null,
            error: 'Utilisateur non trouvé dans auth.users'
          });
          continue;
        }

        // Trouver le profil correspondant
        const profile = profiles?.find(
          (p: any) => p.user_id === authUser.id || (p.email || '').toLowerCase() === email.toLowerCase()
        );

        userStatuses.push({
          email,
          status: 'exists',
          hasProfile: !!profile,
          emailConfirmed: authUser.email_confirmed_at !== null,
          lastSignIn: authUser.last_sign_in_at,
          role: profile?.role,
        });

        console.log(`✅ ${email}: exists, profile=${!!profile}, confirmed=${authUser.email_confirmed_at !== null}`);

      } catch (error) {
        console.error(`Error checking ${email}:`, error);
        userStatuses.push({
          email,
          status: 'error',
          hasProfile: false,
          emailConfirmed: false,
          lastSignIn: null,
          error: (error as any).message
        });
      }
    }

    const response = {
      success: true,
      users: userStatuses,
      timestamp: new Date().toISOString(),
      total: userStatuses.length,
      summary: {
        exists: userStatuses.filter(u => u.status === 'exists').length,
        not_found: userStatuses.filter(u => u.status === 'not_found').length,
        errors: userStatuses.filter(u => u.status === 'error').length,
        with_profiles: userStatuses.filter(u => u.hasProfile).length,
        email_confirmed: userStatuses.filter(u => u.emailConfirmed).length,
      }
    };

    console.log('Status check completed:', response.summary);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error (check-users-status):', error);
    return new Response(
      JSON.stringify({ success: false, message: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});