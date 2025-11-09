import { handleCorsPreflight, requireUser, errorResponse, jsonResponse } from '../_shared/security.ts'

interface PasswordResetRequest {
  email: string
  redirectUrl?: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req, { requireAdmin: true })
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase } = auth
    const { email, redirectUrl }: PasswordResetRequest = await req.json()

    if (!email) {
      return errorResponse('Email requis', 400)
    }

    console.log(`Generating password reset link for: ${email}`)

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: redirectUrl ? { redirectTo: redirectUrl } : undefined,
    } as any)

    if (error) {
      console.error('Error generating reset link:', error)
      return errorResponse(error.message, 400)
    }

    return jsonResponse({
      success: true,
      status: 'success',
      message: 'Password reset link generated',
      user: { id: data?.user?.id, email: data?.user?.email },
      action_link: (data as any)?.action_link,
      email_otp: (data as any)?.email_otp,
    })
  } catch (error: any) {
    console.error('Function error (send-password-reset):', error)
    return errorResponse(error?.message ?? 'Internal server error', 500)
  }
})
