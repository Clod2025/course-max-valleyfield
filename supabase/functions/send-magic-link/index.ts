declare const Deno: any;
import {
  handleCorsPreflight,
  requireUser,
  errorResponse,
  jsonResponse,
} from '../_shared/security.ts'

interface MagicLinkRequest {
  email: string
  redirectUrl?: string
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req, { requireAdmin: true })
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase } = auth

    // Lire la requête
    const body: MagicLinkRequest = await req.json()
    if (!body.email) {
      return errorResponse('Email is required', 400)
    }

    // Générer le magic link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: body.email,
      options: body.redirectUrl ? { redirectTo: body.redirectUrl } : undefined,
    } as any)

    if (error) {
      return errorResponse(error.message, 400)
    }

    return jsonResponse({
      success: true,
      message: 'Magic link generated successfully',
      user: { id: data?.user?.id, email: data?.user?.email },
    })
  } catch (err: any) {
    console.error('send-magic-link error:', err)
    return errorResponse(err?.message ?? 'Internal server error', 500)
  }
})