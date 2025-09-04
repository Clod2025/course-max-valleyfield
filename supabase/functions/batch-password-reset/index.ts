import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchPasswordResetRequest {
  users: {
    email: string;
    newPassword: string;
  }[];
}

interface BatchPasswordResetResult {
  email: string;
  success: boolean;
  message: string;
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

    const { users }: BatchPasswordResetRequest = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No users provided or invalid format' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing batch password reset for ${users.length} users`);

    const results: BatchPasswordResetResult[] = [];

    // Get all users from auth to resolve emails to IDs
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers({ 
      page: 1, 
      perPage: 1000 
    });

    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to list users: ${listError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const userRequest of users) {
      try {
        const { email, newPassword } = userRequest;

        if (!email || !newPassword) {
          results.push({
            email: email || 'unknown',
            success: false,
            message: 'Email and password are required'
          });
          continue;
        }

        // Find user by email
        const targetUser = allUsers.users?.find(
          (u: any) => (u.email || '').toLowerCase() === email.toLowerCase()
        );

        if (!targetUser) {
          results.push({
            email,
            success: false,
            message: 'User not found'
          });
          continue;
        }

        console.log(`Updating password for user: ${targetUser.id} (${email})`);

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          targetUser.id, 
          { password: newPassword }
        );

        if (updateError) {
          console.error(`Error updating password for ${email}:`, updateError);
          results.push({
            email,
            success: false,
            message: updateError.message
          });
        } else {
          results.push({
            email,
            success: true,
            message: 'Password updated successfully'
          });
        }

      } catch (error) {
        console.error(`Error processing user ${userRequest.email}:`, error);
        results.push({
          email: userRequest.email || 'unknown',
          success: false,
          message: `Processing error: ${(error as any).message}`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    const response = {
      success: successCount === totalCount,
      message: `Processed ${totalCount} users: ${successCount} succeeded, ${totalCount - successCount} failed`,
      results,
      summary: {
        total: totalCount,
        succeeded: successCount,
        failed: totalCount - successCount
      }
    };

    console.log('Batch password reset completed:', response.summary);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error (batch-password-reset):', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Internal error: ${(error as any).message}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});