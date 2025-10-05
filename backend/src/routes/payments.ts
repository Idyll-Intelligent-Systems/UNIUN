import { Router } from 'express'

const router = Router()

let stripe: any | null = null
try {
  // require dynamically so the package is optional at runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Stripe = require('stripe')
  stripe = new Stripe(process.env.STRIPE_SECRET || 'sk_test_dummy', { apiVersion: '2022-11-15' })
} catch (err) {
  // Stripe not installed or available; payments disabled
  console.warn('Stripe SDK not available; payments endpoints disabled')
}

router.post('/checkout', async (req: any, res: any) => {
  if (!stripe) return res.status(501).json({ error: 'Payments disabled in this environment' })
  const { priceId } = req.body
  if (!priceId) return res.status(400).json({ error: 'priceId required' })
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.SUCCESS_URL || 'https://example.com/success',
    cancel_url: process.env.CANCEL_URL || 'https://example.com/cancel'
  })
  res.json({ url: session.url })
})

export default router
