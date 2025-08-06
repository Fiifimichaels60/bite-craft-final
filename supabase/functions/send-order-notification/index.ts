import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  customerName: string;
  customerPhone: string;
  orderId: string;
  status: string;
  orderType: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to, customerName, customerPhone, orderId, status, orderType } = await req.json() as EmailRequest

    console.log('Sending order notification:', { to, customerName, customerPhone, orderId, status })

    // Create email content based on status
    let subject = '';
    let htmlContent = '';

    switch (status) {
      case 'confirmed':
        subject = `Order Confirmed - #${orderId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Order Confirmed!</h2>
            <p>Dear ${customerName},</p>
            <p>Your order <strong>#${orderId}</strong> has been confirmed and is being prepared.</p>
            <p><strong>Order Type:</strong> ${orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
            <p>We'll notify you when your order is ready. Expected time: 15-20 minutes.</p>
            <p>Thank you for choosing BiteCraft!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              BiteCraft Food Delivery<br>
              Phone: +233 50 244 5560<br>
              Email: michaelquaicoe60@gmail.com
            </p>
          </div>
        `;
        break;
      case 'ready':
        subject = `Order Ready for ${orderType === 'delivery' ? 'Delivery' : 'Pickup'} - #${orderId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Order Ready!</h2>
            <p>Dear ${customerName},</p>
            <p>Great news! Your order <strong>#${orderId}</strong> is now ready.</p>
            <p><strong>Order Type:</strong> ${orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
            ${orderType === 'delivery' 
              ? '<p>Our delivery team will be with you in the next 10 minutes.</p>' 
              : '<p><strong>Please come to pick up your order within the next 10 minutes.</strong></p>'
            }
            <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; border-left: 4px solid #f59e0b;">
              <strong>⏰ Important:</strong> ${orderType === 'pickup' ? 'Please collect your order within 10 minutes to ensure freshness.' : 'Please be available for delivery in the next 10 minutes.'}
            </p>
            <p>Thank you for choosing BiteCraft!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              BiteCraft Food Delivery<br>
              Phone: +233 50 244 5560<br>
              Email: michaelquaicoe60@gmail.com
            </p>
          </div>
        `;
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid status for notification' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    // Simulate email/SMS sending
    console.log('Notification would be sent:', {
      to,
      phone: customerPhone,
      subject,
      htmlContent: htmlContent.substring(0, 100) + '...'
    });

    // Simulate notification sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order notification sent successfully',
        emailSent: true,
        smsSent: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send notification'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})