import api from './api';

export const eventService = {
  getAllEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getFeaturedEvents: async () => {
    const response = await api.get('/events/featured');
    return response.data;
  },

  getTrendingEvents: async () => {
    const response = await api.get('/events/trending');
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getCompletedEvents: async () => {
    const response = await api.get('/events/completed');
    return response.data;
  },

  getVenueBookings: async (data) => {
    const response = await api.get('/events/booked-slots', { 
      params: {
        venue: data.venue,
        date: data.date,
        eventId: data.eventId
      }
    });
    return response.data;
  },

  getEventResults: async (id) => {
    const response = await api.get(`/events/${id}/results`);
    return response.data;
  },
  
  getEventFullDetails: async (id) => {
    const response = await api.get(`/events/${id}/full-details`);
    return response.data;
  },

  addEventResult: async (id, resultData) => {
    const response = await api.post(`/events/${id}/results`, resultData);
    return response.data;
  },

  deleteEventResult: async (id, resultId) => {
    const response = await api.delete(`/events/${id}/results/${resultId}`);
    return response.data;
  },

  toggleRegistrationStatus: async (id, registrationOpen) => {
    const response = await api.patch(`/events/${id}/registration-status`, { registrationOpen });
    return response.data;
  }
};
