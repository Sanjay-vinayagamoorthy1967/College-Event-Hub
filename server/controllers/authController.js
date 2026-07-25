const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const StudentInternal = require('../models/StudentInternal');
const StudentExternal = require('../models/StudentExternal');
const PendingRegistration = require('../models/PendingRegistration');
const CollegeStudent = require('../models/CollegeStudent');
const { sendEmail, getOTPVerificationTemplate } = require('../utils/sendEmail');
const Tesseract = require('tesseract.js');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


const generateToken = (id, role, type) => {
  return jwt.sign({ id, role, type }, process.env.JWT_SECRET || 'super_secret_jwt_key_here_for_event_hub_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { type } = req.body;
    
    if (type === 'student_internal' || type === 'student_external' || type === 'admin') {
      const email = req.body.email?.trim();
      const registerNumber = req.body.registerNumber;

      // Basic email validation: must contain @
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address containing @.' });
      }

      // Check if user already exists in main collections
      let userExists;
      if (type === 'student_internal') {
        if (!registerNumber) {
          return res.status(400).json({ success: false, message: 'ID card SIN code is required.' });
        }

        const sinExists = await StudentInternal.findOne({ registerNumber });
        if (sinExists) {
          return res.status(400).json({ success: false, message: 'This college student ID is already registered. Please sign in.' });
        }

        userExists = await StudentInternal.findOne({ email });
      } else if (type === 'student_external') {
        userExists = await StudentExternal.findOne({ email });
      } else if (type === 'admin') {
        userExists = await Admin.findOne({ email });
      }

      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with that email or register number' });
      }

      // Check if there is an existing pending registration
      const pendingExists = await PendingRegistration.findOne({ email });
      if (pendingExists) {
        await PendingRegistration.deleteOne({ email });
      }

      const plainOTP = generateOTP();
      console.log(`[Auth System] OTP Generated for ${email}: ${plainOTP}`);
      const hashedOTP = await bcrypt.hash(plainOTP, 10);
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      // Save to PendingRegistration with the exact email user entered
      await PendingRegistration.create({
        email,
        type,
        userData: { ...req.body, email },
        otp: hashedOTP,
        otpExpiry
      });

      try {
        await sendEmail({
          to: email,
          subject: 'Verify Your Email - College Event Hub',
          html: getOTPVerificationTemplate(req.body.name, plainOTP)
        });
      } catch (emailError) {
        console.warn(`[SMTP Warning] Email verification failed to send to ${email}. But proceeding with local OTP: ${plainOTP}`);
      }

      res.status(201).json({
        success: true,
        message: `OTP sent to email. Please verify. (Debug: Check terminal for OTP)`,
        email,
        type
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid registration type' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, type: requestedType } = req.body;

    let user;
    let type;
    let role;

    if (requestedType === 'admin') {
      user = await Admin.findOne({ email });
      type = 'admin';
      role = 'admin';
    } else if (requestedType === 'student_internal') {
      // Sri Shanmugha internal students must log in with @shanmugha.edu.in only
      const emailDomain = email.trim().toLowerCase().split('@')[1];
      if (emailDomain !== 'shanmugha.edu.in') {
        return res.status(401).json({
          success: false,
          message: 'Invalid login. Sri Shanmugha College students must use their official @shanmugha.edu.in email address.'
        });
      }
      user = await StudentInternal.findOne({ email });
      type = 'student_internal';
      role = 'student';
    } else if (requestedType === 'student_external') {
      user = await StudentExternal.findOne({ email }).select('+password');
      type = 'student_external';
      role = 'student';
    } else {
      // Fallback if type not explicitly provided
      user = await Admin.findOne({ email });
      if (user) { type = 'admin'; role = 'admin'; }
      if (!user) { user = await StudentInternal.findOne({ email }); if(user) { type = 'student_internal'; role = 'student'; } }
      if (!user) { user = await StudentExternal.findOne({ email }).select('+password'); if(user) { type = 'student_external'; role = 'student'; } }
    }

    if (user && !user.verified) {
      return res.status(401).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    if (user && type === 'admin') {
      if (user.approvalStatus === 'pending') {
        return res.status(401).json({ success: false, message: 'Your admin account is waiting for Super Admin approval.' });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(401).json({ success: false, message: 'Your admin registration request has been rejected.' });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Your admin account is not active.' });
      }
    }

    console.log('--- LOGIN ATTEMPT ---');
    console.log('Body:', { email, passReceived: !!password, requestedType });
    console.log('User Found:', !!user, 'Type:', type, 'Role:', role);
    if (user) {
      console.log('Match Password Result:', await user.matchPassword(password));
    }
    
    if (user && (await user.matchPassword(password))) {
      const userObj = user.toObject();
      delete userObj.password;
      
      const finalRole = user.role || role;
      
      res.json({
        success: true,
        token: generateToken(user._id, finalRole, type),
        user: {
          ...userObj,
          id: user._id,
          role: finalRole,
          type
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    let user;
    if (req.user.type === 'admin') {
      user = await Admin.findById(req.user.id).select('-password');
    } else if (req.user.type === 'student_internal') {
      user = await StudentInternal.findById(req.user.id).select('-password');
    } else if (req.user.type === 'student_external') {
      user = await StudentExternal.findById(req.user.id).select('-password');
    }

    if (user) {
      res.json({
        success: true,
        user: {
          ...user._doc,
          role: user.role || req.user.role,
          type: req.user.type
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id');

// @desc    Auth user via Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google Token is required' });
    }

    // Verify Google ID Token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id', 
      });
    } catch (err) {
      console.warn("Real token verification failed, using dummy decode for testing if allowed.");
      // For local testing without a real client ID setup:
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
         const decodedStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
         ticket = { getPayload: () => JSON.parse(decodedStr) };
      } else {
         throw new Error('Invalid token structure');
      }
    }

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture: profilePicture } = payload;
    
    if (!email || (!email.endsWith('@shanmugha.edu.in') && !email.endsWith('@gmail.com'))) {
      return res.status(403).json({ success: false, message: 'Access Denied: Only @shanmugha.edu.in institutional emails (or @gmail.com for testing) are permitted.' });
    }

    // Check if user already exists
    let user = await StudentInternal.findOne({ email });

    if (!user) {
      // Auto-register the student with defaults for missing required fields
      user = await StudentInternal.create({
        name: name || email.split('@')[0],
        email: email,
        registerNumber: email.split('@')[0].toUpperCase(), // Treat prefix as register number
        department: 'General',
        year: '1',
        phone: '0000000000',
        gender: 'Other',
        password: googleId || Math.random().toString(36).slice(-8), // Dummy password
        type: 'student_internal',
        googleId,
        profilePicture,
        lastLoginTime: new Date()
      });
    } else {
      // Update existing user
      user.googleId = googleId;
      if (profilePicture) user.profilePicture = profilePicture;
      user.lastLoginTime = new Date();
      await user.save();
    }

    // Ensure Participant record exists
    const { ensureParticipant } = require('../utils/participantHelper');
    await ensureParticipant(user._id, 'StudentInternal', user);

    const userObj = user.toObject();
    delete userObj.password;
    res.json({
      success: true,
      token: generateToken(user._id, 'student', 'student_internal'),
      user: {
        ...userObj,
        id: user._id,
        role: 'student',
        type: 'student_internal'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    const pendingUser = await PendingRegistration.findOne({ email });

    if (!pendingUser) {
      return res.status(404).json({ success: false, message: 'No pending registration found for this email. OTP may have expired (15 min limit).' });
    }

    if (new Date() > new Date(pendingUser.otpExpiry)) {
      return res.status(400).json({ success: false, message: 'OTP Expired' });
    }

    const isMatch = await bcrypt.compare(otp, pendingUser.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP verified! Move user from PendingRegistration to actual Student collection
    const userData = pendingUser.userData;
    let newUser;
    let role = (type === 'admin') ? 'admin' : 'student';

    if (type === 'student_internal') {
      newUser = await StudentInternal.create({
        name: userData.name,
        registerNumber: userData.registerNumber,
        department: userData.department,
        year: userData.year,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        password: userData.password, // bcrypt will hash it in the pre-save hook
        verified: true
      });
      
      // Ensure Participant record exists
      const { ensureParticipant } = require('../utils/participantHelper');
      await ensureParticipant(newUser._id, 'StudentInternal', newUser);

      // Link verification record
      await CollegeStudent.findOneAndUpdate(
        { studentId: userData.registerNumber },
        { 
          isRegistered: true, 
          registeredUserId: newUser._id 
        }
      );
    } else if (type === 'student_external') {
      newUser = await StudentExternal.create({
        name: userData.name,
        collegeName: userData.collegeName,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        year: userData.year,
        department: userData.department,
        password: userData.password,
        idCardUrl: userData.idCardUrl || null,
        verified: true
      });

      // Ensure Participant record exists
      const { ensureParticipant } = require('../utils/participantHelper');
      await ensureParticipant(newUser._id, 'StudentExternal', newUser);
    } else if (type === 'admin') {
      const isMainAdmin = userData.email.toLowerCase() === 'e23cs021@shanmugha.edu.in';
      
      newUser = await Admin.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: isMainAdmin ? 'super_admin' : 'admin',
        approvalStatus: isMainAdmin ? 'approved' : 'pending',
        isActive: isMainAdmin ? true : false,
        verified: true
      });
      
      // If not main admin, notify main admin about the new request
      if (!isMainAdmin) {
        try {
          const { sendEmail, getAdminRequestNotificationTemplate } = require('../utils/sendEmail');
          await sendEmail({
            to: 'e23cs021@shanmugha.edu.in',
            subject: 'New Admin Approval Request',
            html: getAdminRequestNotificationTemplate({
              name: userData.name,
              email: userData.email,
              phone: userData.phone
            })
          });
        } catch (emailErr) {
          console.error('Failed to send admin request notification:', emailErr);
        }
      }
    }

    // Delete pending record
    await PendingRegistration.deleteOne({ email });

    const userObj = newUser.toObject();
    delete userObj.password;
    
    if (newUser.approvalStatus === 'pending') {
      return res.json({
        success: true,
        message: 'Your admin registration is waiting for approval from the Main Administrator.',
        requiresApproval: true
      });
    }

    const finalRole = newUser.role || role;

    res.json({
      success: true,
      message: 'Email verified successfully! Account created.',
      token: generateToken(newUser._id, finalRole, type),
      user: {
        ...userObj,
        id: newUser._id,
        role: finalRole,
        type: type
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const pendingUser = await PendingRegistration.findOne({ email });

    if (!pendingUser) {
      return res.status(404).json({ success: false, message: 'No pending registration found for this email. You may need to sign up again.' });
    }

    const plainOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(plainOTP, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    pendingUser.otp = hashedOTP;
    pendingUser.otpExpiry = otpExpiry;
    await pendingUser.save();

    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - College Event Hub',
        html: getOTPVerificationTemplate(pendingUser.userData.name, plainOTP)
      });
    } catch (emailError) {
      console.warn(`[SMTP Warning] Resend verification email failed to send to ${email}. But proceeding with local OTP: ${plainOTP}`);
    }

    res.json({
      success: true,
      message: 'OTP resent successfully. (Debug: Check terminal for OTP)'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const fs = require('fs');
const path = require('path');
const { Jimp, intToRGBA } = require('jimp');

// Helper to check for the official silver circular hologram symbol on the ID card
const verifyHologram = (jimpImage) => {
  const width = jimpImage.bitmap.width;
  const height = jimpImage.bitmap.height;

  // The hologram is located on the middle-left side of the card
  // Let's check region: x from 10% to 50%, y from 25% to 65% of the dimensions
  const startX = Math.floor(width * 0.1);
  const endX = Math.floor(width * 0.5);
  const startY = Math.floor(height * 0.25);
  const endY = Math.floor(height * 0.65);

  let silverPoints = 0;

  for (let x = startX; x < endX; x += 2) {
    for (let y = startY; y < endY; y += 2) {
      const pixelColor = jimpImage.getPixelColor(x, y);
      const rgba = intToRGBA(pixelColor);

      // Silver/gray holographic sheen: balanced RGB values with high brightness
      const isSilverSheen = (
        rgba.r > 90 && rgba.g > 90 && rgba.b > 90 &&
        Math.abs(rgba.r - rgba.g) < 20 &&
        Math.abs(rgba.r - rgba.b) < 20 &&
        Math.abs(rgba.g - rgba.b) < 20
      );

      if (isSilverSheen) {
        silverPoints++;
      }
    }
  }

  console.log('[Security Check] Detected silver circular hologram points:', silverPoints);
  // Valid hologram requires a cluster of silver shiny pixels
  return silverPoints >= 70;
};

const validateBarcode = async (req, res) => {
  try {
    const { barcodeValue } = req.body;
    if (!barcodeValue) {
      return res.status(400).json({ success: false, message: 'Barcode value is required.' });
    }

    const sin = barcodeValue.trim().toUpperCase();
    const email = sin.toLowerCase() + '@shanmugha.edu.in';

    // 1. Check if generated email / registerNumber already exists in StudentInternal
    const studentExists = await StudentInternal.findOne({
      $or: [
        { registerNumber: sin },
        { email: email }
      ]
    });

    if (studentExists) {
      return res.status(400).json({ success: false, message: 'Account already exists.' });
    }

    // 2. Check if the barcode/registerNumber exists in the CollegeStudent database
    let collegeStudent = await CollegeStudent.findOne({ studentId: sin });
    if (!collegeStudent) {
      collegeStudent = await CollegeStudent.create({
        studentId: sin,
        name: `Student ${sin}`,
        collegeName: 'Sri Shanmugha College of Engineering and Technology',
        department: 'CSE',
        batch: '2023-2027',
        qrVerificationCode: `QR_${sin}`
      });
      console.log(`[Auto Seed] Created eligible CollegeStudent record for barcode: ${sin}`);
    }

    if (collegeStudent.isDisabled) {
      return res.status(400).json({ success: false, message: 'This student ID has been disabled.' });
    }

    res.json({
      success: true,
      sin,
      email,
      name: collegeStudent.name,
      department: collegeStudent.department || 'CSE',
      batch: collegeStudent.batch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyIDCard = async (req, res) => {
  try {
    const { qrVerificationCode } = req.body;
    if (!qrVerificationCode) {
      return res.status(400).json({ success: false, message: 'Invalid QR/barcode code' });
    }

    const studentRecord = await CollegeStudent.findOne({ qrVerificationCode });
    if (!studentRecord) {
      return res.status(404).json({ success: false, message: 'Student verification failed. Please contact your college administration.' });
    }

    if (studentRecord.isDisabled) {
      return res.status(400).json({ success: false, message: 'Code disabled' });
    }

    if (studentRecord.isRegistered) {
      return res.status(400).json({ success: false, message: 'This student ID is already registered. Please sign in instead.' });
    }

    if (!studentRecord.collegeName.includes('Sri Shanmugha')) {
      return res.status(400).json({ success: false, message: 'Code belongs to another college' });
    }

    res.json({
      success: true,
      data: {
        studentId: studentRecord.studentId,
        name: studentRecord.name,
        collegeName: studentRecord.collegeName,
        department: studentRecord.department || '',
        batch: studentRecord.batch || '',
        validUntil: studentRecord.validUntil || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addCollegeStudent = async (req, res) => {
  try {
    const student = await CollegeStudent.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const bulkImportCollegeStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ success: false, message: 'Students array required' });
    }

    const results = [];
    for (const data of students) {
      try {
        const student = await CollegeStudent.create(data);
        results.push(student);
      } catch (err) {
        console.warn(`Bulk import skip: ${data.studentId} - ${err.message}`);
      }
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCollegeStudents = async (req, res) => {
  try {
    const students = await CollegeStudent.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleDisableCollegeStudent = async (req, res) => {
  try {
    const student = await CollegeStudent.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    student.isDisabled = !student.isDisabled;
    await student.save();
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const loginBarcode = async (req, res) => {
  try {
    const { barcodeValue } = req.body;
    if (!barcodeValue) {
      return res.status(400).json({ success: false, message: 'Barcode value is required.' });
    }

    const sin = barcodeValue.trim().toUpperCase();
    
    // Find the internal student
    const student = await StudentInternal.findOne({ registerNumber: sin });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Generate OTP
    const plainOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(plainOTP, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    student.otp = hashedOTP;
    student.otpExpiry = otpExpiry;
    await student.save();

    console.log(`[Barcode Login OTP] Generated for ${student.email}: ${plainOTP}`);

    // Send email
    try {
      await sendEmail({
        to: student.email,
        subject: 'Login Verification - College Event Hub',
        html: getOTPVerificationTemplate(student.name, plainOTP)
      });
    } catch (emailError) {
      console.warn(`[SMTP Warning] Login OTP email failed to send to ${student.email}. But proceeding with local OTP: ${plainOTP}`);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully.',
      email: student.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const student = await StudentInternal.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (!student.otp || !student.otpExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP already verified.' });
    }

    if (new Date() > new Date(student.otpExpiry)) {
      return res.status(400).json({ success: false, message: 'OTP Expired' });
    }

    const isMatch = await bcrypt.compare(otp, student.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Clear OTP
    student.otp = undefined;
    student.otpExpiry = undefined;
    student.verified = true; // ensure they are verified if logged in
    await student.save();

    // Generate JWT token
    const token = generateToken(student._id, 'student', 'student_internal');

    const userObj = student.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        ...userObj,
        id: student._id,
        role: 'student',
        type: 'student_internal'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  verifyOTP,
  resendOTP,
  verifyIDCard,
  addCollegeStudent,
  bulkImportCollegeStudents,
  getCollegeStudents,
  toggleDisableCollegeStudent,
  validateBarcode,
  loginBarcode,
  verifyLoginOTP
};

