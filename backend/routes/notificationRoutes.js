const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  sendAnnouncement
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.post('/announcement', protect, adminOnly, sendAnnouncement);

module.exports = router;
