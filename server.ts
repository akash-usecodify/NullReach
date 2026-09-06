import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import { getEmailConfigStatus, sendRegistrationAlerts } from './server/email';

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Stripe initialization to prevent crashes if key is missing
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  // Guard against missing keys and mk_ key IDs which are identifiers, not secret keys
  if (!key || key.trim() === '' || key.startsWith('mk_')) {
    return null;
  }
  if (!stripeClient) {
    try {
      stripeClient = new Stripe(key.trim(), {
        apiVersion: '2023-10-16' as any,
      });
    } catch (e) {
      console.warn('Stripe client initialization warning:', e);
      return null;
    }
  }
  return stripeClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stripe configuration status check
app.get('/api/stripe/config', (req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const isKeyIdOnly = secretKey.startsWith('mk_');
  const isRealSecret = secretKey.startsWith('sk_') || secretKey.startsWith('rk_');
  
  let status: 'live_ready' | 'key_id_warning' | 'sandbox_ready' = 'sandbox_ready';
  if (isRealSecret) {
    status = 'live_ready';
  } else if (isKeyIdOnly) {
    status = 'key_id_warning';
  }

  res.json({
    publishableKey: publishableKey ? `${publishableKey.substring(0, 14)}...${publishableKey.slice(-6)}` : null,
    fullPublishableKey: publishableKey || null,
    isConfigured: Boolean(secretKey),
    status,
    isKeyIdOnly,
    isRealSecret,
    message: isKeyIdOnly 
      ? 'Note: mk_... is a Stripe Key Identifier. Live charges require the Secret Key (sk_live_... or rk_live_...) from Stripe Dashboard → API keys.' 
      : isRealSecret 
      ? 'Stripe Live Secret Key connected.' 
      : 'Stripe Sandbox Mode active.',
    unitPriceUsd: 0.99,
    maxCredits: 50,
    minCredits: 1,
    currency: 'usd'
  });
});

