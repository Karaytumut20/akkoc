// app/api/checkout_sessions/route.js

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient'; // Supabase'i import edin

// Stripe'ı Secret Key ile başlatın (Bu anahtar sadece sunucuda olmalıdır!)
//
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // Client'tan gelen veriler
    //
    const { items, userId, addressId } = await req.json();

    if (!items || !userId || !addressId) {
      return NextResponse.json({ error: { message: "Eksik parametreler: Sepet, kullanıcı veya adres ID'si gönderilmedi." } }, { status: 400 });
    }

    // Stripe'ın beklediği formatta ürünleri hazırlama
    //
    const line_items = items.map((item) => ({
      price_data: {
        // Para birimini .env dosyasından alıyoruz
        //
        currency: process.env.NEXT_PUBLIC_CURRENCY || 'try', 
        product_data: {
          name: item.product.name,
          images: item.product.image_urls && item.product.image_urls.length > 0 ? [item.product.image_urls[0]] : [],
        },
        // Stripe'ın beklediği kuruş/cent cinsinden fiyat
        //
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    }));

    // Sepet içeriğini sadeleştirip metadata olarak kaydetme (Webhook için kritik)
    //
    const simplifiedCart = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
    }));

    // Stripe Checkout Session oluşturma
    //
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      // Başarılı ve iptal durumlarında geri dönüş URL'leri
      //
      success_url: `${process.env.NEXT_PUBLIC_URL}/order-placed`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      // Sipariş oluşturmak için gereken verileri metadata'ya gömme
      //
      metadata: {
        userId,
        addressId,
        cartItems: JSON.stringify(simplifiedCart),
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Session Hatası:", err.message);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}