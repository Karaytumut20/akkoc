import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { items, userId, addressId, totalAmount } = await req.json();

    if (!items || !userId || !addressId || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json({ error: { message: "Eksik veya geçersiz parametreler: Sepet, kullanıcı, adres ID'si veya geçerli toplam tutar gönderilmedi." } }, { status: 400 });
    }

    // Tek bir line_item oluştur
    const line_items = [
      {
        price_data: {
          // ✅ STRIPE_CURRENCY_CODE kullanıldı, varsayılan olarak 'usd'
          currency: process.env.STRIPE_CURRENCY_CODE || 'usd',
          product_data: {
            name: 'Toplam Sipariş Tutarı (Vergi Dahil)',
            images: items[0]?.product?.image_urls?.[0] ? [items[0].product.image_urls[0]] : [],
          },
          // unit_amount olarak vergi dahil toplam tutarı gönder (cent cinsinden)
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1, // Tek bir genel kalem olduğu için miktar 1
      }
    ];

    // Webhook'un ürün detaylarını işlemesi için simplifiedCart'ı metadata'da tutmaya devam ediyoruz
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
    console.error("Stripe Checkout Session Hatası:", err.message);
    const errorMessage = err.message || "Bilinmeyen bir Stripe hatası oluştu.";
    return NextResponse.json({ error: { message: errorMessage } }, { status: 500 });
  }
}