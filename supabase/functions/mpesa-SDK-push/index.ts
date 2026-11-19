import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';
import { Buffer } from 'https://deno.land/std@0.177.0/node/buffer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StkPushPayload {
  amount: number;
  phoneNumber: string;
  orderId: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for RLS bypass
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  try {
    const requestText = await req.text();
    if (!requestText) {
      return new Response(JSON.stringify({ error: 'Request body is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let payload: StkPushPayload;
    try {
      payload = JSON.parse(requestText);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: requestText }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, phoneNumber, orderId, userId } = payload;

    if (!amount || !phoneNumber || !orderId) {
      return new Response(JSON.stringify({ error: 'Missing amount, phoneNumber, or orderId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY');
    const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET');
    const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE');
    const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY');
    const MPESA_CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL');

    const missingVars = [];
    if (!MPESA_CONSUMER_KEY) missingVars.push('MPESA_CONSUMER_KEY');
    if (!MPESA_CONSUMER_SECRET) missingVars.push('MPESA_CONSUMER_SECRET');
    if (!MPESA_SHORTCODE) missingVars.push('MPESA_SHORTCODE');
    if (!MPESA_PASSKEY) missingVars.push('MPESA_PASSKEY');
    if (!MPESA_CALLBACK_URL) missingVars.push('MPESA_CALLBACK_URL');

    if (missingVars.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'M-Pesa environment variables not set on Supabase', 
        details: `Missing: ${missingVars.join(', ')}. Use 'supabase secrets set' to add them.` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get M-Pesa Access Token
    const authString = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('Safaricom Token Error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to authenticate with Safaricom', 
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenText = await tokenRes.text();
    let access_token: string | null = null;
    try {
      const tokenData = JSON.parse(tokenText);
      access_token = tokenData.access_token;
    } catch (e) {
      console.error('Failed to parse Safaricom token response:', tokenText);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from Safaricom token API', 
        details: tokenText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!access_token) {
      return new Response(JSON.stringify({ error: 'M-Pesa access token missing in response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // 2. Initiate STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const sdkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: orderId,
      TransactionDesc: `Payment for Order ${orderId}`,
    };

    const sdkPushRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sdkPushPayload),
    });
    
    const sdkPushText = await sdkPushRes.text();
    let sdkPushData: any;
    try {
      sdkPushData = JSON.parse(sdkPushText);
    } catch (e) {
      console.error('Failed to parse Safaricom response:', sdkPushText);
      sdkPushData = { ResponseCode: '999', ResponseDescription: sdkPushText || 'Empty response from Safaricom' };
    }

    if (sdkPushData.ResponseCode !== '0') {
      console.error('SDK Push Error:', sdkPushData.ResponseCode, sdkPushData.ResponseDescription);
      return new Response(JSON.stringify({ error: sdkPushData.ResponseDescription || 'SDK Push failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Store initial transaction details in Supabase
    const { data, error } = await supabaseClient.from('mpesa_transactions').insert({
      checkout_request_id: sdkPushData.CheckoutRequestID,
      merchant_request_id: sdkPushData.MerchantRequestID,
      phone_number: phoneNumber,
      amount: amount,
      order_id: orderId,
      user_id: userId || null,
      status: 'pending',
      result_code: sdkPushData.ResponseCode,
      result_desc: sdkPushData.ResponseDescription,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save transaction details' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'STK Push initiated successfully',
      checkoutRequestId: sdkPushData.CheckoutRequestID,
      merchantRequestId: sdkPushData.MerchantRequestID,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
