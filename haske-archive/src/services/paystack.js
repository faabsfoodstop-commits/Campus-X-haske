// Paystack Payment Integration Service
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key';

export const initializePayment = async (config) => {
  return new Promise((resolve, reject) => {
    if (!window.PaystackPop) {
      reject(new Error('Paystack SDK not loaded'));
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount * 100, // Paystack expects amount in kobo (cents)
      ref: config.reference,
      publicKey: PAYSTACK_PUBLIC_KEY,
      onClose: () => {
        reject(new Error('Payment window closed'));
      },
      onSuccess: (response) => {
        resolve(response);
      },
    });

    handler.openIframe();
  });
};

export const verifyPayment = async (reference) => {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const data = await response.json();
    return data.data.status === 'success' ? data.data : null;
  } catch (err) {
    console.error('Verification error:', err);
    throw err;
  }
};

export const generateReference = () => {
  return `HASKE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
