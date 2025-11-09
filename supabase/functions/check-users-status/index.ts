import { handleCorsPreflight, requireUser, errorResponse, jsonResponse } from '../_shared/security.ts'

interface UserStatus {
  email: string
  status: 'exists' | 'not_found' | 'error'
  hasProfile: boolean
  emailConfirmed: boolean
  lastSignIn: string | null
  role?: string
  error?: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req, { requireAdmin: true })
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase } = auth

    // Récupérer les emails à vérifier
    const { emails } = await req.json()
    if (!emails || !Array.isArray(emails)) {
      return errorResponse('Emails array required', 400)
    }

    // Récupérer tous les utilisateurs auth
    const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const { data: profiles } = await supabase.from('profiles').select('user_id, email, role')

    const userStatuses: UserStatus[] = emails.map((email: string) => {
      const authUser = authUsers.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
      const profile = profiles?.find(p => p.user_id === authUser?.id || (p.email || '').toLowerCase() === email.toLowerCase())

      if (!authUser) {
        return {
          email,
          status: 'not_found',
          hasProfile: false,
          emailConfirmed: false,
          lastSignIn: null,
          error: 'User not found',
        }
      }

      return {
        email,
        status: 'exists',
        hasProfile: !!profile,
        emailConfirmed: authUser.email_confirmed_at !== null,
        lastSignIn: authUser.last_sign_in_at,
        role: profile?.role,
      }
    })

    return jsonResponse({
      success: true,
      users: userStatuses,
      total: userStatuses.length,
    })
  } catch (error) {
    console.error('Error in secure check-users-status:', error)
    return errorResponse((error as any).message ?? 'Internal server error', 500)
  }
})