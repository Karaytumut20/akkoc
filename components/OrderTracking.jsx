// components/OrderTracking.jsx
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const OrderTracking = ({ order }) => {
  const { getTrackingInfo } = useAppContext();
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order.tracking_number) {
      fetchTrackingInfo();
    }
  }, [order.tracking_number]);

  const fetchTrackingInfo = async () => {
    if (!order.tracking_number) return;
    
    setLoading(true);
    const info = await getTrackingInfo(order.tracking_number);
    setTrackingInfo(info);
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">📦 Shipping & Tracking</h3>
      
      {order.tracking_number ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-700">Tracking Number</p>
              <p className="text-blue-600 font-mono text-lg">{order.tracking_number}</p>
              {trackingInfo?.isReal === false && (
                <p className="text-yellow-600 text-sm mt-1">⚠️ Test tracking number</p>
              )}
            </div>
            <button
              onClick={fetchTrackingInfo}
              disabled={loading}
              className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh Tracking'}
            </button>
          </div>

          {trackingInfo && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  trackingInfo.status === 'Delivered' ? 'bg-green-500' : 
                  trackingInfo.status === 'In Transit' ? 'bg-blue-500' : 'bg-yellow-500'
                }`}></div>
                <p className="font-medium">Status: {trackingInfo.status}</p>
              </div>
              
              {trackingInfo.estimatedDelivery && (
                <p className="text-sm text-gray-600 mb-3">
                  Estimated Delivery: {new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}
                </p>
              )}

              {trackingInfo.details && trackingInfo.details.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm text-gray-700">Tracking History:</p>
                  {trackingInfo.details.map((detail, index) => (
                    <div key={index} className="flex text-sm">
                      <div className="w-2 bg-blue-200 rounded-full mr-3"></div>
                      <div>
                        <p className="text-gray-600">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {order.shipping_cost && (
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Shipping Cost:</span>
              <span className="font-semibold">${order.shipping_cost}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">Tracking number will be generated soon...</p>
      )}

      {trackingInfo?.isReal === false && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">
            <strong>Development Mode:</strong> This is a test tracking number. To get real USPS tracking, 
            add your USPS Consumer Key and Secret to the .env.local file.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;