// app/api/webhook/route.js

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Secret anahtarlar ile Stripe ve Supabase'i sunucuda başlatma
//
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  // 1. Webhook İmza Doğrulama
  //
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook imza doğrulama hatası: ${err.message}`);
    return new NextResponse(`Webhook Hatası: ${err.message}`, { status: 400 });
  }

  // 2. Başarılı Ödeme Olayını Yakalama
  //
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Metadata'dan verileri çekme
    //
    const { userId, addressId, cartItems } = session.metadata;
    const simplifiedCart = JSON.parse(cartItems); // [{productId, quantity}]
    const totalAmount = session.amount_total / 100;

    try {
      // 3. Adres bilgisini al (orders tablosuna JSON olarak kaydedilecek)
      //
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();
      
      if (addressError) throw new Error(`Adres bulunamadı: ${addressError.message}`);

      // 4. 'orders' tablosuna yeni siparişi oluştur
      //
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
            user_id: userId, 
            total_amount: totalAmount, 
            address: addressData, 
            status: 'Hazırlanıyor' 
        }])
        .select()
        .single();
      
      if (orderError) throw new Error(`Sipariş oluşturulamadı: ${orderError.message}`);
      
      // 5. Ürün detaylarını (fiyat, stok) çek
      //
      const productIds = simplifiedCart.map(item => item.productId);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, stock')
        .in('id', productIds);

      if (productsError) throw new Error(`Ürün detayları alınamadı: ${productsError.message}`);

      // 6. order_items listesini oluştur ve fiyati veritabanından al
      //
      const orderItems = simplifiedCart.map(item => {
        const product = productsData.find(p => p.id === item.productId);
        return {
            order_id: orderData.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: product.price, // Güvenlik için fiyatı tekrar sunucuda teyit et.
        };
      });

      // 7. order_items tablosuna ekle
      //
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(`Sipariş ürünleri eklenemedi: ${itemsError.message}`);

      // 8. Stokları güncelle
      //
      for (const item of orderItems) {
        const product = productsData.find(p => p.id === item.product_id);
        const newStock = product.stock - item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock > 0 ? newStock : 0 })
          .eq('id', item.product_id);
      }
      
      console.log(`Sipariş ${orderData.id} başarıyla oluşturuldu.`);

    } catch (error) {
      console.error('Webhook işlenirken veritabanı hatası:', error.message);
      return new NextResponse(`Webhook Handler Veritabanı Hatası: ${error.message}`, { status: 500 });
    }
  }

  // Stripe'a başarılı yanıt dönme
  //
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}