const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private (Student)
const createOrder = async (req, res) => {
  try {
    const { eventId, amount } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${req.user.id}_${Date.now()}`,
    };

    // If we are using placeholder keys, we mock the Razorpay order creation for testing purposes.
    const isTesting = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' || process.env.RAZORPAY_KEY_ID.includes('xxx');
    let order;

    if (isTesting) {
      order = {
        id: `mock_order_${Date.now()}`,
        amount: options.amount,
        currency: options.currency
      };
    } else {
      order = await razorpay.orders.create(options);
      if (!order) {
        return res.status(500).json({ success: false, message: 'Failed to create order' });
      }
    }

    // Create a pending payment record
    const payment = await Payment.create({
      studentId: req.user.id,
      studentType: req.user.type === 'student_internal' ? 'StudentInternal' : 'StudentExternal',
      eventId: event._id,
      amount,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        order,
        paymentId: payment._id,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        isMock: isTesting
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private (Student)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationData } = req.body;

    const isTesting = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' || process.env.RAZORPAY_KEY_ID.includes('xxx');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    
    // If it's a mock payment, bypass signature verification
    if (!isTesting) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: razorpay_order_id },
          { status: 'failed' }
        );
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    // Create Registration record since payment is verified
    if (!registrationData) {
      return res.status(400).json({ success: false, message: 'Registration data missing' });
    }

    const secureToken = uuidv4();
    const certificateNumber = await Registration.generateCertificateNumber();
    
    const studentTypeModel = req.user.type === 'student_internal' ? 'StudentInternal' : 'StudentExternal';

    let registration;
    try {
      registration = await Registration.create({
        ...registrationData,
        studentId: req.user.id,
        studentType: studentTypeModel,
        paymentStatus: 'completed',
        status: 'approved',
        secureToken,
        qrData: '', // will update below
        certificateNumber
      });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - user already registered!
        // This can happen if they double click or opened multiple tabs.
        // Try to find the existing registration
        registration = await Registration.findOne({
          studentId: req.user.id,
          eventId: registrationData.eventId
        });
        
        if (!registration) {
           return res.status(500).json({ success: false, message: 'Duplicate registration error, but could not find existing record.' });
        }
      } else {
        throw error;
      }
    }

    const { ensureParticipant } = require('../utils/participantHelper');
    const participant = await ensureParticipant(req.user.id, studentTypeModel, registration);
    registration.qrData = JSON.stringify({
      participantId: participant._id.toString(),
      eventId: registrationData.eventId.toString()
    });
    await registration.save();

    // Update Payment record with the newly created registrationId
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'completed',
        paidAt: Date.now(),
        method: 'Razorpay',
        registrationId: registration._id
      },
      { new: true }
    );

    // Increment event registration count
    const eventIdVal = registration.eventId;
    const event = eventIdVal ? await Event.findById(eventIdVal) : null;
    if (event) {
      const increment = registration.teamSize || 1;
      
      const updatedEvent = await Event.findOneAndUpdate(
        { _id: eventIdVal, registeredCount: { $lte: event.seatLimit - increment } },
        { $inc: { registeredCount: increment } },
        { new: true }
      );

      if (updatedEvent) {
        if (updatedEvent.registeredCount >= updatedEvent.seatLimit) {
          await Event.findByIdAndUpdate(eventIdVal, { 
            registrationOpen: false,
            registrationClosedAt: new Date()
          });
        }
      } else {
        // Edge Case: User paid, but seats got full right before payment completed!
        // The registration exists and is paid, but the event is full.
        // We log this or flag it, but we don't delete the registration since money was deducted.
        console.warn(`[Payment] User ${req.user.id} paid for full event ${eventIdVal}. Requires admin attention.`);
      }
    }

    res.json({ 
      success: true, 
      message: 'Payment verified successfully', 
      data: payment,
      registration: {
        certificateNumber: registration.certificateNumber,
        secureToken: registration.secureToken,
        fullName: registration.fullName,
        usn: registration.usn,
        department: registration.department,
        collegeName: registration.collegeName,
        paymentStatus: registration.paymentStatus,
        createdAt: registration.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's payment history
// @route   GET /api/payments/history
// @access  Private (Student)
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ studentId: req.user.id })
      .populate('eventId', 'title date venue')
      .populate('registrationId', 'paymentStatus qrCode')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/payments/all
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('studentId', 'name email')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getAllPayments
};