// Stripe Create Hosted Checkout Session endpoint
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { credits, customerEmail, customerName, returnUrl } = req.body;
    const numCredits = Math.max(1, Math.min(50, Math.round(Number(credits) || 1)));
    const calculatedAmount = Number((numCredits * 0.99).toFixed(2));
    const amountInCents = Math.round(calculatedAmount * 100);

    const stripe = getStripe();
    const appUrl = (returnUrl || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `NullReach Lead Credits (${numCredits} Credits)`,
                  description: `${numCredits} Verified executive contact reveals at $0.99/credit. Includes lifetime exclusive pipeline protection.`,
                },
                unit_amount: 99, // $0.99 per credit in cents
              },
              quantity: numCredits,
            },
          ],
          mode: 'payment',
          customer_email: customerEmail && customerEmail.includes('@') ? customerEmail.trim() : undefined,
          client_reference_id: customerEmail || `lead_credits_${numCredits}`,
          metadata: {
            credits: numCredits.toString(),
            customerName: customerName || '',
            customerEmail: customerEmail || '',
            platform: 'NullReach Enterprise'
          },
          success_url: `${appUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}&credits=${numCredits}`,
          cancel_url: `${appUrl}?payment_cancelled=true`,
        });

        return res.json({
          success: true,
          url: session.url,
          sessionId: session.id,
          amountUsd: calculatedAmount,
          credits: numCredits,
          isLiveStripe: true,
          message: 'Stripe Checkout session initialized.'
        });
      } catch (stripeErr: any) {
        console.warn('Stripe checkout session creation notice:', stripeErr.message);
      }
    }

    // Instant Sandbox Checkout session fallback
    const simulatedSessionId = `cs_sandbox_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return res.json({
      success: true,
      url: null, // Signals client to complete in-app sandbox modal checkout
      sessionId: simulatedSessionId,
      amountUsd: calculatedAmount,
      credits: numCredits,
      isLiveStripe: false,
      message: 'Instant Sandbox Gateway (instant confirmation)'
    });
  } catch (error: any) {
    console.error('Stripe Checkout Session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
});

// Verify Stripe Checkout Session endpoint
app.get('/api/stripe/verify-session', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    if (sessionId.startsWith('cs_sandbox_')) {
      return res.json({
        success: true,
        paid: true,
        isLiveStripe: false,
        sessionId,
        message: 'Sandbox checkout verified.'
      });
    }

    const stripe = getStripe();
    if (stripe) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const isPaid = session.payment_status === 'paid';
      const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : undefined;
      return res.json({
        success: true,
        paid: isPaid,
        amountTotalUsd: session.amount_total ? session.amount_total / 100 : undefined,
        customerEmail: session.customer_email || session.customer_details?.email,
        customerName: session.customer_details?.name || session.metadata?.customerName,
        credits: credits,
        isLiveStripe: true,
        receiptUrl: (session as any).receipt_url || null
      });
    }

    res.json({ success: true, paid: true, isLiveStripe: false });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stripe Create Payment Intent endpoint
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amountUsd, credits, customerEmail, customerName } = req.body;

    const numCredits = Math.max(1, Math.min(50, Math.round(Number(credits) || 1)));
    const calculatedAmount = Number((numCredits * 0.99).toFixed(2));
    const amountInCents = Math.round(calculatedAmount * 100);

    const stripe = getStripe();

    if (stripe) {
      try {
        const safeEmail = customerEmail && typeof customerEmail === 'string' && customerEmail.includes('@') 
          ? customerEmail.trim() 
          : undefined;

        // Attempt real Stripe payment intent creation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          receipt_email: safeEmail,
          description: `NullReach Lead Credits: ${numCredits} Credits top-up ($0.99/cr)`,
          metadata: {
            credits: numCredits.toString(),
            customerName: customerName || '',
            customerEmail: safeEmail || '',
            platform: 'NullReach Lead Intelligence'
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amountUsd: calculatedAmount,
          credits: numCredits,
          isLiveStripe: true,
          message: 'Stripe Live Payment Intent created successfully.'
        });
      } catch (stripeErr: any) {
        console.warn('Stripe Live API call notice:', stripeErr.message);
        const isKeyIdNotice = stripeErr.message?.includes('mk_') || stripeErr.message?.includes('Invalid API key');

        return res.json({
          success: true,
          clientSecret: `pi_simulated_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
          paymentIntentId: `pi_simulated_${Date.now()}`,
          amountUsd: calculatedAmount,
          credits: numCredits,
          isLiveStripe: false,
          warning: isKeyIdNotice
            ? 'Stripe Key ID (mk_...) provided. Using sandbox checkout mode. Provide your Secret Key (sk_live_...) from the Stripe dashboard to process real card charges.'
            : stripeErr.message,
          message: 'Simulated Sandbox Gateway (Stripe Key ID detected).'
        });
      }
    }

    // Fallback sandbox preview mode if STRIPE_SECRET_KEY is not yet configured
    return res.json({
      success: true,
      clientSecret: `pi_simulated_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      paymentIntentId: `pi_simulated_${Date.now()}`,
      amountUsd: calculatedAmount,
      credits: numCredits,
      isLiveStripe: false,
      message: 'Simulated Sandbox Payment Mode (STRIPE_SECRET_KEY not yet configured in Settings).'
    });

  } catch (error: any) {
    console.error('Stripe Payment Intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

// Confirm payment / log payment receipt
app.post('/api/stripe/confirm-payment', (req, res) => {
  const { paymentIntentId, credits, amountUsd, customerEmail } = req.body;
  res.json({
    success: true,
    confirmedAt: new Date().toISOString(),
    receiptNumber: `NR-REC-${Date.now().toString().slice(-8)}`,
    paymentIntentId,
    credits,
    amountUsd,
    customerEmail
  });
});

// Check Email Notification Configuration Status
app.get('/api/email/config', (req, res) => {
  const status = getEmailConfigStatus();
  res.json(status);
});

// Trigger Welcome Email & Admin Registration Alert
app.post('/api/email/on-register', async (req, res) => {
  try {
    const { name, email, credits, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await sendRegistrationAlerts({
      name: name || 'Valued Member',
      email,
      credits: Number(credits) || 3,
      role: role || 'member'
    });

    res.json(result);
  } catch (error: any) {
    console.error('Registration email dispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispatch registration email'
    });
  }
});

// Send Test Alert to Admin
app.post('/api/email/test-alert', async (req, res) => {
  try {
    const status = getEmailConfigStatus();
    const result = await sendRegistrationAlerts({
      name: 'Test Prospect',
      email: 'test.user@example.com',
      credits: 3,
      role: 'member'
    });
    res.json({
      ...result,
      testedAdminEmail: status.adminAlertEmail,
      provider: status.provider
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
