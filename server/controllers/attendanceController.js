const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const { ensureParticipant } = require('../utils/participantHelper');

// @desc    Scan QR/Barcode and Mark Attendance (Smart Attendance System)
// @route   POST /api/attendance/scan
// @access  Private (Admin)
const scanQR = async (req, res) => {
  try {
    const { eventId, barcodeValue, qrValue, mode } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let participant;

    if (mode === 'barcode' || barcodeValue) {
      // ---------------------------------
      // BARCODE SCANNING (INTERNAL STUDENTS)
      // ---------------------------------
      const sinNo = (barcodeValue || qrValue || '').trim();
      participant = await Participant.findOne({ SIN_NO: sinNo });
      
      if (!participant) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      if (participant.participantType !== 'INTERNAL') {
        return res.status(400).json({ success: false, message: 'Not an Internal Student.' });
      }
    } else {
      // ---------------------------------
      // QR CODE SCANNING (EXTERNAL PARTICIPANTS)
      // ---------------------------------
      let qrData;
      try {
        qrData = JSON.parse(qrValue);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid QR Code Format' });
      }

      let qrParticipantId = qrData.participantId;
      let qrEventId = qrData.eventId;

      if (!qrParticipantId && qrData.registrationId) {
        // Fallback for legacy QR codes
        const reg = await Registration.findById(qrData.registrationId);
        if (reg) {
          const p = await ensureParticipant(reg.studentId, reg.studentType, reg);
          qrParticipantId = p._id;
          qrEventId = reg.eventId;
        }
      }

      if (!qrParticipantId || !qrEventId) {
        return res.status(400).json({ success: false, message: 'Invalid QR Code data.' });
      }

      // Validate: QR belongs to the selected event
      if (qrEventId.toString() !== eventId.toString()) {
        return res.status(400).json({ success: false, message: 'This QR Code belongs to a different event.' });
      }

      participant = await Participant.findById(qrParticipantId);
      if (!participant) {
        return res.status(404).json({ success: false, message: 'Participant not found.' });
      }
    }

    // Validate: Participant is registered for the selected event
    const registration = await Registration.findOne({
      studentId: participant.studentId,
      eventId: eventId
    });

    if (!registration) {
      return res.status(400).json({ success: false, message: 'Participant is not registered for this event.' });
    }

    // Verify payment status
    if (registration.paymentStatus !== 'completed' && registration.paymentStatus !== 'not_required') {
      return res.status(400).json({ success: false, message: 'Payment pending. Cannot mark attendance.' });
    }

    // Check if attendance is already marked
    if (registration.attendanceStatus === 'present') {
      return res.status(400).json({ success: false, message: 'Attendance already marked.' });
    }

    // Mark attendance in Registration
    registration.attendanceStatus = 'present';
    await registration.save();

    // Create or update Attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { participantId: participant._id, eventId },
      {
        registrationId: registration._id,
        studentId: participant.studentId,
        studentType: participant.studentType,
        participantId: participant._id,
        status: 'present',
        scannedBy: req.user.id,
        scannedAt: Date.now(),
        markedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    // Create student notification
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: participant.studentId,
      userType: participant.studentType,
      title: 'Attendance Verified ✅',
      message: `Your attendance for "${event.title}" has been successfully verified.`,
      type: 'registration'
    });

    res.json({
      success: true,
      message: 'Attendance marked successfully.',
      data: {
        studentName: participant.name,
        usn: participant.SIN_NO || 'N/A',
        college: participant.college,
        participantType: participant.participantType,
        attendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance for an event (returns all registrations with their attendance status and details)
// @route   GET /api/attendance/event/:eventId
// @access  Private (Admin)
const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Find all registrations for this event
    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name registerNumber email phone')
      .populate('eventId', 'title');

    // Also get all Attendance records for this event
    const attendanceRecords = await Attendance.find({ eventId });
    const attendanceMap = {};
    attendanceRecords.forEach(att => {
      const studentIdStr = att.studentId?.toString();
      if (studentIdStr) {
        attendanceMap[studentIdStr] = att;
      }
    });

    const data = registrations.map(reg => {
      const studentIdStr = reg.studentId?._id?.toString() || reg.studentId?.toString();
      const attRecord = attendanceMap[studentIdStr];
      return {
        _id: reg._id,
        studentId: reg.studentId,
        studentType: reg.studentType,
        fullName: reg.fullName,
        usn: reg.usn,
        email: reg.email,
        phone: reg.phone,
        collegeName: reg.collegeName,
        department: reg.department,
        registrationType: reg.registrationType,
        eventId: reg.eventId,
        paymentStatus: reg.paymentStatus,
        attendanceStatus: reg.attendanceStatus || (attRecord ? attRecord.status : 'absent'),
        certificateStatus: reg.certificateStatus,
        certificateNumber: reg.certificateNumber,
        markedAt: attRecord ? (attRecord.markedAt || attRecord.scannedAt || attRecord.updatedAt) : null
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance for a student (Present or Absent)
// @route   POST /api/attendance/mark
// @access  Private (Admin)
const markAttendance = async (req, res) => {
  try {
    const { registrationId, userId, studentId, eventId, status } = req.body;

    let registration;
    if (registrationId) {
      registration = await Registration.findById(registrationId);
    } else {
      const uId = userId || studentId;
      registration = await Registration.findOne({ studentId: uId, eventId });
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const normStatus = (status || '').toLowerCase() === 'present' ? 'present' : 'absent';

    // Update registration status
    registration.attendanceStatus = normStatus;
    await registration.save();

    // Ensure Participant record exists
    const participant = await ensureParticipant(registration.studentId, registration.studentType, registration);

    // Create or update Attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { studentId: registration.studentId, eventId: registration.eventId },
      {
        registrationId: registration._id,
        participantId: participant._id,
        studentId: registration.studentId,
        studentType: registration.studentType,
        status: normStatus,
        scannedBy: req.user?.id,
        scannedAt: normStatus === 'present' ? Date.now() : null,
        markedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Attendance marked as ${normStatus === 'present' ? 'Present' : 'Absent'}`,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  scanQR,
  getEventAttendance,
  markAttendance
};
