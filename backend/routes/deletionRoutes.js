const express = require('express');
const router = express.Router();
const {
  submitDeletionRequest,
  getDeletionRequests,
  approveDeletionRequest,
  denyDeletionRequest,
} = require('../controllers/deletionController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Student: submit a deletion request
router.post('/', protect, submitDeletionRequest);

// Admin: list all requests
router.get('/', protect, adminOnly, getDeletionRequests);

// Admin: approve or deny a specific request
router.put('/:id/approve', protect, adminOnly, approveDeletionRequest);
router.put('/:id/deny', protect, adminOnly, denyDeletionRequest);

module.exports = router;
