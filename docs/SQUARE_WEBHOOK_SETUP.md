# Square Webhook Setup (Sandbox & Production)

When a client pays an invoice through Square, the webhook updates the invoice status to "paid" for both client and admin views.

## Sandbox Testing

1. **Deploy your app** to Vercel (or another public URL). Webhooks cannot reach `localhost`.

2. **Square Developer Dashboard** → Your app → **Webhooks** (use Sandbox mode):
   - Click **Add Subscription**
   - Event: **payment.completed**
   - Notification URL: `https://your-app.vercel.app/api/webhooks/square`
   - Copy the **Signature Key**

3. **Environment variables** (Vercel → Settings → Environment Variables):
   - `SQUARE_ACCESS_TOKEN` – Sandbox access token
   - `SQUARE_ENVIRONMENT` – `sandbox`
   - `SQUARE_LOCATION_ID` – Your sandbox location ID
   - `SQUARE_WEBHOOK_SIGNATURE_KEY` – The signature key from step 2
   - `NEXT_PUBLIC_APP_URL` – `https://your-app.vercel.app` (must match webhook URL base)

4. **Test**: Create an invoice, send to client, click Pay Now, complete payment with a [Square sandbox test card](https://developer.squareup.com/docs/webhooks-api/step-by-step-guide#test-with-sandbox). The invoice should show "Paid" within a few seconds.

## Production

Same steps, but use Production credentials and Production webhook subscription in the Square Dashboard.
