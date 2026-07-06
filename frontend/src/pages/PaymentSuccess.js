import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const query = useQuery();
  const orderId = query.get('orderId');
  const amount = query.get('amount');
  const method = query.get('method');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f5f7f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: '#2d6a4f', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>✅ Payment Success</h1>
      </div>
      <div style={{ maxWidth: 720, margin: '32px auto', background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,.08)' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2d6a4f' }}>Your payment has been processed successfully.</p>
        <p style={{ margin: '14px 0 26px', color: '#555' }}>Thank you for your purchase. Your order has been placed and is now pending fulfillment.</p>
        <div style={{ display: 'grid', gap: 12, fontSize: 14, color: '#333' }}>
          <div><strong>Order ID:</strong> {orderId || 'N/A'}</div>
          <div><strong>Amount paid:</strong> ₹{amount ? Number(amount).toFixed(2) : '0.00'}</div>
          <div><strong>Payment method:</strong> {method || 'Card'}</div>
        </div>
        <button onClick={() => navigate('/dashboard/buyer')} style={{ marginTop: 28, padding: '12px 18px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Go to dashboard</button>
      </div>
    </div>
  );
}
