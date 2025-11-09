import {
  corsHeaders,
  errorResponse,
  handleCorsPreflight,
  jsonResponse,
  requireUser,
} from '../_shared/security.ts';

Deno.serve(async (req) => {
  const cors = handleCorsPreflight(req);
  if (cors) {
    return cors;
  }

  try {
    const auth = await requireUser(req, { requireAdmin: true });
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    const { supabase } = auth;
    const body = await req.json();
    const users = body?.users;

    if (!Array.isArray(users) || users.length === 0) {
      return errorResponse('Invalid users array', 400);
    }

    const results: Array<Record<string, unknown>> = [];

    for (const userData of users) {
      try {
        const { email, password, metadata = {} } = userData ?? {};

        if (!email || !password) {
          results.push({
            id: `temp-${email || 'unknown'}`,
            email: email || 'unknown',
            status: 'error',
            message: 'Email and password are required',
          });
          continue;
        }

        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: metadata,
          email_confirm: true,
        });

        if (error) {
          const msg = (error as { message?: string })?.message ?? '';
          let status: 'error' | 'exists' = 'error';
          let resolvedId: string = data?.user?.id ?? `temp-${email}`;
          let friendly = msg || 'Unknown error';

          if (/duplicate key|already registered|exists/i.test(msg)) {
            status = 'exists';
            friendly = 'User already exists';
            try {
              const { data: list } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });
              const found = list?.users?.find(
                (u: { email?: string; id?: string }) =>
                  (u.email ?? '').toLowerCase() === String(email).toLowerCase(),
              );
              if (found?.id) {
                resolvedId = found.id;
              }
            } catch {
              // Ignorer les erreurs de lookup
            }
          }

          results.push({ id: resolvedId, email, status, message: friendly });
        } else if (data?.user?.id) {
          results.push({
            id: data.user.id,
            email,
            status: 'success',
            message: 'User created successfully',
          });
        } else {
          results.push({
            id: `temp-${email}`,
            email,
            status: 'error',
            message: 'User creation returned no data',
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error';
        results.push({
          id: `temp-${userData?.email || 'unknown'}`,
          email: userData?.email || 'unknown',
          status: 'error',
          message,
        });
      }
    }

    const createdCount = results.filter(
      (r) => r.status === 'success',
    ).length;
    const errorCount = results.filter(
      (r) => r.status === 'error',
    ).length;

    return jsonResponse({
      success: true,
      createdCount,
      errorCount,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur inattendue';
    console.error('Erreur fonction create-users:', error);
    return errorResponse(message, 500);
  }
});