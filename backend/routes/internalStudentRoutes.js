const express = require('express');
const router = express.Router();
const CollegeStudent = require('../models/CollegeStudent');
const StudentInternal = require('../models/StudentInternal');

// GET /api/internal-students/sin/:sinNo
router.get('/sin/:sinNo', async (req, res) => {
  try {
    const sinNo = req.params.sinNo.trim().toUpperCase();

    // Check if the student is already registered in StudentInternal
    const email = sinNo.toLowerCase() + '@shanmugha.edu.in';
    const registeredExists = await StudentInternal.findOne({
      $or: [
        { registerNumber: sinNo },
        { email: email }
      ]
    });
    if (registeredExists) {
      return res.status(400).json({ success: false, message: 'Account already exists.' });
    }

    // Find the eligible student in the master database
    const collegeStudent = await CollegeStudent.findOne({ studentId: sinNo });
    if (!collegeStudent) {
      return res.status(404).json({ success: false, message: 'Student record not found. Please contact the administrator.' });
    }

    if (collegeStudent.isDisabled) {
      return res.status(400).json({ success: false, message: 'This student ID has been disabled.' });
    }

    res.json({
      sinNo: collegeStudent.studentId,
      fullName: collegeStudent.name,
      gender: collegeStudent.gender || 'Male',
      year: collegeStudent.year || 'III Year',
      department: collegeStudent.department || 'Computer Science and Engineering',
      academicYear: collegeStudent.batch || '2023-2027',
      collegeName: collegeStudent.collegeName || 'Sri Shanmugha Educational Institution',
      email: collegeStudent.studentId.toLowerCase() + '@shanmugha.edu.in'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
