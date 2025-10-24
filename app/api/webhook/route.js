// app/api/webhook/route.js

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe and Supabase on the server with secret keys
//
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  // 1. Webhook Signature Verification
  //
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2. Handle Successful Payment Event
  //
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract data from metadata
    //
    const { userId, addressId, cartItems } = session.metadata;
    const simplifiedCart = JSON.parse(cartItems); // [{productId, quantity}]
    const totalAmount = session.amount_total / 100;

    try {
      // 3. Fetch address information (to be saved as JSON in the orders table)
      //
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .single();
      
      if (addressError) throw new Error(`Address not found: ${addressError.message}`);

      // 4. Create a new order in the 'orders' table
      //
      // NOTE: Status can be set to a standardized English term like 'Processing' 
      // or kept as is to match existing database logic.
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
            user_id: userId, 
            total_amount: totalAmount, 
            address: addressData, 
            status: 'Processing' // Changed status to English equivalent
        }])
        .select()
        .single();
      
      if (orderError) throw new Error(`Could not create order: ${orderError.message}`);
      
      // 5. Fetch product details (price, stock)
      //
      const productIds = simplifiedCart.map(item => item.productId);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, stock')
        .in('id', productIds);

      if (productsError) throw new Error(`Could not retrieve product details: ${productsError.message}`);

      // 6. Create the order_items list and strictly use the price fetched from the DB
      //
      const orderItems = simplifiedCart.map(item => {
        const product = productsData.find(p => p.id === item.productId);
        // Use the price fetched from the database for security/accuracy
        return {
            order_id: orderData.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: product.price, 
        };
      });

      // 7. Insert into the order_items table
      //
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(`Could not add order items: ${itemsError.message}`);

      // 8. Update stocks
      //
      for (const item of orderItems) {
        const product = productsData.find(p => p.id === item.product_id);
        const newStock = product.stock - item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock > 0 ? newStock : 0 })
          .eq('id', item.product_id);
      }
      
      console.log(`Order ${orderData.id} created successfully.`);

    } catch (error) {
      console.error('Database error while processing webhook:', error.message);
      return new NextResponse(`Webhook Handler Database Error: ${error.message}`, { status: 500 });
    }
  }

  // Return successful response to Stripe
  //
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}