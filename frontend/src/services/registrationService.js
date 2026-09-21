import api from './api';

export const registrationService = {
  registerForEvent: async (eventId, data) => {
    const response = await api.post(`/registrations`, { eventId, ...data });
    return response.data;
  },

  getMyRegistrations: async () => {
    const response = await api.get('/registrations/my-registrations');
    return response.data;
  },

  getEventRegistrations: async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}`);
    return response.data;
  },

  updateRegistrationStatus: async (id, status) => {
    const response = await api.put(`/registrations/${id}`, { status });
    return response.data;
  },

  deleteRegistration: async (id) => {
    const response = await api.delete(`/registrations/${id}`);
    return response.data;
  },

  cancelPendingRegistration: async (id) => {
    const response = await api.delete(`/registrations/pending/${id}`);
    return response.data;
  }
};
