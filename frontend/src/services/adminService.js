import api from './api';

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getRevenueChart: async () => {
    const response = await api.get('/admin/revenue-chart');
    return response.data;
  },

  getCategoryChart: async () => {
    const response = await api.get('/admin/category-chart');
    return response.data;
  },

  getRegistrationChart: async () => {
    const response = await api.get('/admin/registration-chart');
    return response.data;
  },

  markAttendance: async (registrationId, token) => {
    const response = await api.post('/attendance/scan', { registrationId, token });
    return response.data;
  },

  scanAttendance: async (eventId, scanData) => {
    const response = await api.post('/attendance/scan', { eventId, ...scanData });
    return response.data;
  },

  markAttendanceEventWise: async (registrationId, status) => {
    const response = await api.post('/attendance/mark', { registrationId, status });
    return response.data;
  },

  getEventAttendance: async (eventId) => {
    const response = await api.get(`/attendance/event/${eventId}`);
    return response.data;
  },

  generateCertificate: async (registrationId) => {
    const response = await api.post(`/certificates/generate/${registrationId}`);
    return response.data;
  },

  generateCertificateForEvent: async (eventId, body = {}) => {
    const response = await api.post(`/certificates/generate/${eventId}`, body);
    return response.data;
  },

  getUserCertificates: async (userId) => {
    const response = await api.get(`/certificates/user/${userId}`);
    return response.data;
  },

  verifyCertificate: async (code) => {
    const response = await api.get(`/certificates/verify/${code}`);
    return response.data;
  },

  getMyCertificates: async () => {
    const response = await api.get('/certificates/my');
    return response.data;
  },

  getEligibleStudents: async (eventId) => {
    const response = await api.get(`/certificates/eligible/${eventId}`);
    return response.data;
  },

  approveCertificate: async (registrationId) => {
    const response = await api.post(`/certificates/approve/${registrationId}`);
    return response.data;
  },

  bulkApproveCertificates: async (eventId, registrationIds = []) => {
    const response = await api.post(`/certificates/bulk-approve/${eventId}`, { registrationIds });
    return response.data;
  },

  getFullRegistrationTable: async () => {
    const response = await api.get('/admin/registrations-table');
    return response.data;
  },

  addStudentRegistration: async (data) => {
    const response = await api.post('/registrations/admin/add', data);
    return response.data;
  },

  sendAnnouncement: async (title, message, type) => {
    const response = await api.post('/notifications/announcement', { title, message, type });
    return response.data;
  },

  getMyNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  submitFeedback: async (eventId, rating, comment) => {
    const response = await api.post(`/feedback/${eventId}`, { rating, comment });
    return response.data;
  },

  getEventFeedback: async (eventId) => {
    const response = await api.get(`/feedback/event/${eventId}`);
    return response.data;
  },

  uploadTemplate: async (formData, onProgress) => {
    const response = await api.post('/certificates/template/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  },

  getTemplate: async (eventId) => {
    const response = await api.get(`/certificates/template/${eventId}`);
    return response.data;
  },

  updateTemplate: async (eventId, config) => {
    const response = await api.put(`/certificates/template/${eventId}`, config);
    return response.data;
  },

  deleteTemplate: async (eventId) => {
    const response = await api.delete(`/certificates/template/${eventId}`);
    return response.data;
  },

  generateCustomCertificate: async (generationData) => {
    const response = await api.post('/certificates/generate', generationData);
    return response.data;
  }
};
