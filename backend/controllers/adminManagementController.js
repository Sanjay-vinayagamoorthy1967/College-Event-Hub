const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { sendEmail, getOTPVerificationTemplate } = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Create a new admin
// @route   POST /api/admin/create-admin
// @access  Private/SuperAdmin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists with that email' });
    }

    const plainOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(plainOTP, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const newAdmin = await Admin.create({
      name,
      email,
      password, // Pre-save hook hashes it
      phone,
      role: 'admin',
      verified: false,
      otp: hashedOTP,
      otpExpiry,
      status: 'active'
    });

    if (newAdmin) {
      await sendEmail({
        to: email,
        subject: 'Verify Your Admin Account - College Event Hub',
        html: getOTPVerificationTemplate(name, plainOTP)
      });

      res.status(201).json({
        success: true,
        message: 'Admin created successfully. Verification email sent.',
        adminId: newAdmin._id
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all admins
// @route   GET /api/admin/list
// @access  Private/SuperAdmin
const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update admin details
// @route   PUT /api/admin/:id
// @access  Private/SuperAdmin
const updateAdmin = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const admin = await Admin.findById(req.params.id);

    if (admin) {
      admin.name = name || admin.name;
      admin.email = email || admin.email;
      admin.phone = phone || admin.phone;
      if (role && ['super_admin', 'admin'].includes(role)) {
        admin.role = role;
      }

      const updatedAdmin = await admin.save();
      const adminObj = updatedAdmin.toObject();
      delete adminObj.password;

      res.json({ success: true, message: 'Admin updated successfully', data: adminObj });
    } else {
      res.status(404).json({ success: false, message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private/SuperAdmin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    await Admin.deleteOne({ _id: admin._id });
    res.json({ success: true, message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle admin status (active/inactive)
// @route   PATCH /api/admin/:id/status
// @access  Private/SuperAdmin
const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate yourself' });
    }

    admin.status = admin.status === 'active' ? 'inactive' : 'active';
    await admin.save();

    res.json({ success: true, message: `Admin status changed to ${admin.status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAdmin,
  getAdmins,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
};
