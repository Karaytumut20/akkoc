// app/api/checkout_sessions/route.js (İlgili kısımları güncelle)

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // === YENİ: couponCode'u request body'den al ===
    const { items, userId, addressId, totalAmount, couponCode } = await req.json();

    if (!items || !userId || !addressId || typeof totalAmount !== 'number' || totalAmount <= 0) {
        return NextResponse.json({ error: { message: "Missing or invalid parameters: Cart, user, address ID, or valid total amount not provided." } }, { status: 400 });
    }

    // Tek line_item mantığı aynı kalır
    const line_items = [
      {
        price_data: {
          currency: process.env.STRIPE_CURRENCY_CODE || 'usd',
          product_data: {
            name: `Total Order Amount (Tax Included${couponCode ? ` with coupon ${couponCode}` : ''})`, // Kuponu isme ekleyebiliriz (opsiyonel)
            // İlk ürünün resmini kullanmaya devam et
            images: items[0]?.product?.image_urls?.[0] ? [items[0].product.image_urls[0]] : [],
          },
          unit_amount: Math.round(totalAmount * 100), // İndirimli toplam tutarı gönder
        },
        quantity: 1,
      }
    ];

    // Sepet detayları metadata için aynı kalır
    const simplifiedCart = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
    }));

    // === YENİ: Metadata'ya couponCode ekle ===
    const metadata = {
        userId,
        addressId,
        cartItems: JSON.stringify(simplifiedCart),
    };
    if (couponCode) {
        metadata.couponCode = couponCode; // Eğer kupon varsa metadata'ya ekle
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/order-placed`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      metadata: metadata, // Güncellenmiş metadata'yı kullan
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Session Error:", err.message);
    const errorMessage = err.message || "An unknown Stripe error occurred.";
    return NextResponse.json({ error: { message: errorMessage } }, { status: 500 });
  }
}