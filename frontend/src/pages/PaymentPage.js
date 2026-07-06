import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
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

function StripePaymentForm({ pending, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [upiVpa, setUpiVpa] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleUpiPayment = async () => {
    if (!stripe) {
      onError('Stripe has not loaded yet.');
      return;
    }
    if (!upiVpa) {
      onError('Please enter your UPI ID.');
      return;
    }

    setProcessing(true);
    setStatusMessage('Processing UPI payment...');

    const { error, paymentIntent } = await stripe.confirmUPIPayment(pending.clientSecret, {
      payment_method: {
        type: 'upi',
        upi: {
          vpa: upiVpa,
        },
      },
    });

    if (error) {
      setProcessing(false);
      setStatusMessage('UPI payment failed.');
      onError(error.message || 'UPI payment failed.');
      return;
    }

    setProcessing(false);

    if (paymentIntent?.status === 'succeeded') {
      setStatusMessage('Payment completed. Verifying...');
      onSuccess(paymentIntent);
      return;
    }

    setStatusMessage(`Payment status: ${paymentIntent?.status}.`);
    onError(`Payment status: ${paymentIntent?.status}.`);
  };

  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe has not loaded yet.');
      return;
    }
    setProcessing(true);
    setStatusMessage('Processing card payment...');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element is not available.');
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(pending.clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setProcessing(false);
      setStatusMessage('Card payment failed.');
      onError(error.message || 'Card payment failed.');
      return;
    }

    setProcessing(false);
    setStatusMessage('Payment completed. Verifying...');
    onSuccess(paymentIntent);
  };

  if (!pending) return null;

  return (
    <div>
      {pending.method === 'UPI' ? (
        <div style={{ marginTop: 16, padding: 20, borderRadius: 14, background: '#fff', border: '1px solid #ddd' }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>Enter UPI ID</label>
          <input
            value={upiVpa}
            onChange={(e) => setUpiVpa(e.target.value)}
            placeholder="example@upi"
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #ccc', marginBottom: 18 }}
          />
          <button onClick={handleUpiPayment} disabled={processing || !stripe} style={{ width: '100%', padding: '12px 0', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 10, cursor: processing ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700 }}>
            {processing ? 'Completing UPI payment…' : 'Pay with UPI'}
          </button>
          {statusMessage && <p style={{ marginTop: 14, color: '#2d6a4f' }}>{statusMessage}</p>}
        </div>
      ) : (
        <div style={{ marginTop: 16, padding: 20, borderRadius: 14, background: '#fff', border: '1px solid #ddd' }}>
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#32325d', '::placeholder': { color: '#aab7c4' } } } }} />
          <button onClick={handleCardPayment} disabled={processing || !stripe} style={{ marginTop: 18, width: '100%', padding: '12px 0', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 10, cursor: processing ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700 }}>
            {processing ? 'Completing card payment…' : 'Pay with card'}
          </button>
          {statusMessage && <p style={{ marginTop: 14, color: '#2d6a4f' }}>{statusMessage}</p>}
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const saved = loadPendingPayment();
    if (!saved) {
      navigate('/checkout');
      return;
    }
    setPending(saved);
    if (saved.publishableKey) {
      setStripePromise(loadStripe(saved.publishableKey));
    }
  }, [navigate]);

  const total = useMemo(() => pending?.amount ?? 0, [pending]);

  const handleBack = () => {
    navigate('/checkout');
  };

  const handlePaymentSuccess = useCallback(async (paymentIntent) => {
    if (!pending) return;
    setProcessing(true);
    setMessage('Verifying payment...');

    try {
      const verifyResponse = await paymentService.verifyStripePayment({ paymentIntentId: paymentIntent.id });
      if (!verifyResponse.data.verified) {
        setMessage('❌ Payment verification failed: ' + verifyResponse.data.message);
        setProcessing(false);
        return;
      }

      const orderPayload = { items: pending.items.map(({ name, ...item }) => item) };
      const response = await orderService.create(orderPayload);
      clearPendingPayment();
      localStorage.removeItem('kc_checkout_cart');
      navigate(`/payment/success?orderId=${response.data.id}&amount=${response.data.totalAmount}&method=${pending.method}`);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message || 'Unable to complete order.'));
      setProcessing(false);
    }
  }, [navigate, pending]);

  const handleError = useCallback((errorMessage) => {
    setMessage('❌ ' + errorMessage);
  }, []);

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
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#555' }}>Your payment will be securely processed before the order is placed.</p>
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ margin: '0 0 20px', color: '#555' }}>Complete payment using Google Pay if supported by your browser.</p>
            <Elements stripe={stripePromise} options={{ clientSecret: pending.clientSecret }}>
              <StripePaymentForm pending={pending} onSuccess={handlePaymentSuccess} onError={handleError} />
            </Elements>
          </div>
          {message && <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: message.startsWith('❌') ? '#fdecea' : '#e8f5e9', color: message.startsWith('❌') ? '#a42222' : '#257a38' }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
