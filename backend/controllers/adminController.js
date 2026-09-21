const StudentInternal = require('../models/StudentInternal');
const StudentExternal = require('../models/StudentExternal');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const internalStudents = await StudentInternal.find({}).select('-password');
    const externalStudents = await StudentExternal.find({}).select('-password');
    
    res.json({
      success: true,
      data: {
        internal: internalStudents,
        external: externalStudents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const totalInternal = await StudentInternal.countDocuments();
    const totalExternal = await StudentExternal.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const attendanceCount = await Registration.countDocuments({ attendanceStatus: 'present' });
    const certificatesReleased = await Registration.countDocuments({ certificateStatus: { $in: ['released', 'generated'] } });
    const Notification = require('../models/Notification');
    const notificationsSent = await Notification.countDocuments();

    res.json({
      success: true,
      data: {
        totalStudents: totalInternal + totalExternal,
        totalEvents,
        totalRegistrations,
        internalStudents: totalInternal,
        externalStudents: totalExternal,
        totalPayments,
        totalRevenue,
        attendanceCount,
        certificatesReleased,
        notificationsSent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get full registration table for Excel/Management
// @route   GET /api/admin/registrations-table
// @access  Private/Admin
const getFullRegistrationTable = async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .populate('eventId', 'title date venue category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const payments = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = payments.map(p => ({
      name: months[p._id - 1] || 'Unknown',
      revenue: p.revenue
    }));
    
    // If empty, return some placeholder data so chart isn't empty
    if (chartData.length === 0) {
      chartData.push({ name: months[new Date().getMonth()], revenue: 0 });
    }
    
    res.json({ success: true, chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryChart = async (req, res) => {
  try {
    const events = await Event.aggregate([
      { $group: { _id: '$category', value: { $sum: 1 } } }
    ]);
    const chartData = events.map(e => ({ name: e._id || 'Other', value: e.value }));
    
    if (chartData.length === 0) {
      chartData.push({ name: 'None', value: 1 });
    }

    res.json({ success: true, chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRegistrationChart = async (req, res) => {
  try {
    const regs = await Registration.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Reorder to Mon-Sun
    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = { 'Mon': 2, 'Tue': 3, 'Wed': 4, 'Thu': 5, 'Fri': 6, 'Sat': 7, 'Sun': 1 };
    
    const chartData = displayDays.map(day => {
      const found = regs.find(r => r._id === dayMap[day]);
      return { date: day, count: found ? found.count : 0 };
    });

    res.json({ success: true, chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminRequests = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const requests = await Admin.find({ role: { $ne: 'super_admin' } }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveAdminRequest = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { sendEmail, getAdminApprovalTemplate } = require('../utils/sendEmail');
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin request not found' });
    }
    
    admin.approvalStatus = 'approved';
    admin.isActive = true;
    admin.role = 'admin';
    admin.verified = true;
    admin.approvedBy = req.user.id;
    admin.approvedAt = Date.now();
    await admin.save();
    
    try {
      await sendEmail({
        to: admin.email,
        subject: 'Your Admin Account is Approved',
        html: getAdminApprovalTemplate(admin.name)
      });
    } catch (e) {
      console.error('Email failed but approval succeeded:', e);
    }
    
    res.json({ success: true, message: 'Admin request approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectAdminRequest = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { sendEmail, getAdminRejectionTemplate } = require('../utils/sendEmail');
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin request not found' });
    }
    
    admin.approvalStatus = 'rejected';
    admin.isActive = false;
    admin.approvedBy = req.user.id;
    admin.approvedAt = Date.now();
    await admin.save();
    
    try {
      await sendEmail({
        to: admin.email,
        subject: 'Admin Registration Rejected',
        html: getAdminRejectionTemplate(admin.name)
      });
    } catch (e) {
      console.error('Email failed but rejection succeeded:', e);
    }
    
    res.json({ success: true, message: 'Admin request rejected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deactivateAdminRequest = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    admin.isActive = false;
    await admin.save();
    res.json({ success: true, message: 'Admin deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAdminRequest = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudents,
  getStats,
  getFullRegistrationTable,
  getRevenueChart,
  getCategoryChart,
  getRegistrationChart,
  getAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  deactivateAdminRequest,
  deleteAdminRequest
};
