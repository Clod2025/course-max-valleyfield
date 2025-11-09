import {
  corsHeaders as defaultCorsHeaders,
  handleCorsPreflight,
  requireUser,
  errorResponse,
  jsonResponse,
} from '../_shared/security.ts'

const corsHeaders = {
  ...defaultCorsHeaders,
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || defaultCorsHeaders['Access-Control-Allow-Origin'],
} as const

interface LookupRequest {
  email: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req, { requireAdmin: true })
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase } = auth
    const { email }: LookupRequest = await req.json()

    if (!email) {
      return errorResponse('Email requis', 400)
    }

    console.log(`Looking up user by email: ${email}`)

    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) {
      console.error('Error listing users:', listError)
      return errorResponse(listError.message, 500)
    }

    const found = list.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())

    return jsonResponse(
      found
        ? { success: true, status: 'success', exists: true, user: { id: found.id, email: found.email } }
        : { success: true, status: 'not_found', exists: false, message: 'User not found' },
    )
  } catch (error: any) {
    console.error('Function error (get-user-by-email):', error)
    return errorResponse(error?.message ?? 'Internal server error', 500)
  }
})
