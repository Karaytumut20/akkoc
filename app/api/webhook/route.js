'use server';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY env variable is missing!');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`❌ Webhook imza doğrulama hatası: ${err.message}`);
    return new NextResponse(`Webhook Hatası: ${err.message}`, { status: 400 });
  }

  // 🧪 Stripe event log
  console.log("📦 Stripe event type:", event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log("🧾 Session metadata:", session.metadata);

    const { userId, addressId, cartItems } = session.metadata || {};

    // Metadata kontrolü
    if (!userId || !cartItems) {
      console.error("🚨 Metadata eksik → userId veya cartItems boş!");
      return new NextResponse(`Eksik metadata`, { status: 400 });
    }

    const simplifiedCart = JSON.parse(cartItems);
    const totalAmount = session.amount_total / 100;

    try {
      // 🏠 Adres çek
      let addressData = null;
      if (addressId) {
        const { data: addrData, error: addrError } = await supabaseAdmin
          .from('addresses')
          .select('*')
          .eq('id', addressId)
          .single();

        if (addrError) {
          console.warn('⚠️ Adres bulunamadı, address null olarak kaydedilecek.');
        } else {
          addressData = addrData;
        }
      }

      // 🧾 Sipariş oluştur
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert([{
          user_id: userId,
          total_amount: totalAmount,
          address: addressData,
          status: 'Hazırlanıyor',
          created_at: new Date(),
          stripe_checkout_id: session.id,
          shipping_amount: session.total_details?.amount_shipping ? session.total_details.amount_shipping / 100 : 0,
          tracking_number: null
        }])
        .select()
        .single();

      if (orderError) {
        console.error("🚨 Sipariş oluşturulamadı:", orderError);
        throw new Error(orderError.message);
      }

      console.log(`✅ Sipariş ${orderData.id} oluşturuldu`);

      // 🛍️ Ürünleri çek
      const productIds = simplifiedCart.map(item => item.productId);
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, price, stock')
        .in('id', productIds);

      if (productsError) {
        console.error("🚨 Ürünler çekilemedi:", productsError);
        throw new Error(productsError.message);
      }

      // 📝 Order items ekle
      const orderItems = simplifiedCart.map(item => {
        const product = productsData.find(p => p.id === item.productId);
        return {
          order_id: orderData.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: product.price,
        };
      });

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error("🚨 Order items eklenemedi:", itemsError);
        throw new Error(itemsError.message);
      }

      console.log(`✅ ${orderItems.length} ürün siparişe eklendi`);

      // 📉 Stok güncelle
      for (const item of orderItems) {
        const product = productsData.find(p => p.id === item.product_id);
        const newStock = product.stock - item.quantity;
        const { error: stockError } = await supabaseAdmin
          .from('products')
          .update({ stock: newStock > 0 ? newStock : 0 })
          .eq('id', item.product_id);

        if (stockError) {
          console.error(`⚠️ Stok güncellenemedi (${item.product_id}):`, stockError);
        }
      }

      // 🧼 Sepeti temizle
      const { error: cartClearError } = await supabaseAdmin
        .from('user_cart')
        .delete()
        .eq('user_id', userId);

      if (cartClearError) {
        console.error('⚠️ Sepet temizlenirken hata:', cartClearError.message);
      }

      console.log(`🟢 Sipariş ${orderData.id} başarıyla tamamlandı.`);

    } catch (error) {
      console.error('❌ Webhook işlem hatası:', error.message);
      return new NextResponse(`Webhook Handler Hatası: ${error.message}`, { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
