    // C:\Users\umut\akkoc\app\api\checkout_sessions\route.js
// Stripe SDK Edge runtime'da çalışmaz, Node runtime zorunlu:
export const runtime = 'nodejs';
// Bu endpointler cache'lenmesin:
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { items, userId, addressId, totalAmount, couponCode } = await req.json();

    // 📌 Parametre doğrulama
    if (!items || !userId || !addressId || typeof totalAmount !== "number" || totalAmount <= 0) {
      return new NextResponse(
        JSON.stringify({
          error: {
            message:
              "Missing or invalid parameters: Cart, user, address ID, or valid total amount not provided.",
          },
        }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    // 🧾 Stripe line_items oluştur
    const line_items = [
      {
        price_data: {
          currency: process.env.STRIPE_CURRENCY_CODE || "usd",
          product_data: {
            name: `Total Order Amount (Tax Included${
              couponCode ? ` with coupon ${couponCode}` : ""
            })`,
            images:
              items[0]?.product?.image_urls?.[0] ?
                [items[0].product.image_urls[0]] :
                [],
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      },
    ];

    // 🛒 Sepeti metadata'ya çevir
    const simplifiedCart = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const metadata = {
      userId,
      addressId,
      cartItems: JSON.stringify(simplifiedCart),
    };
    if (couponCode) metadata.couponCode = couponCode;

    // 💳 Stripe Checkout Session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/order-placed`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      metadata,
    });

    // ✅ Başarılı yanıt — CORS header'lı
    return new NextResponse(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error("Stripe Checkout Session Error:", err.message);
    return new NextResponse(
      JSON.stringify({ error: { message: err.message || "Unknown Stripe error" } }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// ✅ CORS preflight desteği
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// 🌐 CORS header fonksiyonu
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://www.nestcome.com", // ⚠️ buraya kendi domainini yaz
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
