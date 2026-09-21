const mongoose = require('mongoose');
const CollegeStudent = require('./models/CollegeStudent');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_hub';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    // Clear existing
    await CollegeStudent.deleteMany({});
    console.log('Cleared CollegeStudents.');

    // Insert test records
    const testRecords = [
      {
        studentId: '211041001',
        name: 'Sanjay V',
        collegeName: 'Sri Shanmugha Educational Institutions',
        department: 'CSE',
        batch: '3rd',
        qrVerificationCode: 'shanmugha_token_sanjay_2026',
        isDisabled: false,
        isRegistered: false
      },
      {
        studentId: '211041002',
        name: 'Alice Smith',
        collegeName: 'Sri Shanmugha Educational Institutions',
        department: 'ECE',
        batch: '4th',
        qrVerificationCode: 'shanmugha_token_alice_2026',
        isDisabled: false,
        isRegistered: false
      },
      {
        studentId: '211041003',
        name: 'Disabled User',
        collegeName: 'Sri Shanmugha Educational Institutions',
        department: 'MECH',
        batch: '2nd',
        qrVerificationCode: 'shanmugha_token_disabled_2026',
        isDisabled: true,
        isRegistered: false
      },
      {
        studentId: '211041004',
        name: 'Other College Record',
        collegeName: 'Other Educational Institutions',
        department: 'IT',
        batch: '1st',
        qrVerificationCode: 'other_token_2026',
        isDisabled: false,
        isRegistered: false
      }
    ];

    await CollegeStudent.insertMany(testRecords);
    console.log('Successfully seeded CollegeStudent verification database.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
