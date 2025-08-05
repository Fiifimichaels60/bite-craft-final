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

    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    console.log('Paystack webhook received')
    console.log('Signature:', signature)
    console.log('Body length:', body.length)

    const callbackData = JSON.parse(body)
    console.log('Paystack callback received:', JSON.stringify(callbackData, null, 2))

    // Extract payment information from callback
    const { event, data } = callbackData

    if (event !== 'charge.success' && event !== 'charge.failed') {
      console.log('Ignoring event:', event)
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const {
      reference,
      amount,
      status,
      gateway_response,
      customer,
      metadata
    } = data

    console.log('Extracted callback data:', {
      reference,
      amount,
      status,
      gateway_response,
      customer: customer?.email,
      metadata
    })

    if (!reference) {
      console.error('No reference (order ID) in callback')
      throw new Error('Invalid callback - missing order reference')
    }

    // Update order based on payment status
    let orderStatus = 'pending'
    let paymentStatus = 'failed'

    // Check for successful payment
    if (status === 'success' && event === 'charge.success') {
      orderStatus = 'confirmed'
      paymentStatus = 'paid'
    } else if (status === 'pending') {
      paymentStatus = 'pending'
    } else {
      // Failed payment
      orderStatus = 'rejected'
      paymentStatus = 'failed'
    }

    console.log(`Updating order ${reference} with status: ${orderStatus}, payment: ${paymentStatus}`)

    // Update the order in database
    const { error: updateError } = await supabase
      .from('nana_orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        payment_reference: reference,
        updated_at: new Date().toISOString(),
        ...(orderStatus === 'delivered' && { delivered_at: new Date().toISOString() }),
        ...(orderStatus === 'rejected' && { rejected_at: new Date().toISOString() })
      })
      .eq('id', reference)

    if (updateError) {
      console.error('Error updating order from callback:', updateError)
      throw updateError
    }

    console.log(`Order ${reference} successfully updated`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment callback processed successfully',
        orderId: reference,
        status: orderStatus,
        paymentStatus: paymentStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Callback processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Callback processing failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})