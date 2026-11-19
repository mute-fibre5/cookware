/**
 * Payment Service Module
 * Handles M-Pesa and Card Payment integrations
 * 
 * Supports:
 * - M-Pesa STK Push
 * - Card Payments (Stripe/Pesapal)
 * - Payment verification
 */

// M-Pesa Configuration (requires actual API credentials from Safaricom)
export const MPESA_CONFIG = {
  // Get these from Safaricom Daraja API
  consumerKey: import.meta.env.VITE_MPESA_CONSUMER_KEY || 'your-consumer-key',
  consumerSecret: import.meta.env.VITE_MPESA_CONSUMER_SECRET || 'your-consumer-secret',
  shortCode: import.meta.env.VITE_MPESA_SHORT_CODE || '174379',
  passkey: import.meta.env.VITE_MPESA_PASSKEY || 'your-passkey',
  callbackUrl: import.meta.env.VITE_MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : ''),
};

// Card Payment Configuration (Pesapal or Stripe)
export const CARD_PAYMENT_CONFIG = {
  provider: import.meta.env.VITE_CARD_PROVIDER || 'pesapal', // 'pesapal' or 'stripe'
  pesapalConsumerKey: import.meta.env.VITE_PESAPAL_CONSUMER_KEY || 'your-key',
  pesapalConsumerSecret: import.meta.env.VITE_PESAPAL_CONSUMER_SECRET || 'your-secret',
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'your-stripe-key',
};

/**
 * M-Pesa Payment Service
 */
export const MpesaService = {
  /**
   * Generate M-Pesa STK Push
   * @param {string} phoneNumber - Customer's M-Pesa registered phone number
   * @param {number} amount - Amount in KES
   * @param {string} orderRef - Order reference/ID
   * @param {string} userId - ID of the logged in user (optional)
   */
  initiateStkPush: async (phoneNumber, amount, orderRef, userId = null) => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Call the deployed Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '');
      const response = await fetch(`${supabaseUrl}/functions/v1/mpesa-SDK-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MPESA_CONFIG.anonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY)}`,
          'apikey': MPESA_CONFIG.anonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY),
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: Math.round(amount),
          orderId: orderRef, // Use orderId to match Edge Function payload
          userId: userId,
        }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = (text && text.trim()) ? JSON.parse(text) : { error: 'Empty JSON response' };
        } catch (e) {
          data = { error: 'Invalid JSON response', details: text };
        }
      } else {
        data = { error: text || `HTTP error! status: ${response.status}` };
      }

      if (!response.ok) {
        console.error('M-Pesa Edge Function Error:', data);
        throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        return {
          success: true,
          message: `STK Push sent to ${phoneNumber}. Check your phone and enter your M-Pesa PIN.`,
          checkoutRequestId: data.checkoutRequestId,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to initiate M-Pesa payment',
        };
      }
    } catch (error) {
      console.error('M-Pesa STK Push initiation error:', error);
      return {
        success: false,
        message: 'Payment service unavailable. Please try again later.',
        error: error.message,
      };
    }
  },

  /**
   * Check M-Pesa payment status
   * @param {string} checkoutRequestId - Checkout request ID from STK Push
   */
  checkPaymentStatus: async (checkoutRequestId) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '');
      const response = await fetch(`${supabaseUrl}/functions/v1/mpesa-check-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MPESA_CONFIG.anonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY)}`,
          'apikey': MPESA_CONFIG.anonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY),
        },
        body: JSON.stringify({
          checkoutRequestId: checkoutRequestId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return (text && text.trim()) ? JSON.parse(text) : { success: false, message: 'Empty response from server' };
      } catch (e) {
        return { success: false, message: 'Invalid JSON response from server', details: text };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { success: false, message: error.message };
    }
  },
};

/**
 * Card Payment Service (Pesapal)
 */
export const PesapalService = {
  /**
   * Initialize Pesapal payment
   * @param {number} amount - Amount in KES
   * @param {string} orderRef - Order reference
   * @param {object} customerInfo - {email, phone, firstName, lastName}
   */
  initiatePayment: async (amount, orderRef, customerInfo) => {
    try {
      const response = await fetch('/api/pesapal/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'KES',
          orderRef: orderRef,
          description: `Cookware Store Order ${orderRef}`,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          customerFirstName: customerInfo.firstName,
          customerLastName: customerInfo.lastName,
          callbackUrl: `${window.location.origin}/payment-callback`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let data;
      try {
        data = (text && text.trim()) ? JSON.parse(text) : { error: 'Empty response from server' };
      } catch (e) {
        data = { error: 'Invalid JSON response from server', details: text };
      }

      if (data.success && data.redirectUrl) {
        // Redirect to Pesapal payment page
        window.location.href = data.redirectUrl;
      } else {
        return {
          success: false,
          message: data.message || 'Failed to initialize Pesapal payment',
        };
      }
    } catch (error) {
      console.error('Pesapal error:', error);
      return {
        success: false,
        message: `Error initiating payment: ${error.message}`,
      };
    }
  },

  /**
   * Check payment status
   * @param {string} transactionTrackingId - Pesapal transaction tracking ID
   */
  checkPaymentStatus: async (transactionTrackingId) => {
    try {
      const response = await fetch('/api/pesapal/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionTrackingId: transactionTrackingId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      try {
        return (text && text.trim()) ? JSON.parse(text) : { success: false, message: 'Empty response from server' };
      } catch (e) {
        return { success: false, message: 'Invalid JSON response from server', details: text };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { success: false, message: error.message };
    }
  },
};

/**
 * Format phone number for M-Pesa
 * Converts 0712345678 to 254712345678
 */
function formatPhoneNumber(phone) {
  // Remove any spaces or dashes
  let cleaned = phone.replace(/[\s-]/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone) => {
  const pattern = /^(\+?254|0)[17]\d{8}$/;
  return pattern.test(phone);
};

/**
 * Validate amount
 */
export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return num > 0 && num <= 999999;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return `Ksh ${Math.round(amount).toLocaleString()}`;
};

export default {
  MpesaService,
  PesapalService,
  validatePhoneNumber,
  validateAmount,
  formatCurrency,
};
