const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');
const { parseDateTime } = require('../utils/eventStatusHelper');

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private (Student)
const registerForEvent = async (req, res) => {
  try {
    const { 
      eventId, 
      fullName, 
      usn, 
      collegeName, 
      department, 
      yearSemester, 
      email, 
      phone, 
      foodPreference,
      registrationType = 'individual',
      teamSize = 1,
      teamName,
      teamMembers
    } = req.body;
    
    // 1. Validate Event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // A. Check if registration is open
    if (event.registrationOpen === false) {
      return res.status(403).json({ success: false, message: 'Registration is currently closed for this event.' });
    }

    // B. Check if event is full
    if (event.registeredCount >= event.seatLimit) {
      return res.status(400).json({ success: false, message: 'Registration is full. All seats have been filled.' });
    }

    // C & D. Check if event has completed or already started — using IST-correct UTC arithmetic
    // (uses parseDateTime from eventStatusHelper to avoid the UTC/IST setHours() mismatch bug)
    const now = new Date();

    const endDateTime   = parseDateTime(event.date, event.endTime)   || parseDateTime(event.date, '11:59 PM');
    const startDateTime = parseDateTime(event.date, event.startTime) || parseDateTime(event.date, '09:00 AM');

    if (now >= endDateTime) {
      return res.status(400).json({ success: false, message: 'Registration is closed because the event has completed.' });
    }

    if (now >= startDateTime) {
      return res.status(400).json({ success: false, message: 'Registration is closed because the event has already started.' });
    }

    const isTeam = registrationType === 'team';
    const parsedTeamSize = isTeam ? Number(teamSize) : 1;

    if (isTeam) {
      if (isNaN(parsedTeamSize) || parsedTeamSize < 2 || parsedTeamSize > 4) {
        return res.status(400).json({ success: false, message: 'Team size must be between 2 and 4 members' });
      }
      if (!teamName || teamName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Team Name is required' });
      }
      const requiredMembersCount = parsedTeamSize - 1;
      if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length !== requiredMembersCount) {
        return res.status(400).json({ success: false, message: `Team must have exactly ${parsedTeamSize} members (including the leader)` });
      }
      for (const member of teamMembers) {
        if (!member.name || !member.usn || !member.email || !member.phone) {
          return res.status(400).json({ success: false, message: 'All details (Name, USN, Email, Mobile) are required for all team members' });
        }
      }
    }

    const seatIncrement = isTeam ? parsedTeamSize : 1;

    if (event.registeredCount + seatIncrement > event.seatLimit) {
      return res.status(400).json({ 
        success: false, 
        message: `Not enough seats available. Required: ${seatIncrement}, Available: ${event.seatLimit - event.registeredCount}` 
      });
    }

    // 2. Check if already registered
    const existingRegistration = await Registration.findOne({
      studentId: req.user.id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    // 3. Determine pricing and status
    const studentTypeModel = req.user.type === 'student_internal' ? 'StudentInternal' : 'StudentExternal';
    const rawFee = studentTypeModel === 'StudentInternal' ? event.internalPrice : event.externalPrice;
    const singleFee = Number(rawFee) || 0;
    const totalFee = isTeam ? singleFee * parsedTeamSize : singleFee;
    
    const isFree = totalFee <= 0;
    const paymentStatus = isFree ? 'not_required' : 'pending';
    const status = isFree ? 'approved' : 'pending'; // Only approve immediately if free
    
    const secureToken = isFree ? uuidv4() : undefined;
    const qrData = '';

    const registrationData = {
      studentId: req.user.id,
      studentType: studentTypeModel,
      eventId,
      fullName,
      usn,
      collegeName,
      department,
      yearSemester,
      email,
      phone,
      status,
      paymentStatus,
      secureToken,
      qrData,
      foodPreference,
      registrationType,
      teamSize: parsedTeamSize,
      teamName: isTeam ? teamName : '',
      teamMembers: isTeam ? teamMembers : []
    };

    // If paid, DO NOT create the registration yet.
    if (!isFree) {
      return res.status(201).json({ 
        success: true, 
        data: registrationData, // return the raw data to be used in verifyPayment
        requiresPayment: true,
        fee: totalFee
      });
    }

    // 4. Create registration for FREE events
    const registration = await Registration.create(registrationData);

    // Ensure Participant record exists
    const { ensureParticipant } = require('../utils/participantHelper');
    const participant = await ensureParticipant(req.user.id, studentTypeModel, req.body);

    // For free events: now update qrData with participantId and eventId
    await Registration.findByIdAndUpdate(registration._id, {
      qrData: JSON.stringify({ participantId: participant._id.toString(), eventId: eventId.toString() })
    });

    // Use atomic increment to prevent race conditions for free events
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, registeredCount: { $lte: event.seatLimit - seatIncrement } },
      { $inc: { registeredCount: seatIncrement } },
      { new: true }
    );

    if (!updatedEvent) {
      // Race condition lost, delete the registration we just created
      await Registration.findByIdAndDelete(registration._id);
      return res.status(400).json({ success: false, message: 'Registration failed: seats filled up just now.' });
    }

    // Close registration if we hit the limit
    if (updatedEvent.registeredCount >= updatedEvent.seatLimit) {
      await Event.findByIdAndUpdate(eventId, { 
        registrationOpen: false,
        registrationClosedAt: new Date()
      });
    }

    // Embed registration credentials in qrData
    registration.qrData = JSON.stringify({
      participantId: participant._id.toString(),
      eventId: eventId.toString()
    });
    registration.certificateNumber = await Registration.generateCertificateNumber();
    await registration.save();

    res.status(201).json({ 
      success: true, 
      data: registration,
      requiresPayment: false,
      fee: 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's registrations
// @route   GET /api/registrations/my-registrations
// @access  Private
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ studentId: req.user.id }).populate('eventId');
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registrations (Admin)
// @route   GET /api/registrations
// @access  Private/Admin
const getRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().populate('eventId').populate('studentId');
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update registration status
// @route   PUT /api/registrations/:id
// @access  Private/Admin
const updateRegistration = async (req, res) => {
  try {
    const { status } = req.body;
    let registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (status === 'approved' && registration.status !== 'approved') {
      const event = registration.eventId ? await Event.findById(registration.eventId) : null;
      if (event) {
        const increment = registration.teamSize || 1;
        event.registeredCount += increment;
        await event.save();
      }
    } else if (status !== 'approved' && registration.status === 'approved') {
      const event = registration.eventId ? await Event.findById(registration.eventId) : null;
      if (event) {
        const increment = registration.teamSize || 1;
        event.registeredCount -= increment;
        await event.save();
      }
    }

    registration.status = status;
    await registration.save();

    res.json({ success: true, data: registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel pending registration (Student)
// @route   DELETE /api/registrations/pending/:id
// @access  Private (Student)
const cancelPendingRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this registration' });
    }

    if (registration.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending registrations can be cancelled' });
    }

    // Delete associated payment records
    await Payment.deleteMany({ registrationId: registration._id });

    // Delete the registration
    await Registration.findByIdAndDelete(registration._id);

    res.json({ success: true, message: 'Pending registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete registration
// @route   DELETE /api/registrations/:id
// @access  Private/Admin
const deleteRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // If it was approved, decrement the count
    if (registration.status === 'approved') {
      const increment = -(registration.teamSize || 1);
      
      // Update event registered count atomically
      await Event.updateOne(
        { _id: registration.eventId },
        { $inc: { registeredCount: increment } }
      );
      
      // Optionally reopen registration if it was closed
      const event = await Event.findById(registration.eventId);
      if (event && event.registeredCount < event.seatLimit && !event.registrationOpen) {
        await Event.updateOne(
          { _id: event._id },
          { registrationOpen: true }
        );
      }
    }

    // Delete associated payment records
    await Payment.deleteMany({ registrationId: req.params.id });

    // Delete the registration
    await Registration.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin add registration for a student
// @route   POST /api/registrations/admin/add
// @access  Private/Admin
const addRegistrationByAdmin = async (req, res) => {
  try {
    const { 
      eventId, 
      fullName, 
      usn, 
      collegeName, 
      department, 
      email, 
      phone,
      paymentStatus = 'completed' // Admins can bypass payment or mark as completed
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.registrationOpen === false) {
      return res.status(400).json({ success: false, message: 'Registration is currently closed for this event.' });
    }

    if (event.registeredCount >= event.seatLimit) {
      return res.status(400).json({ success: false, message: 'Registration is full. All seats have been filled.' });
    }

    const StudentInternal = require('../models/StudentInternal');
    const StudentExternal = require('../models/StudentExternal');
    
    let student = await StudentInternal.findOne({ $or: [{ email }, { usn }] });
    let studentType = 'StudentInternal';
    
    if (!student) {
      student = await StudentExternal.findOne({ $or: [{ email }, { usn }] });
      studentType = 'StudentExternal';
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found. Ensure the student has registered an account with this Email/USN.' });
    }

    // Check duplicate
    const existingRegistration = await Registration.findOne({
      studentId: student._id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'Student is already registered for this event.' });
    }

    const secureToken = uuidv4();
    const certificateNumber = await Registration.generateCertificateNumber();
    
    const registrationData = {
      studentId: student._id,
      studentType: studentType,
      eventId,
      fullName: fullName || student.name,
      usn: usn || student.registerNumber,
      collegeName: collegeName || student.collegeName || 'Unknown',
      department: department || student.department || 'Unknown',
      yearSemester: student.year || 'Unknown',
      email: email || student.email,
      phone: phone || student.phoneNumber || '0000000000',
      status: 'approved',
      paymentStatus: paymentStatus,
      secureToken,
      qrData: '',
      registrationType: 'individual',
      teamSize: 1,
      certificateNumber
    };

    const registration = await Registration.create(registrationData);
    const regId = registration._id;

    // Update QR Data
    await Registration.findByIdAndUpdate(regId, {
      qrData: JSON.stringify({ registrationId: regId.toString(), token: secureToken })
    });

    // Increment seats atomically
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, registeredCount: { $lte: event.seatLimit - 1 } },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      // Race condition lost, delete the registration we just created
      await Registration.findByIdAndDelete(regId);
      return res.status(400).json({ success: false, message: 'Registration failed: seats filled up just now.' });
    }

    // Close registration if full
    if (updatedEvent.registeredCount >= updatedEvent.seatLimit) {
      await Event.findByIdAndUpdate(eventId, { 
        registrationOpen: false,
        registrationClosedAt: new Date()
      });
    }

    res.status(201).json({ success: true, message: 'Registration added successfully', data: registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getRegistrations,
  updateRegistration,
  deleteRegistration,
  cancelPendingRegistration,
  addRegistrationByAdmin
};
