import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializeRazorpayCheckout = async (registrationId, amount, user, eventTitle, onSuccess, onFailure) => {
  try {
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      toast.error('Failed to load Razorpay. Please check your internet connection.');
      if (onFailure) onFailure('Script load failed');
      return;
    }

    // 1. Create order on backend
    const orderData = await paymentService.createOrder(registrationId, amount);
    
    if (!orderData.success) {
      toast.error('Could not initiate payment. Try again.');
      if (onFailure) onFailure('Order creation failed');
      return;
    }

    const { order, key, isMock } = orderData.data;

    if (isMock) {
      // Bypass Razorpay completely for local testing
      toast('Test Mode: Simulating successful payment...', { icon: '🧪' });
      setTimeout(async () => {
        try {
          const verificationData = await paymentService.verifyPayment({
            razorpay_order_id: order.id,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: 'mock_signature',
            registrationId
          });
          if (verificationData.success) {
            toast.success('Test Payment successful! Registration confirmed.');
            if (onSuccess) onSuccess(verificationData.data);
          }
        } catch (err) {
          toast.error('Test Payment failed.');
        }
      }, 1500);
      return;
    }

    // 2. Setup Razorpay options
    const options = {
      key: key,
      amount: order.amount,
      currency: order.currency,
      name: 'College Event Hub',
      description: `Registration for ${eventTitle}`,
      order_id: order.id,
      handler: async function (response) {
        try {
          // 3. Verify payment on backend
          const verificationData = await paymentService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            registrationId
          });

          if (verificationData.success) {
            toast.success('Payment successful! Registration confirmed.');
            if (onSuccess) onSuccess(verificationData.data);
          } else {
            toast.error('Payment verification failed.');
            if (onFailure) onFailure('Verification failed');
          }
        } catch (err) {
          console.error(err);
          toast.error('Error verifying payment.');
          if (onFailure) onFailure('Verification error');
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: '#10B981' // Emerald 500
      },
      modal: {
        ondismiss: function() {
          toast('Payment cancelled.', { icon: '⚠️' });
          if (onFailure) onFailure('Payment cancelled by user');
        }
      }
    };

    // 4. Open Razorpay Checkout
    const razorpayInstance = new window.Razorpay(options);
    
    razorpayInstance.on('payment.failed', function (response) {
      toast.error(response.error.description || 'Payment failed.');
      if (onFailure) onFailure(response.error.description);
    });

    razorpayInstance.open();

  } catch (error) {
    console.error('Razorpay Error:', error);
    toast.error('Something went wrong initializing payment.');
    if (onFailure) onFailure(error.message);
  }
};
