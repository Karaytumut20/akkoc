import { supabase } from '@/lib/supabaseClient';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://nestcome.com';

export default async function sitemap() {
  // 1. Veritabanından tüm ürünleri çek
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at');

  // 2. Dinamik ürün sayfalarını oluştur
  const productUrls = (products || []).map((product) => ({
    url: `${BASE_URL}/product/${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Statik sayfaları tanımla
  const staticRoutes = [
    '', // Anasayfa
    '/all-products',
    '/collection',
    '/contact',
    '/services',
    '/services/shipping-returns',
    '/services/at-your-service',
    '/services/iconic-dinner-set',
    '/auth',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.7, // Anasayfa önceliği en yüksek
  }));

  return [...staticRoutes, ...productUrls];
}