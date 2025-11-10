import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../../services/api'; // Fixed path

function PaymentForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderAPI.getById(orderId);
      setOrder(res.data.data);
      setAmountPaid(res.data.data.total_amount);
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      setLoading(false);
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    
    if (parseFloat(amountPaid) < parseFloat(order.total_amount)) {
      alert('Amount paid is less than order total!');
      return;
    }

    setProcessing(true);
    try {
      await paymentAPI.process({
        order_id: parseInt(orderId),
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid),
        payment_status: 'completed'
      });

      alert('✅ Payment processed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('❌ Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading">Loading order details...</div>;
  if (!order) return <div className="error">Order not found</div>;

  const change = parseFloat(amountPaid) - parseFloat(order.total_amount);

  return (
    <div className="container fade-in">
      <button onClick={() => navigate('/orders')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        ← Back to Orders
      </button>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card">
          <h1>💳 Process Payment</h1>
          
          <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
            <h3>Order Summary</h3>
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Order ID:</strong> #{order.order_id}</p>
              <p><strong>Customer:</strong> {order.customer_name || 'Walk-in'}</p>
              <p><strong>Type:</strong> {order.order_type}</p>
              {order.table_number && <p><strong>Table:</strong> {order.table_number}</p>}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #dee2e6' }}>
              <h2 style={{ display: 'flex', justifyContent: 'space-between', color: '#2c3e50' }}>
                <span>Total Amount:</span>
                <span>₹{order.total_amount}</span>
              </h2>
            </div>
          </div>

          <form onSubmit={processPayment} style={{ marginTop: '2rem' }}>
            <div className="form-group">
              <label>Payment Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={paymentMethod === 'cash' ? 'btn btn-primary' : 'btn btn-secondary'}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={paymentMethod === 'card' ? 'btn btn-primary' : 'btn btn-secondary'}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={paymentMethod === 'upi' ? 'btn btn-primary' : 'btn btn-secondary'}
                >
                  📱 UPI
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Amount Paid *</label>
              <input
                type="number"
                className="form-control"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                step="0.01"
                min={order.total_amount}
                required
                style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
              />
            </div>

            {change > 0 && (
              <div style={{ background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                <strong>Change to return:</strong> ₹{change.toFixed(2)}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.2rem' }}
              disabled={processing}
            >
              {processing ? 'Processing...' : '✓ Complete Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;
