const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');

// Helper to generate a unique certificate number
const generateCertificateNumber = () => {
  const prefix = 'CEH';
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${randomStr}`;
};

// @desc    Get eligible students for certificates (shows all registered students and their attendance)
// @route   GET /api/certificates/eligible/:eventId
// @access  Private (Admin)
const getEligibleStudents = async (req, res) => {
  try {
    const { eventId } = req.params;
    let query = { paymentStatus: { $in: ['completed', 'not_required'] } };
    if (eventId !== 'all') {
      query.eventId = eventId;
    }
    const registrations = await Registration.find(query)
      .populate('studentId', 'name registerNumber department collegeName')
      .populate('eventId', 'title');

    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve certificate for a single registration
// @route   POST /api/certificates/approve/:registrationId
// @access  Private (Admin)
const approveCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    const registration = await Registration.findById(registrationId).populate('eventId');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.certificateStatus === 'released') {
      return res.status(400).json({ success: false, message: 'Certificate already released' });
    }

    const verificationCode = uuidv4();
    const eventIdVal = registration.eventId?._id || registration.eventId || null;
    const eventTitle = registration.eventId?.title || 'Event';

    let certificate;
    let certNo = registration.certificateNumber;
    let retries = 5;

    while (retries > 0) {
      if (!certNo) {
        certNo = await Registration.generateCertificateNumber();
      }

      try {
        certificate = await Certificate.create({
          studentId: registration.studentId,
          studentType: registration.studentType,
          eventId: eventIdVal,
          registrationId,
          certificateNumber: certNo,
          verificationCode,
          status: 'approved',
          approvedBy: req.user.id,
          approvedAt: Date.now()
        });
        break;
      } catch (err) {
        if (err.code === 11000 && !registration.certificateNumber) {
          certNo = null; // force regenerate
          retries--;
        } else {
          throw err;
        }
      }
    }

    if (!certificate) {
      return res.status(500).json({ success: false, message: 'Failed to generate unique certificate number' });
    }

    registration.certificateStatus = 'released';
    if (!registration.certificateNumber) {
      registration.certificateNumber = certNo;
    }
    await registration.save();

    // Create notification
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: registration.studentId,
      userType: registration.studentType,
      title: 'Certificate Released 🎓',
      message: `Your certificate for "${eventTitle}" has been released! You can now verify and download it using your Certificate Number: ${certNo}.`,
      type: 'certificate'
    });

    res.json({ success: true, message: 'Certificate released successfully', data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk approve certificates for an event (Release Certificates)
// @route   POST /api/certificates/bulk-approve/:eventId
// @access  Private (Admin)
const bulkApprove = async (req, res) => {
  try {
    const { eventId } = req.params;
    let query = {
      attendanceStatus: 'present',
      paymentStatus: { $in: ['completed', 'not_required'] },
      certificateStatus: { $ne: 'released' }
    };
    
    if (eventId !== 'all') {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      query.eventId = eventId;
    }

    const { registrationIds } = req.body;
    if (registrationIds && Array.isArray(registrationIds) && registrationIds.length > 0) {
      query._id = { $in: registrationIds };
    }

    const eligibleRegistrations = await Registration.find(query).populate('eventId', 'title');

    if (eligibleRegistrations.length === 0) {
      return res.status(400).json({ success: false, message: 'No eligible pending students found' });
    }

    const newCertificates = [];
    const Notification = require('../models/Notification');
    const notificationsToInsert = [];
    const usedCertNos = new Set(); // track duplicates in current batch

    // Fetch already used cert numbers from DB to avoid clashes
    const existingCerts = await Certificate.find({}).select('certificateNumber');
    existingCerts.forEach(c => usedCertNos.add(c.certificateNumber));

    for (const reg of eligibleRegistrations) {
      let certNo = reg.certificateNumber;
      let retries = 5;
      let saved = false;
      let certificate = null;

      while (retries > 0 && !saved) {
        if (!certNo) {
          certNo = await Registration.generateCertificateNumber();
        }

        try {
          certificate = await Certificate.create({
            studentId: reg.studentId,
            studentType: reg.studentType,
            eventId: reg.eventId?._id || reg.eventId || null,
            registrationId: reg._id,
            certificateNumber: certNo,
            verificationCode: uuidv4(),
            status: 'approved',
            approvedBy: req.user.id,
            approvedAt: Date.now()
          });
          newCertificates.push(certificate);
          saved = true;
        } catch (err) {
          if (err.code === 11000 && !reg.certificateNumber) {
            certNo = null; // force regenerate
            retries--;
          } else {
            throw err;
          }
        }
      }

      if (!saved) {
        throw new Error(`Failed to generate unique certificate number for registration: ${reg._id}`);
      }

      // We must individually update the registration because each has a UNIQUE certNo
      await Registration.findByIdAndUpdate(reg._id, {
        $set: { 
          certificateStatus: 'released',
          certificateNumber: certNo
        }
      });

      const eventTitle = reg.eventId?.title || 'Event';
      notificationsToInsert.push({
        userId: reg.studentId,
        userType: reg.studentType,
        title: 'Certificate Released 🎓',
        message: `Your certificate for "${eventTitle}" has been released! You can now verify and download it using your Certificate Number: ${certNo}.`,
        type: 'certificate'
      });
    }

    if (newCertificates.length > 0) {
      await Certificate.insertMany(newCertificates);
    }
    
    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    res.json({
      success: true,
      message: `Successfully released ${newCertificates.length} certificates`,
      count: newCertificates.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's released certificates (only returns approved/released certs)
// @route   GET /api/certificates/my
// @access  Private (Student)
const getMyCertificates = async (req, res) => {
  try {
    // Only return certificates that have been officially released by admin (status: 'approved')
    // Certificates with status 'pending' are not visible to students
    const certificates = await Certificate.find({
      studentId: req.user.id,
      status: 'approved'   // 'approved' is the status set when admin releases a certificate
    })
      .populate('studentId', 'name department collegeName registerNumber')
      .populate('eventId', 'title date category')
      .sort({ issuedAt: -1 });
      
    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify certificate by code
// @route   GET /api/certificates/verify/:code
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const certificate = await Certificate.findOne({
      $or: [
        { verificationCode: code },
        { certificateNumber: { $regex: new RegExp(`^${code.trim()}$`, 'i') } }
      ]
    })
      .populate('studentId', 'name department collegeName registerNumber')
      .populate('eventId', 'title date category')
      .populate('registrationId', 'fullName usn collegeName');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Invalid certificate code' });
    }

    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

    if (isCloudinaryConfigured) {
      const streamUpload = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'certificate_templates', resource_type: 'auto' },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          stream.write(fileBuffer);
          stream.end();
        });
      };

      const result = await streamUpload(req.file.buffer);
      return res.json({ success: true, url: result.secure_url });
    } else {
      const uploadDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filename = `template-${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const port = process.env.PORT || 5001;
      const url = `${req.protocol}://${req.hostname}:${port}/uploads/${filename}`;
      return res.json({ success: true, url });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const layout = event.certificateEditorLayout || {};
    const template = {
      eventId,
      useDefault: false,
      templateUrl: event.certificateTemplatePath || '',
      placeholders: layout.placeholders || [],
      customTexts: layout.customTexts || [],
      customImages: layout.customImages || [],
      layout: layout.layout || {},
      showGrid: layout.showGrid || false,
      snapToGrid: layout.snapToGrid || false,
      zoom: layout.zoom || 100
    };

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { templateUrl, placeholders, customTexts, customImages, showGrid, snapToGrid, zoom, layout } = req.body;

    event.certificateTemplateType = 'custom';
    event.certificateTemplatePath = templateUrl || '';
    event.certificateEditorLayout = {
      placeholders: placeholders || [],
      customTexts: customTexts || [],
      customImages: customImages || [],
      layout: layout || {},
      showGrid: showGrid || false,
      snapToGrid: snapToGrid || false,
      zoom: zoom || 100
    };

    await event.save();

    const template = {
      eventId,
      useDefault: false,
      templateUrl: event.certificateTemplatePath,
      placeholders: event.certificateEditorLayout.placeholders,
      customTexts: event.certificateEditorLayout.customTexts,
      customImages: event.certificateEditorLayout.customImages,
      layout: event.certificateEditorLayout.layout || {},
      showGrid: event.certificateEditorLayout.showGrid,
      snapToGrid: event.certificateEditorLayout.snapToGrid,
      zoom: event.certificateEditorLayout.zoom
    };

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (event) {
      event.certificateTemplateType = 'custom';
      event.certificateTemplatePath = '';
      event.certificateEditorLayout = {};
      await event.save();
    }
    res.json({ success: true, message: 'Certificate template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateCertificate = async (req, res) => {
  try {
    const { eventId, participantData, registrationId } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const useDefault = false;
    const templatePath = event.certificateTemplatePath;
    const layout = event.certificateEditorLayout || {};

    let finalData = { ...participantData };
    if (registrationId) {
      const Registration = require('../models/Registration');
      const reg = await Registration.findById(registrationId).populate('studentId');
      if (reg) {
        finalData = {
          participant_name: reg.fullName || (reg.studentId && reg.studentId.name),
          college_name: reg.collegeName || (reg.studentId && reg.studentId.collegeName) || 'Sri Shanmugha College',
          event_name: event.title,
          event_date: event.date ? new Date(event.date).toLocaleDateString('en-GB') : '',
          venue: event.venue,
          position: reg.prize || 'Participant',
          certificate_id: reg.certificateNumber || 'CERT-001',
          issue_date: new Date().toLocaleDateString('en-GB'),
          coordinator_name: event.coordinators?.[0]?.name || 'Dr. V. Samkala',
          organization_name: event.organizer || 'SSCET',
          qr_code: reg.certificateNumber || 'CERT-001'
        };
      }
    }

    if (!templatePath) {
      return res.status(400).json({ success: false, message: 'Please upload a certificate template for this event before generating certificates.' });
    }

    if (templatePath.toLowerCase().endsWith('.pdf')) {
      return res.json({ success: true, useDefault: false, data: finalData });
    }

    const Jimp = require('jimp');
    let image;
    try {
      image = await Jimp.read(templatePath);
    } catch (imgError) {
      return res.status(400).json({ success: false, message: `Failed to load certificate template: ${imgError.message}` });
    }

    const width = image.getWidth();
    const height = image.getHeight();

    let font;
    try {
      font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    } catch (fontError) {
      font = null;
    }

    const toPxX = (px) => Math.round((Number(px) / 1123) * width);
    const toPxY = (px) => Math.round((Number(px) / 794) * height);

    for (const ph of (layout.placeholders || [])) {
      const key = ph.id || ph.name.replace(/[{}]/g, '');
      let value = finalData[key] || ph.name;
      
      const x = toPxX(ph.x);
      const y = toPxY(ph.y);
      const w = toPxX(ph.w || ph.width || 200);
      const h = toPxY(ph.h || ph.height || 40);

      if (ph.name === '{{qr_code}}' || ph.id === 'qr_code') {
        try {
          const QRCode = require('qrcode');
          const qrBuffer = await QRCode.toBuffer(value || 'Verify');
          const qrJimp = await Jimp.read(qrBuffer);
          qrJimp.resize({ width: w, height: h });
          image.composite(qrJimp, x, y);
        } catch (qrErr) {
          console.warn('QR overlay failed in Jimp:', qrErr.message);
        }
      } else if (font) {
        image.print({
          font,
          x,
          y: y + Math.round((h - font.info.size) / 2), // vertically center
          text: String(value),
          maxWidth: w
        });
      }
    }

    for (const t of (layout.customTexts || [])) {
      const x = toPxX(t.x);
      const y = toPxY(t.y);
      const w = toPxX(t.w || t.width || 200);
      const h = toPxY(t.h || t.height || 40);
      if (font) {
        image.print({
          font,
          x,
          y: y + Math.round((h - font.info.size) / 2),
          text: t.text,
          maxWidth: w
        });
      }
    }

    for (const img of (layout.customImages || [])) {
      try {
        const overlayImg = await Jimp.read(img.url);
        const oW = toPxX(img.w || img.width || 100);
        const oH = toPxY(img.h || img.height || 100);
        overlayImg.resize({ width: oW, height: oH });
        image.composite(overlayImg, toPxX(img.x), toPxY(img.y));
      } catch (err) {
        console.warn(`Failed to overlay image ${img.url}:`, err.message);
      }
    }

    const outputBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    res.set('Content-Type', Jimp.MIME_PNG);
    return res.send(outputBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate certificates event-wise (single or bulk) for present participants
// @route   POST /api/certificates/generate/:eventId
// @access  Private (Admin)
const generateEventCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { registrationId, userId, studentId, registrationIds } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Fetch the certificate template for this event
    const CertificateTemplate = require('../models/CertificateTemplate');
    const template = await CertificateTemplate.findOne({ eventId });
    const templateId = template ? template._id : null;

    let query = {
      eventId,
      attendanceStatus: 'present',
      paymentStatus: { $in: ['completed', 'not_required'] }
    };

    // Filter by single registration or user if provided
    if (registrationId) {
      query._id = registrationId;
    } else if (userId || studentId) {
      query.studentId = userId || studentId;
    } else if (registrationIds && Array.isArray(registrationIds) && registrationIds.length > 0) {
      query._id = { $in: registrationIds };
    }

    const registrations = await Registration.find(query).populate('eventId');
    if (registrations.length === 0) {
      if (registrationId || userId || studentId) {
        const regCheck = registrationId 
          ? await Registration.findById(registrationId)
          : await Registration.findOne({ studentId: userId || studentId, eventId });
        
        if (!regCheck) {
          return res.status(404).json({ success: false, message: 'Registration not found for the event.' });
        }
        if (regCheck.attendanceStatus !== 'present') {
          return res.status(400).json({ success: false, message: 'Cannot generate certificate: Attendance not marked present.' });
        }
      }
      return res.status(400).json({ success: false, message: 'No eligible present participants found for certificate generation.' });
    }

    let generatedCount = 0;
    let duplicateCount = 0;
    const results = [];

    for (const reg of registrations) {
      // Check: userId + eventId (Prevent Duplicate Certificates)
      const existingCert = await Certificate.findOne({
        studentId: reg.studentId,
        eventId: reg.eventId._id
      });

      if (existingCert) {
        duplicateCount++;
        if (registrationId || userId || studentId) {
          return res.status(400).json({ success: false, message: 'Certificate already generated.' });
        }
        continue;
      }

      // Generate certificate number
      let certNo = reg.certificateNumber;
      if (!certNo) {
        certNo = await Registration.generateCertificateNumber();
      }

      const verificationCode = uuidv4();

      const newCert = await Certificate.create({
        studentId: reg.studentId,
        userId: reg.studentId, // store userId as well
        studentType: reg.studentType,
        eventId: reg.eventId._id,
        registrationId: reg._id,
        certificateNumber: certNo,
        templateId,
        verificationCode,
        status: 'approved',
        approvedBy: req.user?.id,
        approvedAt: Date.now(),
        issuedAt: Date.now(),
        generatedAt: Date.now()
      });

      // Update registration status
      reg.certificateStatus = 'released';
      reg.certificateNumber = certNo;
      await reg.save();

      // Create notification
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: reg.studentId,
        userType: reg.studentType,
        title: 'Certificate Released 🎓',
        message: `Your certificate for "${reg.eventId.title}" has been released! You can now verify and download it using your Certificate Number: ${certNo}.`,
        type: 'certificate'
      });

      results.push(newCert);
      generatedCount++;
    }

    res.json({
      success: true,
      message: `Successfully generated ${generatedCount} certificates.${duplicateCount > 0 ? ` Skipped ${duplicateCount} already generated.` : ''}`,
      generatedCount,
      skippedCount: duplicateCount,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's released certificates
// @route   GET /api/certificates/user/:userId
// @access  Private
const getUserCertificates = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const certificates = await Certificate.find({
      $or: [
        { studentId: userId },
        { userId: userId }
      ],
      status: 'approved'
    })
      .populate('studentId', 'name department collegeName registerNumber')
      .populate('eventId', 'title date category venue time coordinators organizer')
      .sort({ issuedAt: -1 });

    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEligibleStudents,
  approveCertificate,
  bulkApprove,
  getMyCertificates,
  verifyCertificate,
  uploadTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  generateCertificate,
  generateEventCertificates,
  getUserCertificates
};
