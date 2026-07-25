const Participant = require('../models/Participant');

const ensureParticipant = async (studentId, studentType, studentData = {}) => {
  try {
    let query = { studentId, studentType };
    let participantType = studentType === 'StudentInternal' ? 'INTERNAL' : 'EXTERNAL';
    let SIN_NO = studentData.registerNumber || studentData.usn || undefined;
    let name = studentData.name || studentData.fullName;
    let college = studentType === 'StudentInternal' ? 'SSCET' : (studentData.collegeName || studentData.college || 'External College');

    // If details are missing, fetch the student document
    if (studentType === 'StudentInternal' && (!SIN_NO || !name)) {
      const StudentInternal = require('../models/StudentInternal');
      const student = await StudentInternal.findById(studentId);
      if (student) {
        SIN_NO = student.registerNumber;
        name = name || student.name;
      }
    } else if (studentType === 'StudentExternal' && (!name || !college)) {
      const StudentExternal = require('../models/StudentExternal');
      const student = await StudentExternal.findById(studentId);
      if (student) {
        name = name || student.name;
        college = college || student.collegeName;
      }
    }

    const update = {
      participantType,
      name: name || 'Unknown Student',
      college: college || 'Unknown College',
      studentId,
      studentType
    };

    if (SIN_NO) {
      update.SIN_NO = SIN_NO;
    }

    const participant = await Participant.findOneAndUpdate(
      query,
      update,
      { upsert: true, new: true }
    );
    return participant;
  } catch (err) {
    console.error('Error in ensureParticipant:', err.message);
    throw err;
  }
};

module.exports = {
  ensureParticipant
};
