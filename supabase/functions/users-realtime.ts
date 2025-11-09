import { serve } from "std/server";
import { handleCorsPreflight, requireUser, jsonResponse, errorResponse } from "./_shared/security.ts";

serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const auth = await requireUser(req, { requireAdmin: true });
    if ("errorResponse" in auth) return auth.errorResponse;

    const { supabase } = auth;
    const url = new URL(req.url);
    const path = url.pathname;
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    switch (path) {
      case "/users/list": {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Error listing profiles:", error);
          return errorResponse(error.message, 500);
        }
        return jsonResponse({ success: true, users: data });
      }

      case "/users/create": {
        const { email, password, first_name, last_name, role, phone, address, city } = body;
        if (!email || !password || !first_name || !last_name || !role) {
          return errorResponse("Missing required fields", 400);
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { first_name, last_name, role },
        });
        if (authError) {
          console.error("Auth createUser error:", authError);
          return errorResponse(authError.message, 400);
        }

        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          email,
          first_name,
          last_name,
          role,
          phone: phone || null,
          address: address || null,
          city: city || null,
          is_active: true,
        });
        if (profileError) {
          console.error("Profile insert error:", profileError);
          return errorResponse(profileError.message, 400);
        }

        return jsonResponse({ success: true, user: authData.user });
      }

      case "/users/update": {
        const { user_id, updates } = body;
        if (!user_id || !updates) return errorResponse("Missing user_id or updates", 400);

        const { error } = await supabase.from("profiles").update(updates).eq("id", user_id);
        if (error) {
          console.error("Profile update error:", error);
          return errorResponse(error.message, 400);
        }

        return jsonResponse({ success: true });
      }

      case "/users/delete": {
        const { user_id } = body;
        if (!user_id) return errorResponse("Missing user_id", 400);

        const { error } = await supabase.from("profiles").delete().eq("id", user_id);
        if (error) {
          console.error("Profile delete error:", error);
          return errorResponse(error.message, 400);
        }

        return jsonResponse({ success: true });
      }

      default:
        return errorResponse("Not found", 404);
    }
  } catch (err: any) {
    console.error("users-realtime unexpected error:", err);
    return errorResponse(err?.message ?? "Internal server error", 500);
  }
});
