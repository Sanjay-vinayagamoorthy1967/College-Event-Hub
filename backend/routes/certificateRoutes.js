const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getEligibleStudents,
  approveCertificate,
  bulkApprove,
  getMyCertificates,
  verifyCertificate,
  uploadTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  generateCertificate,
  generateEventCertificates,
  getUserCertificates
} = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Configure custom multer for template upload (PNG, JPG, JPEG, PDF up to 20MB)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed!'), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

router.get('/eligible/:eventId', protect, adminOnly, getEligibleStudents);
router.post('/approve/:registrationId', protect, adminOnly, approveCertificate);
router.post('/bulk-approve/:eventId', protect, adminOnly, bulkApprove);
router.get('/my', protect, getMyCertificates);
router.get('/verify/:code', verifyCertificate); // Public

// Template management routes
router.post('/template/upload', protect, adminOnly, upload.single('template'), uploadTemplate);
router.get('/template/:eventId', protect, getTemplate);
router.put('/template/:eventId', protect, adminOnly, updateTemplate);
router.delete('/template/:eventId', protect, adminOnly, deleteTemplate);
router.post('/generate', protect, generateCertificate);
router.post('/generate/:eventId', protect, adminOnly, generateEventCertificates);
router.get('/user/:userId', protect, getUserCertificates);

module.exports = router;
