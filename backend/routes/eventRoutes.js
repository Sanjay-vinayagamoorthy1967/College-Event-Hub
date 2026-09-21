const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getCompletedEvents,
  getVenueBookings,
  toggleRegistrationStatus
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { getEventResults, addEventResult, deleteEventResult, getEventFullDetails } = require('../controllers/resultController');

router.route('/')
  .get(getEvents)
  .post(protect, adminOnly, createEvent);

router.get('/booked-slots', protect, adminOnly, getVenueBookings);

router.patch('/:id/registration-status', protect, adminOnly, toggleRegistrationStatus);

router.route('/completed')
  .get(getCompletedEvents);

router.route('/:id')
  .get(getEventById)
  .put(protect, adminOnly, updateEvent)
  .delete(protect, adminOnly, deleteEvent);

router.get('/:id/full-details', getEventFullDetails);

router.route('/:id/results')
  .get(getEventResults)
  .post(protect, adminOnly, addEventResult);

router.route('/:id/results/:resultId')
  .delete(protect, adminOnly, deleteEventResult);

module.exports = router;
