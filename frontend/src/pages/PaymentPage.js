import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, paymentService } from '../services/api';

const STORAGE_KEY = 'kc_pending_payment';

function loadPendingPayment() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function clearPendingPayment() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = loadPendingPayment();
    if (!saved) {
      navigate('/checkout');
      return;
    }
    setPending(saved);
  }, [navigate]);

  const total = useMemo(() => pending?.amount ?? 0, [pending]);

  const handleBack = () => {
    navigate('/checkout');
  };

  const handlePaymentSuccess = useCallback(async (gatewayPayment) => {
    if (!pending) return;
    setProcessing(true);
    setMessage('Verifying payment...');

    try {
      const verifyResponse = await paymentService.verify({
        razorpayOrderId: gatewayPayment.razorpay_order_id,
        razorpayPaymentId: gatewayPayment.razorpay_payment_id,
        razorpaySignature: gatewayPayment.razorpay_signature,
      });
      if (!verifyResponse.data.verified) {
        setMessage('❌ Payment verification failed: ' + verifyResponse.data.message);
        setProcessing(false);
        return;
      }

      const orderPayload = {
        items: pending.items.map(({ name, unitPrice, farmerId, scale, ...item }) => item),
        razorpayOrderId: gatewayPayment.razorpay_order_id,
        razorpayPaymentId: gatewayPayment.razorpay_payment_id,
        razorpaySignature: gatewayPayment.razorpay_signature,
      };
      const response = await orderService.create(orderPayload);
      clearPendingPayment();
      localStorage.removeItem('kc_checkout_cart');
      navigate(`/payment/success?orderId=${response.data.id}&amount=${response.data.totalAmount}&method=${pending.method}`);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message || 'Unable to complete order.'));
      setProcessing(false);
    }
  }, [navigate, pending]);

  const handlePay = async () => {
    if (!pending || !pending.keyId) {
      setMessage('❌ Payment gateway is not configured. Please contact support.');
      return;
    }
    setProcessing(true);
    setMessage('');
    try {
      const loaded = await loadRazorpayCheckout();
      if (!loaded) throw new Error('Unable to load Razorpay Checkout. Check your connection and try again.');

      const method = pending.method.toLowerCase();
      const methodLabels = {
        upi: 'UPI',
        card: 'Cards',
        netbanking: 'Netbanking',
        wallet: 'Wallet',
      };
      const checkout = new window.Razorpay({
        key: pending.keyId,
        order_id: pending.orderId,
        amount: pending.amount,
        currency: pending.currency,
        method,
        config: {
          display: {
            blocks: {
              selectedMethod: {
                name: `Pay via ${methodLabels[method] || 'selected method'}`,
                instruments: [{ method }],
              },
            },
            sequence: ['block.selectedMethod'],
            preferences: { show_default_blocks: false },
          },
        },
        name: 'KisanConnect',
        description: pending.description,
        prefill: pending.customer,
        handler: handlePaymentSuccess,
        modal: { ondismiss: () => setProcessing(false) },
        theme: { color: '#2d6a4f' },
      });
      checkout.on('payment.failed', (event) => {
        setProcessing(false);
        setMessage('❌ ' + (event.error?.description || 'Payment failed. Please try again.'));
      });
      checkout.open();
    } catch (err) {
      setProcessing(false);
      setMessage('❌ ' + (err.message || 'Unable to start payment.'));
    }
  };

  if (!pending) {
    return null;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f5f7f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: '#2d6a4f', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>💳 Payment confirmation</h1>
        <button onClick={handleBack} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fff', color: '#2d6a4f', fontWeight: 700 }}>← Back to checkout</button>
      </div>
      <div style={{ maxWidth: 920, margin: '24px auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 12px 30px rgba(0,0,0,.04)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Order summary</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {pending.items.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{item.name}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666' }}>{item.quantity} × ₹{item.unitPrice} / {item.scale}</p>
                </div>
                <div style={{ fontWeight: 700, color: '#2d6a4f' }}>₹{(item.unitPrice * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 14, borderTop: '1px solid #ddd', fontSize: 16, fontWeight: 700 }}>
              <span>Total to pay</span>
              <span>₹{(total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 12px 30px rgba(0,0,0,.04)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Payment method</h2>
          <div style={{ padding: 18, borderRadius: 14, background: '#f1f8f2', border: '1px solid #d8f0de', color: '#2d6a4f' }}>
            <p style={{ margin: 0, fontSize: 14 }}>Using <strong>{pending.method}</strong></p>
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#555' }}>Complete the payment in Razorpay Checkout. The order is placed only after server-side verification.</p>
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ margin: '0 0 20px', color: '#555' }}>Razorpay supports UPI apps and bank selection for netbanking.</p>
            <button onClick={handlePay} disabled={processing} style={{ width: '100%', padding: '12px 0', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 10, cursor: processing ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700 }}>
              {processing ? 'Opening secure checkout…' : `Pay ₹${(total / 100).toFixed(2)} with ${pending.method === 'NETBANKING' ? 'Net Banking' : pending.method}`}
            </button>
          </div>
          {message && <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: message.startsWith('❌') ? '#fdecea' : '#e8f5e9', color: message.startsWith('❌') ? '#a42222' : '#257a38' }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
