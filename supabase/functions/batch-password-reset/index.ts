declare const Deno: any;
import {
  handleCorsPreflight,
  requireUser,
  errorResponse,
  jsonResponse,
} from '../_shared/security.ts'

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

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req, { requireAdmin: true })
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase } = auth

    // 3️⃣ Récupération des données de la requête
    const body: BatchPasswordResetRequest = await req.json()
    if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
      return errorResponse('No users provided', 400)
    }

    // 5️⃣ Pagination sécurisée pour récupérer tous les users
    const results: BatchPasswordResetResult[] = []
    let page = 1
    const perPage = 100
    let allUsers: any[] = []

    while (true) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage })
      if (!data?.users || data.users.length === 0) break;
      allUsers = allUsers.concat(data.users)
      if (data.users.length < perPage) break
      page++
    }

    // 6️⃣ Traitement de chaque user
    for (const u of body.users) {
      const targetUser = allUsers.find((x) => x.email?.toLowerCase() === u.email.toLowerCase())
      if (!targetUser) {
        results.push({ email: u.email, success: false, message: 'User not found' })
        continue
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, { password: u.newPassword })
      if (updateError) {
        results.push({ email: u.email, success: false, message: updateError.message })
      } else {
        results.push({ email: u.email, success: true, message: 'Password updated successfully' })
      }
    }

    return jsonResponse({ success: true, results })
  } catch (err: any) {
    console.error('batch-password-reset error:', err)
    return errorResponse(err?.message ?? 'Internal server error', 500)
  }
})