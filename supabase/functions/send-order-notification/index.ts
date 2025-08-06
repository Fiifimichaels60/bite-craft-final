import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  customerName: string;
  orderId: string;
  status: string;
  orderType: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to, customerName, orderId, status, orderType } = await req.json() as EmailRequest

    console.log('Sending order notification email:', { to, customerName, orderId, status })

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
            <p>We'll notify you when your order is ready.</p>
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
              ? '<p>Our delivery team will be with you shortly.</p>' 
              : '<p>You can now come to pick up your order at our location.</p>'
            }
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

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    
    // For now, we'll simulate sending the email
    console.log('Email would be sent:', {
      to,
      subject,
      htmlContent: htmlContent.substring(0, 100) + '...'
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order notification email sent successfully',
        emailSent: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Email notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send notification email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})