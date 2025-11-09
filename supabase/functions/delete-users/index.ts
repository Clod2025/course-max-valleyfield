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
    const userIds = body?.userIds;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse('Invalid userIds array', 400);
    }

    const results: Array<Record<string, unknown>> = [];

    for (const rawUserId of userIds) {
      const userId = String(rawUserId ?? '').trim();

      if (!userId) {
        results.push({
          id: rawUserId,
          status: 'error',
          message: 'User ID manquant',
        });
        continue;
      }

      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
          results.push({
            id: userId,
            status: 'error',
            message: error.message,
          });
        } else {
          results.push({
            id: userId,
            status: 'success',
            message: 'User deleted successfully',
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error';
        results.push({
          id: userId,
          status: 'error',
          message,
        });
      }
    }

    const deletedCount = results.filter(
      (r) => r.status === 'success',
    ).length;
    const errorCount = results.filter(
      (r) => r.status === 'error',
    ).length;

    return jsonResponse({
      success: true,
      deletedCount,
      errorCount,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur inattendue';
    console.error('Erreur fonction delete-users:', error);
    return errorResponse(message, 500);
  }
});