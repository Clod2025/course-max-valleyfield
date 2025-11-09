import {
  corsHeaders,
  handleCorsPreflight,
  requireUser,
} from '../_shared/security.ts';

interface AcceptAssignmentRequest {
  assignment_id: string;
  driver_id: string;
}

Deno.serve(async (req) => {
  const cors = handleCorsPreflight(req);
  if (cors) {
    return cors;
  }

  try {
    const auth = await requireUser(req);
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    const { supabase } = auth;

    const { assignment_id, driver_id }: AcceptAssignmentRequest = await req.json();

    if (!assignment_id || !driver_id) {
      return new Response(
        JSON.stringify({ error: 'assignment_id and driver_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Driver ${driver_id} accepting assignment ${assignment_id}`);

    // Utiliser la fonction PostgreSQL pour accepter l'assignation
    const { data, error } = await supabase.rpc('accept_driver_assignment', {
      p_assignment_id: assignment_id,
      p_driver_id: driver_id
    });

    if (error) {
      console.error('Error accepting assignment:', error);
      throw error;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Assignation non disponible ou expirée' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les détails de l'assignation acceptée
    const { data: assignment, error: fetchError } = await supabase
      .from('driver_assignments')
      .select(`
        *,
        stores!inner(name, address, city),
        orders!inner(id, order_number, delivery_address, delivery_city, total_amount)
      `)
      .eq('id', assignment_id)
      .single();

    if (fetchError) {
      console.error('Error fetching assignment details:', fetchError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assignation acceptée avec succès',
        assignment: assignment
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
