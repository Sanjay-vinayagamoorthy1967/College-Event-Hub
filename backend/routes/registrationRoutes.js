const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyRegistrations,
  getRegistrations,
  updateRegistration,
  deleteRegistration,
  cancelPendingRegistration,
  addRegistrationByAdmin
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.post('/admin/add', protect, adminOnly, addRegistrationByAdmin);

router.route('/')
  .post(protect, registerForEvent)
  .get(protect, adminOnly, getRegistrations);

router.get('/my-registrations', protect, getMyRegistrations);

router.delete('/pending/:id', protect, cancelPendingRegistration);

router.route('/:id')
  .put(protect, adminOnly, updateRegistration)
  .delete(protect, adminOnly, deleteRegistration);

module.exports = router;
