// app/api/checkout_sessions/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripe gizli anahtarını ortam değişkenlerinden al
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // İstekten gelen verileri (sepet, kullanıcı ID, adres ID) al
    const { items, userId, addressId } = await req.json();

    // Gerekli verilerin gelip gelmediğini kontrol et
    if (!items || !userId || !addressId) {
      return NextResponse.json({ error: { message: "Eksik parametreler: Sepet, kullanıcı veya adres ID'si gönderilmedi." } }, { status: 400 });
    }

    // Stripe Checkout Session için line_items dizisini oluştur
    const line_items = items.map((item) => ({
      price_data: {
        currency: 'usd', // Stripe için ISO kodunu doğrudan 'usd' olarak ayarla
        product_data: {
          name: item.product.name,
          // Ürün görselleri varsa ilkini kullan, yoksa boş dizi ata
          images: item.product.image_urls && item.product.image_urls.length > 0 ? [item.product.image_urls[0]] : [],
        },
        // Fiyatı cent cinsinden (tamsayı olarak) gönder
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    }));

    // Webhook'ta kullanılacak basitleştirilmiş sepet bilgisi
    const simplifiedCart = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
    }));

    // Stripe Checkout Session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Ödeme yöntemi olarak kart kabul et
      line_items: line_items,        // Oluşturulan ürün listesi
      mode: 'payment',               // Tek seferlik ödeme modu
      // Başarılı ödeme sonrası yönlendirilecek URL
      success_url: `${process.env.NEXT_PUBLIC_URL}/order-placed`,
      // İptal durumunda geri dönülecek URL
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      // Webhook'a iletilecek ek bilgiler (metadata)
      metadata: {
        userId,
        addressId,
        cartItems: JSON.stringify(simplifiedCart), // Sepet bilgisini JSON string olarak gönder
      },
    });

    // Başarılı olursa Stripe Checkout URL'ini döndür
    return NextResponse.json({ url: session.url });

  } catch (err) {
    // Hata oluşursa konsola yazdır ve 500 hatası döndür
    console.error("Stripe Checkout Session Hatası:", err.message);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}