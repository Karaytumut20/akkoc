
// app/test-order/page.jsx - TEST SAYFASI
'use client';
import { useAppContext } from '@/context/AppContext';

export default function TestOrder() {
  const { createOrder } = useAppContext();

  const testOrder = async () => {
    const orderData = {
      total_amount: 99.99,
      shippingAddress: {
        first_name: "Test",
        last_name: "User", 
        address_line1: "123 Test St",
        city: "Test City",
        state: "CA",
        postal_code: "12345"
      },
      items: [{ product_id: 1, quantity: 1, price: 99.99 }]
    };

    const result = await createOrder(orderData);
    if (result) {
      alert(`Sipariş oluşturuldu! Takip No: ${result.tracking_number}`);
    }
  };

  return (
    <div className="p-8">
      <button 
        onClick={testOrder}
        className="bg-blue-500 text-white px-6 py-3 rounded"
      >
        TEST Sipariş Oluştur (USPS Takip Kodu Üret)
      </button>
    </div>
  );
}