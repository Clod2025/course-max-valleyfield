import { handleCorsPreflight, requireUser, errorResponse, jsonResponse } from '../_shared/security.ts'

interface UpdatePasswordRequest {
  userId?: string
  email?: string
  newPassword: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req, { requireAdmin: true })
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase } = auth

    const { userId, email, newPassword }: UpdatePasswordRequest = await req.json()
    if (!newPassword) {
      return errorResponse('newPassword est requis', 400)
    }

    let targetUserId = userId

    if (!targetUserId && email) {
      const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listError) {
        console.error('Error listing users:', listError)
        return errorResponse(listError.message, 500)
      }
      const found = list.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
      targetUserId = found?.id
    }

    if (!targetUserId) {
      return errorResponse('Utilisateur introuvable', 404)
    }

    console.log(`Updating password for user: ${targetUserId}${email ? ` (${email})` : ''}`)

    const { data, error } = await supabase.auth.admin.updateUserById(targetUserId, { password: newPassword })
    if (error) {
      console.error('Error updating password:', error)
      return errorResponse(error.message, 400)
    }

    return jsonResponse({
      success: true,
      status: 'success',
      message: 'Password updated successfully',
      user: { id: data.user?.id, email: data.user?.email },
    })
  } catch (error: any) {
    console.error('Function error (update-user-password):', error)
    return errorResponse(error?.message ?? 'Internal server error', 500)
  }
})
