import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, amount, currency, reference, callback_url, customer_name, customer_phone, order_id, metadata } = await req.json()

    // Get Paystack secret key from environment
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'Payment service configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Initializing Paystack payment for order:', order_id)
    console.log('Payment data:', { email, amount, currency, reference })

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency,
        reference,
        callback_url,
        metadata: {
          ...metadata,
          customer_name,
          customer_phone,
          order_id,
        }
      })
    })

    const paystackData = await paystackResponse.json()
    
    console.log('Paystack response status:', paystackResponse.status)
    console.log('Paystack response data:', paystackData)

    if (!paystackResponse.ok) {
      console.error('Paystack API error:', paystackData)
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: paystackData.message || 'Payment initialization failed',
          error: paystackData
        }),
        { 
          status: paystackResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify(paystackData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        status: false, 
        message: 'Internal server error',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})