import api from './api';

export const authService = {
  login: async (email, password, type) => {
    const response = await api.post('/auth/login', { email, password, type });
    return response.data;
  },

  adminLogin: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  googleLogin: async (token) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },


  register: async (data, type) => {
    // Backend expects type in req.body
    let payload = data;
    let headers = {};
    
    if (data instanceof FormData) {
      data.append('type', type);
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      payload = { ...data, type };
    }

    const response = await api.post(`/auth/register`, payload, { headers });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  verifyOTP: async (email, otp, type) => {
    const response = await api.post('/auth/verify-otp', { email, otp, type });
    return response.data;
  },

  resendOTP: async (email, type) => {
    const response = await api.post('/auth/resend-otp', { email, type });
    return response.data;
  },

  verifyIDCard: async (qrVerificationCode) => {
    const response = await api.post('/auth/verify-id-card', { qrVerificationCode });
    return response.data;
  },

  validateBarcode: async (barcodeValue) => {
    const response = await api.post('/auth/validate-barcode', { barcodeValue });
    return response.data;
  },

  getInternalStudentBySin: async (sinNo) => {
    const response = await api.get(`/internal-students/sin/${sinNo}`);
    return response.data;
  },

  checkRegistration: async (sinNumber) => {
    const response = await api.post('/internal/check-registration', { sinNumber });
    return response.data;
  },

  loginBarcode: async (barcodeValue) => {
    const response = await api.post('/auth/login-barcode', { barcodeValue });
    return response.data;
  },

  verifyLoginOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-login-otp', { email, otp });
    return response.data;
  },

  addCollegeStudent: async (studentData) => {
    const response = await api.post('/auth/admin/college-students', studentData);
    return response.data;
  },

  bulkImportCollegeStudents: async (students) => {
    const response = await api.post('/auth/admin/college-students/bulk', { students });
    return response.data;
  },

  getCollegeStudents: async () => {
    const response = await api.get('/auth/admin/college-students');
    return response.data;
  },

  toggleDisableCollegeStudent: async (id) => {
    const response = await api.patch(`/auth/admin/college-students/${id}/toggle-disable`);
    return response.data;
  }
};
