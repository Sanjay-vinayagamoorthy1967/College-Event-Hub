const DeletionRequest = require('../models/DeletionRequest');
const StudentInternal = require('../models/StudentInternal');
const StudentExternal = require('../models/StudentExternal');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');

// @desc    Student submits account deletion request
// @route   POST /api/deletion-requests
// @access  Private (students only)
const submitDeletionRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;
    const userType = req.user.type; // 'student_internal' | 'student_external'
    const userModel = userType === 'student_internal' ? 'StudentInternal' : 'StudentExternal';

    // Prevent duplicate pending requests
    const existing = await DeletionRequest.findOne({ studentId: userId, status: 'pending' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending deletion request. Please wait for admin review.'
      });
    }

    // Fetch user info
    let student = null;
    if (userModel === 'StudentInternal') {
      student = await StudentInternal.findById(userId);
    } else {
      student = await StudentExternal.findById(userId);
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const request = await DeletionRequest.create({
      studentId: userId,
      studentModel: userModel,
      name: student.name,
      email: student.email,
      usn: student.usn || '',
      reason: reason || '',
    });

    res.status(201).json({ success: true, data: request, message: 'Deletion request submitted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin gets all deletion requests
// @route   GET /api/deletion-requests
// @access  Private (admin only)
const getDeletionRequests = async (req, res) => {
  try {
    const requests = await DeletionRequest.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin approves deletion request (deletes student account + data)
// @route   PUT /api/deletion-requests/:id/approve
// @access  Private (admin only)
const approveDeletionRequest = async (req, res) => {
  try {
    const request = await DeletionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Deletion request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}.` });
    }

    const { adminNote } = req.body;

    // Delete the student's data
    const studentId = request.studentId;

    // Delete registrations
    await Registration.deleteMany({ studentId });

    // Delete certificates
    await Certificate.deleteMany({ studentId });

    // Delete the student account
    if (request.studentModel === 'StudentInternal') {
      await StudentInternal.findByIdAndDelete(studentId);
    } else {
      await StudentExternal.findByIdAndDelete(studentId);
    }

    // Mark request as approved
    request.status = 'approved';
    request.adminNote = adminNote || 'Account deleted by admin.';
    request.resolvedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Student account and all associated data have been permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin denies deletion request
// @route   PUT /api/deletion-requests/:id/deny
// @access  Private (admin only)
const denyDeletionRequest = async (req, res) => {
  try {
    const request = await DeletionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Deletion request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}.` });
    }

    const { adminNote } = req.body;

    request.status = 'denied';
    request.adminNote = adminNote || 'Request denied by admin.';
    request.resolvedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Deletion request has been denied.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitDeletionRequest,
  getDeletionRequests,
  approveDeletionRequest,
  denyDeletionRequest,
};
