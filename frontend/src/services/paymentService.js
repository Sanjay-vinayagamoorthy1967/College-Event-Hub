import api from './api';

export const paymentService = {
  createOrder: async (eventId, amount) => {
    const response = await api.post('/payments/create-order', { eventId, amount });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  getAllPayments: async () => {
    const response = await api.get('/payments/all');
    return response.data;
  }
};
