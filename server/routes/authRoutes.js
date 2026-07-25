const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  googleLogin, 
  verifyOTP, 
  resendOTP,
  verifyIDCard,
  addCollegeStudent,
  bulkImportCollegeStudents,
  getCollegeStudents,
  toggleDisableCollegeStudent,
  validateBarcode,
  loginBarcode,
  verifyLoginOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/validate-barcode', validateBarcode);
router.post('/login-barcode', loginBarcode);
router.post('/verify-login-otp', verifyLoginOTP);

router.post('/verify-id-card', verifyIDCard);
router.post('/admin/college-students', protect, adminOnly, addCollegeStudent);
router.post('/admin/college-students/bulk', protect, adminOnly, bulkImportCollegeStudents);
router.get('/admin/college-students', protect, adminOnly, getCollegeStudents);
router.patch('/admin/college-students/:id/toggle-disable', protect, adminOnly, toggleDisableCollegeStudent);

module.exports = router;
