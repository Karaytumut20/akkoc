import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { items, userId, addressId, totalAmount } = await req.json();

    if (!items || !userId || !addressId || typeof totalAmount !== 'number' || totalAmount <= 0) {
return NextResponse.json({ error: { message: "Missing or invalid parameters: Cart, user, address ID, or valid total amount not provided." } }, { status: 400 });
    }

    // Tek bir line_item oluştur
    const line_items = [
      {
        price_data: {
          // ✅ STRIPE_CURRENCY_CODE used, default to 'usd'
          currency: process.env.STRIPE_CURRENCY_CODE || 'usd',
          product_data: {
          name: 'Total Order Amount (Tax Included)',
            images: items[0]?.product?.image_urls?.[0] ? [items[0].product.image_urls[0]] : [],
          },
          // Send total amount including tax as unit_amount (in cents)
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1, // Tek bir genel kalem olduğu için miktar 1
      }
    ];

    // We continue to store simplifiedCart in metadata for the webhook to process product details
    const simplifiedCart = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/order-placed`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      metadata: {
        userId,
        addressId,
        cartItems: JSON.stringify(simplifiedCart),
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Session Error:", err.message);
    const errorMessage = err.message || "An unknown Stripe error occurred.";
    return NextResponse.json({ error: { message: errorMessage } }, { status: 500 });
  }
}