const express = require('express');
const router = express.Router();
const {
  scanQR,
  getEventAttendance,
  markAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.post('/scan', protect, adminOnly, scanQR);
router.post('/mark', protect, adminOnly, markAttendance);
router.get('/event/:eventId', protect, adminOnly, getEventAttendance);

module.exports = router;
