import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  orderId: string
  callbackUrl?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Paystack payment request received')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const { amount, customerName, customerEmail, customerPhone, orderId, callbackUrl } = requestBody as PaymentRequest

    // Validate required fields
    if (!amount || !customerName || !customerEmail || !orderId) {
      console.error('Missing required fields:', { amount, customerName, customerEmail, orderId })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: amount, customerName, customerEmail, or orderId'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Use the actual Paystack secret key
    const paystackSecretKey = 'sk_live_84b49fd5fb26f8609e93f0f3d99203b9a23f435c'

    console.log('Using Paystack secret key:', paystackSecretKey.substring(0, 15) + '...')

    if (!paystackSecretKey) {
      console.error('Paystack credentials not found')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment gateway not configured. Please contact support.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Convert amount to pesewas (Paystack uses pesewas for GHS)
    const amountInPesewas = Math.round(amount * 100)

    // Prepare payment request for Paystack Initialize Transaction API
    const paymentData = {
      email: customerEmail,
      amount: amountInPesewas,
      currency: 'GHS', // Ghana Cedis
      reference: orderId,
      callback_url: callbackUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystack-callback`,
      metadata: {
        customer_name: customerName,
        customer_phone: customerPhone,
        order_id: orderId,
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: customerName
          },
          {
            display_name: "Phone Number",
            variable_name: "customer_phone", 
            value: customerPhone
          }
        ]
      }
    }

    console.log('Payment data prepared:', JSON.stringify(paymentData, null, 2))

    // Make request to Paystack Initialize Transaction API  
    console.log('Making request to Paystack API...')
    
    let paystackResponse
    try {
      paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(paymentData)
      })
    } catch (fetchError) {
      console.error('Fetch error when calling Paystack API:', fetchError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Network error when contacting payment gateway: ${fetchError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    console.log('Paystack response status:', paystackResponse.status)
    console.log('Paystack response headers:', Object.fromEntries(paystackResponse.headers.entries()))
    
    const responseText = await paystackResponse.text()
    console.log('Paystack raw response:', responseText)
    
    let paystackResult
    try {
      paystackResult = JSON.parse(responseText)
      console.log('Parsed Paystack response:', JSON.stringify(paystackResult, null, 2))
    } catch (e) {
      console.error('Failed to parse Paystack response:', e)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid response from payment gateway: ${responseText.substring(0, 200)}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!paystackResponse.ok || !paystackResult.status) {
      console.error('Paystack API error:', paystackResponse.status, paystackResult)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment gateway error (${paystackResponse.status}): ${paystackResult.message || 'Payment initialization failed'}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const authorizationUrl = paystackResult.data?.authorization_url
    const accessCode = paystackResult.data?.access_code
    const reference = paystackResult.data?.reference

    console.log('Extracted from response:', { authorizationUrl, accessCode, reference })

    if (!authorizationUrl) {
      console.error('No authorization URL in response')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid payment response - no authorization URL provided'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Update order with payment reference
    console.log('Updating order with payment reference...')
    const { error: updateError } = await supabase
      .from('nana_orders')
      .update({ 
        payment_reference: reference,
        payment_status: 'pending'
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
    } else {
      console.log('Order updated successfully')
    }

    console.log('Payment initiation successful')
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: authorizationUrl,
        reference: reference,
        accessCode: accessCode,
        message: 'Payment initiated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment processing failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})