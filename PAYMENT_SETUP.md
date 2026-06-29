# Payment Integration Setup Guide

This guide walks you through setting up Paystack payment processing for HASKE.

## What is Paystack?

Paystack is a payment platform that:
- Accepts card payments (Visa, Mastercard, etc)
- Works in Nigeria and across Africa
- Settles instantly to your bank account
- Has excellent API documentation
- Supports mobile payments and USSD

## Setup Steps

### 1. Create a Paystack Account

1. Visit https://dashboard.paystack.com
2. Sign up with your email
3. Verify your email
4. Fill out your business information
5. Add your bank account for settlements

### 2. Get Your API Keys

1. Log in to Paystack Dashboard
2. Go to **Settings → Developer**
3. You'll see:
   - **Public Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
4. Copy both keys

⚠️ **Important:** 
- Use **Test Keys** (ends with `_test_`) for development
- Use **Live Keys** (ends with `_live_`) for production
- Never share your Secret Key
- Never commit keys to git

### 3. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` and add your Paystack keys:

```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

For production, replace with live keys:

```
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_key_here
VITE_PAYSTACK_SECRET_KEY=sk_live_your_key_here
```

### 4. Test the Payment Flow

1. Start the dev server: `npm run dev`
2. Navigate to **Buy Points** page
3. Click any package to test
4. Use Paystack test card:
   - **Card Number:** 4111 1111 1111 1111
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVV:** Any 3 digits (e.g., 123)
   - **OTP:** 123456 (if requested)

✅ Payment should succeed and points should be added to your account

### 5. Monitor Payments

In Paystack Dashboard:
- Go to **Transactions** to see all payments
- View customer details, amounts, and statuses
- Download transaction reports

## How Payment Works in HASKE

```
User clicks "Buy Points"
    ↓
Selects package (e.g., 1000 pts for ₦450)
    ↓
Clicks "Buy Now"
    ↓
Paystack popup opens
    ↓
User enters card/payment details
    ↓
Payment processes (instant)
    ↓
On success:
  • Points added to account
  • Referral bonus added to wallet
  • Transaction logged in Firebase
  • User sees success toast
    ↓
On failure:
  • User sees error message
  • Can retry payment
```

## Security

✅ Paystack handles all card data (PCI compliant)
✅ We never see or store credit card numbers
✅ Payments verified on server-side
✅ Transactions logged in Firebase with status
✅ Admins can view all transactions

## Troubleshooting

### "Paystack SDK not loaded"
- Check that Paystack script tag is in `index.html`
- Check browser console for JavaScript errors
- Verify public key is correct in `.env`

### Payment popup doesn't appear
- Check if public key is set correctly
- Check browser console for errors
- Try a different browser
- Disable ad/popup blockers

### Points not added after payment
- Check Firebase transactions collection
- Verify user is logged in
- Check transaction status in dashboard
- Review browser console logs

### Test payment fails
- Use correct test card: 4111 1111 1111 1111
- Check expiry date is in future
- Ensure you're using test keys (not live)

## Production Checklist

Before going live:

- [ ] Switch to live Paystack keys
- [ ] Update `.env` with live keys
- [ ] Test full payment flow with real card
- [ ] Set up bank account settlement
- [ ] Configure Paystack webhook (optional, for backend verification)
- [ ] Test with multiple payment methods
- [ ] Verify transaction history works
- [ ] Set up monitoring/alerts
- [ ] Train admins on transaction management

## Revenue Model

After each payment:
- Customer pays: ₦450 for 1,000 points
- Paystack fee: ~₦25 (fixed + 1.5%)
- You receive: ~₦425
- Platform profit margin: ~5.6%

Scale example:
- 100 customers buying 1,000 pts = ₦45,000 revenue
- After Paystack fees = ~₦42,500 profit

## Support

- Paystack Help: https://paystack.com/support
- API Docs: https://paystack.com/docs/api
- Status Page: https://status.paystack.com

---

**Next Steps:**
1. Set up Paystack account
2. Get API keys
3. Configure .env file
4. Test payment flow
5. Monitor transactions
