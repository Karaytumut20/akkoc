import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { items, userId, addressId } = await req.json();

    if (!items || !userId || !addressId) {
      return NextResponse.json({ error: { message: "Eksik parametreler: Sepet, kullanıcı veya adres ID'si gönderilmedi." } }, { status: 400 });
    }

    const line_items = items.map((item) => {
      // ✅ GÜVENLİ FİYAT DÖNÜŞÜMÜ: Fiyatı kesinlikle sayıya dönüştür
      const rawPrice = item.product.price;
      const price = parseFloat(rawPrice);
      const safePrice = isNaN(price) ? 0 : price; 

      return {
        price_data: {
          // Stripe, para birimini küçük harfle (try, usd vb.) bekler
          currency: (process.env.NEXT_PUBLIC_CURRENCY || 'try').toLowerCase(), 
          product_data: {
            name: item.product.name,
            images: item.product.image_urls && item.product.image_urls.length > 0 ? [item.product.image_urls[0]] : [],
          },
          // Fiyatı cent/kuruş cinsinden tam sayıya dönüştür
          unit_amount: Math.round(safePrice * 100), 
        },
        quantity: item.quantity,
      };
    });

    // Fiyatı 0 veya negatif olan ürünleri filtrele (Stripe'a sıfır fiyat göndermek görsel hataya yol açar)
    const valid_line_items = line_items.filter(item => item.price_data.unit_amount > 0);

    if (valid_line_items.length === 0) {
        return NextResponse.json({ error: { message: "Sepetteki tüm ürünlerin fiyatı 0 veya geçersiz, ödeme yapılamaz." } }, { status: 400 });
    }
    
    const simplifiedCart = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: valid_line_items, // Düzeltilmiş liste kullanılıyor
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
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}