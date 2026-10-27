import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, paymentService } from '../services/api';

const PAYMENT_METHODS = [
  { key: 'UPI', label: 'UPI' },
  { key: 'CARD', label: 'Credit / Debit Card' },
  { key: 'NETBANKING', label: 'Net Banking' },
  { key: 'WALLET', label: 'Mobile Wallet' },
];

const STORAGE_KEY = 'kc_checkout_cart';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export default function Checkout() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState(PAYMENT_METHODS[0].key);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    postalCode: user?.postalCode || '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const saved = loadCart();
    if (!saved.length) {
      setMessage('Your cart is empty. Add items before checkout.');
    }
    setCart(saved);
  }, [navigate, user]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const hasCompleteAddress = Boolean(user?.addressLine1?.trim() && user?.city?.trim()
    && user?.state?.trim() && user?.postalCode?.trim());
  const buyerAddress = user ? [user.addressLine1, user.addressLine2, user.city && user.state ? `${user.city}, ${user.state}` : '', user.postalCode].filter(Boolean).join(', ') : '';

  const handleBack = () => {
    navigate('/products');
  };

  const handleAddressChange = (event) => {
    setAddressForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setSavingAddress(true);
    setMessage('');
    try {
      const { data } = await authService.updateAddress(user.userId, addressForm);
      updateUser(data);
      setMessage('✅ Delivery address saved. You can continue to payment.');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Could not save your address. Please try again.'));
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePay = async () => {
    if (!cart.length) return;
    if (!hasCompleteAddress) {
      setMessage('Add and save your delivery address before continuing to payment.');
      return;
    }
    setProcessing(true);
    setMessage('');
    try {
      const payload = {
        items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
      };
      const paymentResponse = await paymentService.createOrder(payload);
      const gatewayOrder = paymentResponse.data;
      const pending = {
        orderId: gatewayOrder.orderId,
        keyId: gatewayOrder.keyId,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        method,
        items: cart,
        description: gatewayOrder.description,
        customer: { name: user.name, email: user.email, contact: user.phone || '' },
      };
      localStorage.setItem('kc_pending_payment', JSON.stringify(pending));
      navigate('/payment');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Payment failed. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f5f7f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: '#2d6a4f', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🌾 Checkout</h1>
        <button onClick={handleBack} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fff', color: '#2d6a4f', fontWeight: 700 }}>← Back to marketplace</button>
      </div>
      <div style={{ maxWidth: 980, margin: '24px auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 12px 30px rgba(0,0,0,.04)' }}>
          <h2 style={{ margin: 0, marginBottom: 16, fontSize: 20 }}>Review your order</h2>
          {hasCompleteAddress && <div style={{ marginBottom: 18, padding: 14, borderRadius: 10, background: '#f3f6f3', border: '1px solid #dfe7df' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2d6a4f', marginBottom: 6 }}>Shipping address</div>
            <div style={{ fontSize: 13, color: '#444' }}>{buyerAddress}</div>
          </div>}
          {!cart.length && <p style={{ color: '#555' }}>Your cart is empty. Add items to proceed with payment.</p>}
          {!hasCompleteAddress && <form onSubmit={handleSaveAddress} style={{ marginBottom: 20, padding: 16, background: '#fff8e8', border: '1px solid #f0dfb8', borderRadius: 8 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Add your delivery address</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5d625d' }}>We need this to place and deliver your order. You can add it now without returning to registration.</p>
            {[['addressLine1','Address line 1','House number, street, village'],['addressLine2','Address line 2 (optional)','Colony or landmark'],['city','City','City'],['state','State','State'],['postalCode','Postal code','PIN code']].map(([name,label,placeholder]) => (
              <label key={name} style={{ display: 'block', marginTop: 10, fontSize: 12, fontWeight: 600, color: '#34443b' }}>
                {label}
                <input name={name} value={addressForm[name]} onChange={handleAddressChange} placeholder={placeholder}
                  required={name !== 'addressLine2'} autoComplete={name === 'addressLine1' ? 'address-line1' : name === 'addressLine2' ? 'address-line2' : name === 'postalCode' ? 'postal-code' : name === 'city' ? 'address-level2' : 'address-level1'}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '10px 11px', border: '1px solid #cfd8d1', borderRadius: 6, font: 'inherit', fontWeight: 400 }} />
              </label>
            ))}
            <button type="submit" disabled={savingAddress} style={{ marginTop: 14, padding: '10px 14px', background: '#2d6a4f', color: '#fff', border: 0, borderRadius: 6, fontWeight: 700, cursor: savingAddress ? 'wait' : 'pointer' }}>
              {savingAddress ? 'Saving address…' : 'Save delivery address'}
            </button>
          </form>}
          {cart.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid #eee' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{item.name}</p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666' }}>{item.quantity} × ₹{item.unitPrice} / {item.scale}</p>
              </div>
              <div style={{ fontWeight: 700, color: '#2d6a4f' }}>₹{(item.unitPrice * item.quantity).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 14, borderTop: '1px solid #ddd', fontSize: 16, fontWeight: 700 }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 12px 30px rgba(0,0,0,.04)' }}>
          <h2 style={{ margin: 0, marginBottom: 16, fontSize: 20 }}>Payment options</h2>
          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {PAYMENT_METHODS.map((opt) => (
              <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, border: method === opt.key ? '2px solid #2d6a4f' : '1px solid #ddd', cursor: 'pointer', background: method === opt.key ? '#e8f5e9' : '#fff' }}>
                <input type="radio" name="payment-method" value={opt.key} checked={method === opt.key} onChange={() => setMethod(opt.key)} />
                <span style={{ fontWeight: 600 }}>{opt.label}</span>
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#555' }}>Order will be placed after payment completion.</p>
            <button onClick={handlePay} disabled={processing || !cart.length} style={{ width: '100%', padding: '12px 0', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 10, cursor: processing || !cart.length ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700 }}>
              {processing ? 'Processing payment…' : method === 'UPI' ? `Continue to payment` : `Pay ₹${total.toFixed(2)} with ${PAYMENT_METHODS.find(p => p.key === method)?.label}`}
            </button>
          </div>
          <div style={{ fontSize: 13, color: '#555' }}>
            <p style={{ margin: '0 0 6px' }}><strong>Note:</strong> UPI and netbanking are processed securely by Razorpay.</p>
            <p style={{ margin: 0 }}>Your order and payment details are secured before you are redirected to the buyer dashboard.</p>
          </div>
          {message && <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: message.startsWith('✅') ? '#e8f5e9' : '#fdecea', color: message.startsWith('✅') ? '#257a38' : '#a42222' }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
