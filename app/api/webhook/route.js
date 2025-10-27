// app/api/webhook/route.js (İlgili kısımları güncelle)

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Supabase client'ını oluştururken service_role key kullanmak gerekebilir
// çünkü RLS'i bypass edip kupon sayacını artırmamız gerekebilir.
// Ya da kupon tablosuna özel bir RLS politikası tanımlanabilir.
// Şimdilik anon key ile devam edelim, gerekirse değiştiririz.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // === YENİ: couponCode'u metadata'dan al ===
    const { userId, addressId, cartItems, couponCode } = session.metadata; 
    const simplifiedCart = JSON.parse(cartItems); 
    const totalAmount = session.amount_total / 100; // Bu zaten indirimli tutar olmalı

    try {
      // 3. Fetch address (Aynı kalır)
       const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();
      if (addressError) throw new Error(`Address not found: ${addressError.message}`);

      // 4. Create order (Aynı kalır, totalAmount indirimli)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
            user_id: userId, 
            total_amount: totalAmount, // İndirimli toplam tutarı kaydet
            address: addressData, 
            status: 'Processing',
            // === YENİ: Kullanılan kupon kodunu siparişe ekle (opsiyonel ama faydalı) ===
            coupon_code_used: couponCode || null 
        }])
        .select()
        .single();
      if (orderError) throw new Error(`Could not create order: ${orderError.message}`);
      
      // 5. Fetch product details (Aynı kalır)
      const productIds = simplifiedCart.map(item => item.productId);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, stock')
        .in('id', productIds);
      if (productsError) throw new Error(`Could not retrieve product details: ${productsError.message}`);

      // 6. Create order_items (Aynı kalır - DB'deki orijinal fiyatı kullanır)
      const orderItems = simplifiedCart.map(item => {
        const product = productsData.find(p => p.id === item.productId);
        return {
            order_id: orderData.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: product.price, // Orijinal ürün fiyatını kaydet
        };
      });

      // 7. Insert order_items (Aynı kalır)
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(`Could not add order items: ${itemsError.message}`);

      // 8. Update stocks (Aynı kalır)
      for (const item of orderItems) {
        const product = productsData.find(p => p.id === item.product_id);
        const newStock = product.stock - item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock > 0 ? newStock : 0 })
          .eq('id', item.product_id);
      }

      // === YENİ: Kupon kullanıldıysa sayacını artır ===
      if (couponCode) {
          const { error: couponUsageError } = await supabase.rpc('increment_coupon_usage', { 
              coupon_code: couponCode 
          });
          // Supabase'de 'increment_coupon_usage' adında bir SQL fonksiyonu oluşturman gerekecek:
          // CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
          // RETURNS void AS $$
          // BEGIN
          //   UPDATE coupons
          //   SET usage_count = usage_count + 1
          //   WHERE code = coupon_code;
          // END;
          // $$ LANGUAGE plpgsql;
          // Bu fonksiyonu Supabase SQL Editor'de çalıştır.
          
          if (couponUsageError) {
              // Hata loglanır ama işlem devam eder, sipariş zaten oluştu.
              console.error(`Error incrementing coupon usage for ${couponCode}: ${couponUsageError.message}`);
          } else {
              console.log(`Usage count for coupon ${couponCode} incremented.`);
          }
      }
      // ===============================================
      
      console.log(`Order ${orderData.id} created successfully.`);

    } catch (error) {
      console.error('Database error while processing webhook:', error.message);
      return new NextResponse(`Webhook Handler Database Error: ${error.message}`, { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}