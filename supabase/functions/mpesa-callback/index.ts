import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return new Response(JSON.stringify({ ResponseCode: '1', ResponseDescription: 'Empty body' }), {
        status: 200, // M-Pesa prefers 200 even for errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(requestText);
    } catch (e) {
      console.error('Failed to parse callback JSON:', requestText);
      return new Response(JSON.stringify({ ResponseCode: '1', ResponseDescription: 'Invalid JSON' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('M-Pesa callback received:', JSON.stringify(payload, null, 2));

    // The standard property name is stkCallback, not sdkCallback
    const stkCallback = payload.Body.stkCallback || payload.Body.sdkCallback;

    if (!stkCallback) {
      console.error('Invalid M-Pesa callback structure: stkCallback missing');
      return new Response(JSON.stringify({ ResponseCode: '1', ResponseDescription: 'Invalid structure' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    let MpesaReceiptNumber = null;
    let Amount = null;
    let TransactionDate = null;

    if (CallbackMetadata && CallbackMetadata.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') MpesaReceiptNumber = item.Value;
        if (item.Name === 'Amount') Amount = item.Value;
        if (item.Name === 'TransactionDate') TransactionDate = item.Value;
      }
    }

    const transactionStatus = ResultCode === 0 ? 'completed' : 'failed';

    const { data, error } = await supabaseClient
      .from('mpesa_transactions')
      .update({
        status: transactionStatus,
        mpesa_receipt_number: MpesaReceiptNumber,
        result_code: ResultCode,
        result_desc: ResultDesc,
      })
      .eq('checkout_request_id', CheckoutRequestID)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
    } else {
      console.log('M-Pesa transaction updated:', data);
    }

    // M-Pesa expects ResponseCode: 0 for success
    return new Response(JSON.stringify({ ResponseCode: '0', ResponseDescription: 'Accepted' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ ResponseCode: '0', ResponseDescription: 'Internal Server Error Handled' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
