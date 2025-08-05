import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id, payment_status, order_status } = await req.json()

    console.log(`Manual update request for order ${order_id}:`, {
      payment_status,
      order_status
    })

    if (!order_id) {
      throw new Error('Order ID is required')
    }

    // Update the order in database
    const { data: updatedOrder, error: updateError } = await supabase
      .from('nana_orders')
      .update({
        payment_status: payment_status || 'paid',
        status: order_status || 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    console.log(`Order ${order_id} successfully updated:`, updatedOrder)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order updated successfully',
        order: updatedOrder
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Manual update error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Update failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})