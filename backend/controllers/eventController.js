const Event = require('../models/Event');
const EventResult = require('../models/EventResult');
const { updateEventStatuses } = require('../utils/eventStatusHelper');
// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    await updateEventStatuses();
    
    const { status, all, category, priceType } = req.query;
    const query = { isActive: true };

    if (all === 'true') {
      // Do not filter status if all=true
    } else if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['upcoming', 'ongoing'] };
    }

    if (category) {
      query.category = category;
    }

    if (priceType) {
      if (priceType === 'free') {
        query.internalPrice = 0;
        query.externalPrice = 0;
      } else if (priceType === 'paid') {
        query.$or = [
          { internalPrice: { $gt: 0 } },
          { externalPrice: { $gt: 0 } }
        ];
      }
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    await updateEventStatuses();
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { venue, date, startTime, endTime } = req.body;
    
    // Check for double booking (Overlap detection)
    if (venue && date && startTime && endTime) {
      const existingEvent = await Event.findOne({
        venue,
        date: new Date(date),
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      });
      if (existingEvent) {
        return res.status(409).json({ 
          success: false, 
          message: 'Venue already booked', 
          bookedSlot: `${existingEvent.startTime} - ${existingEvent.endTime}`,
          eventName: existingEvent.title
        });
      }
    }

    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'This venue is already booked for the selected time slot.' 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const { venue, date, startTime, endTime } = req.body;
    
    // Check for double booking (Overlap detection excluding current event)
    if (venue && date && startTime && endTime) {
      const existingEvent = await Event.findOne({ 
        venue, 
        date: new Date(date), 
        _id: { $ne: req.params.id },
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      });
      if (existingEvent) {
        return res.status(409).json({ 
          success: false, 
          message: 'Venue already booked', 
          bookedSlot: `${existingEvent.startTime} - ${existingEvent.endTime}`,
          eventName: existingEvent.title
        });
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'This venue is already booked for the selected time slot.' 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Require models for cascading deletes
    const Registration = require('../models/Registration');
    const Payment = require('../models/Payment');
    const Certificate = require('../models/Certificate');
    const Attendance = require('../models/Attendance');

    // Perform cascading deletes
    await Registration.deleteMany({ eventId: event._id });
    await Payment.deleteMany({ eventId: event._id });
    await Certificate.deleteMany({ eventId: event._id });
    await Attendance.deleteMany({ eventId: event._id });

    // Finally delete the event
    await Event.findByIdAndDelete(req.params.id);

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all completed events
// @route   GET /api/events/completed
// @access  Public
const getCompletedEvents = async (req, res) => {
  try {
    await updateEventStatuses();
    
    // Simply fetch completed events from the database directly by status
    const completedEvents = await Event.find({ isActive: true, status: 'completed' }).sort({ date: -1 });

    const dataWithResults = completedEvents.map(event => ({
      ...event.toObject(),
      hasResults: !!(event.firstPrize && event.firstPrize.winnerName)
    }));

    res.json({ success: true, count: dataWithResults.length, data: dataWithResults });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const FIXED_SLOTS = [
  { start: '09:00', end: '10:00', label: '09:00 AM - 10:00 AM' },
  { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
  { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
  { start: '12:00', end: '13:00', label: '12:00 PM - 01:00 PM' },
  { start: '13:00', end: '14:00', label: '01:00 PM - 02:00 PM' },
  { start: '14:00', end: '15:00', label: '02:00 PM - 03:00 PM' },
  { start: '15:00', end: '16:00', label: '03:00 PM - 04:00 PM' },
  { start: '16:00', end: '17:00', label: '04:00 PM - 05:00 PM' }
];

// @desc    Get venue bookings for a specific date
// @route   GET /api/events/booked-slots
// @access  Private/Admin
const getVenueBookings = async (req, res) => {
  try {
    const { venue, date, eventId } = req.query;
    
    if (!venue || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = {
      venue,
      date: new Date(date)
    };

    if (eventId) {
      query._id = { $ne: eventId };
    }

    const existingEvents = await Event.find(query).select('startTime endTime title');
    
    const availableSlots = [];
    const bookedSlots = [];

    FIXED_SLOTS.forEach(slot => {
      const overlap = existingEvents.find(e => slot.start < e.endTime && slot.end > e.startTime);
      if (overlap) {
        bookedSlots.push({ slot: slot.label, eventName: overlap.title, startTime: slot.start, endTime: slot.end });
      } else {
        availableSlots.push(slot.label);
      }
    });
    
    return res.status(200).json({ success: true, availableSlots, bookedSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle event registration status
// @route   PATCH /api/events/:id/registration-status
// @access  Private/Admin
const toggleRegistrationStatus = async (req, res) => {
  try {
    const { registrationOpen } = req.body;
    
    const updateData = { registrationOpen };
    if (registrationOpen === false) {
      updateData.registrationClosedAt = new Date();
    } else {
      updateData.$unset = { registrationClosedAt: "" };
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getCompletedEvents,
  getVenueBookings,
  toggleRegistrationStatus
};
