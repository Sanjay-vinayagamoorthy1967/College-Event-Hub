const express = require('express');
const router = express.Router();
const StudentInternal = require('../models/StudentInternal');

// POST /api/internal/check-registration
// Checks ONLY whether the SIN Number already exists in registered users.
// Does NOT validate against any master student catalog.
router.post('/check-registration', async (req, res) => {
  try {
    const { sinNumber } = req.body;
    if (!sinNumber) {
      return res.status(400).json({ success: false, message: 'sinNumber is required' });
    }

    const sinNo = sinNumber.trim().toUpperCase();
    const email = sinNo.toLowerCase() + '@shanmugha.edu.in';

    // Check ONLY the registered users table
    const alreadyRegistered = await StudentInternal.findOne({
      $or: [
        { registerNumber: sinNo },
        { email: email }
      ]
    });

    if (alreadyRegistered) {
      return res.json({ registered: true });
    }

    // SIN not found in registered users → eligible to register
    return res.json({ registered: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
