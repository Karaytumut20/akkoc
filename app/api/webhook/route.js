//C:\Users\umut\akkoc\app\api\webhook\route.js
// Stripe SDK Edge runtime'da çalışmaz, Node runtime zorunlu:
export const runtime = 'nodejs';
// Bu endpointler cache'lenmesin:
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ Stripe & Supabase kurulumları
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ✅ RLS'i aşmak için service_role key kullanıyoruz
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 📌 Sadece başarılı ödeme eventini yakala
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, addressId, cartItems, couponCode } = session.metadata;

    const simplifiedCart = JSON.parse(cartItems);
    const totalAmount = session.amount_total / 100;

    try {
      // 1️⃣ Adresi getir
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();
      if (addressError) throw new Error(`Address not found: ${addressError.message}`);

      // 2️⃣ Siparişi oluştur
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            total_amount: totalAmount,
            address: addressData,
            status: 'Processing',
            coupon_code_used: couponCode || null
          }
        ])
        .select()
        .single();
      if (orderError) throw new Error(`Could not create order: ${orderError.message}`);

      // 3️⃣ Ürünleri çek
      const productIds = simplifiedCart.map((item) => item.productId);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, stock')
        .in('id', productIds);
      if (productsError) throw new Error(`Could not retrieve product details: ${productsError.message}`);

      // 4️⃣ Order items hazırla
      const orderItems = simplifiedCart.map((item) => {
        const product = productsData.find((p) => p.id === item.productId);
        return {
          order_id: orderData.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: product.price
        };
      });

      // 5️⃣ Order items ekle
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(`Could not add order items: ${itemsError.message}`);

      // 6️⃣ Stok güncelle
      for (const item of orderItems) {
        const product = productsData.find((p) => p.id === item.product_id);
        const newStock = product.stock - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock > 0 ? newStock : 0 })
          .eq('id', item.product_id);
        if (stockError) console.error(`Stock update failed for product ${item.product_id}: ${stockError.message}`);
      }

      // 7️⃣ Kupon kullanıldıysa sayacı artır
      if (couponCode) {
        const { error: couponUsageError } = await supabase.rpc('increment_coupon_usage', {
          coupon_code: couponCode
        });

        if (couponUsageError) {
          console.error(`Error incrementing coupon usage for ${couponCode}: ${couponUsageError.message}`);
        } else {
          console.log(`✅ Usage count for coupon ${couponCode} incremented.`);
        }
      }

      console.log(`✅ Order ${orderData.id} created successfully.`);
    } catch (error) {
      console.error('❌ Database error while processing webhook:', error.message);
      return new NextResponse(`Webhook Handler Database Error: ${error.message}`, { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
