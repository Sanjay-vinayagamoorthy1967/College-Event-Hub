const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-event-hub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await syncParticipants();
  } catch (error) {
    console.warn(`Local MongoDB Connection Error: ${error.message}`);
    console.log('Attempting to start an in-memory MongoDB server for testing...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
      console.log('NOTE: All data saved in this session will be lost when the server restarts.');

      // Seed test data
      const Admin = require('../models/Admin');
      const StudentInternal = require('../models/StudentInternal');
      const Event = require('../models/Event');

      const superAdminExists = await Admin.findOne({ email: 'e23cs021@shanmugha.edu.in' });
      if (!superAdminExists) {
        await Admin.create({
          name: 'Super Admin',
          email: 'e23cs021@shanmugha.edu.in',
          password: 'password123',
          role: 'super_admin',
          verified: true,
          approvalStatus: 'approved',
          isActive: true
        });
        console.log('Super Admin created: e23cs021@shanmugha.edu.in / password123');
      }

      const adminExists = await Admin.findOne({ email: 'admin@college.edu' });
      if (!adminExists) {
        await Admin.create({
          name: 'Admin',
          email: 'admin@college.edu',
          password: 'password123',
          role: 'admin',
          verified: true,
          approvalStatus: 'approved',
          isActive: true
        });
        console.log('Test Admin created: admin@college.edu / password123');
      }

      const studentExists = await StudentInternal.findOne({ email: 'student@college.edu' });
      if (!studentExists) {
        await StudentInternal.create({
          name: 'Test Student',
          registerNumber: '1RV20CS001',
          department: 'Computer Science',
          year: 3,
          phone: '9876543210',
          email: 'student@college.edu',
          gender: 'Male',
          password: 'password123',
          type: 'student_internal',
          verified: true
        });
        console.log('Test Student created: student@college.edu / password123');
      }

      // 1. ADD SANJAY
      const sanjayExists = await StudentInternal.findOne({ email: 'sanjay@shanmugha.edu.in' });
      if (!sanjayExists) {
        await StudentInternal.create({
          name: 'Sanjay',
          registerNumber: '19CSE123',
          department: 'CSE AIDS',
          year: 3,
          phone: '9000000000',
          email: 'sanjay@shanmugha.edu.in',
          gender: 'Male',
          password: 'password123',
          type: 'student_internal',
          verified: true
        });
        console.log('Test Student created: sanjay@shanmugha.edu.in');
      }

      const e23cs021Exists = await StudentInternal.findOne({ email: 'e23cs021@shanmugha.edu.in' });
      if (!e23cs021Exists) {
        await StudentInternal.create({
          name: 'Sanjay (Student)',
          registerNumber: 'E23CS021',
          department: 'CSE',
          year: 3,
          phone: '9000000000',
          email: 'e23cs021@shanmugha.edu.in',
          gender: 'Male',
          password: 'password123',
          type: 'student_internal',
          verified: true
        });
        console.log('Test Student created: e23cs021@shanmugha.edu.in / password123');
      }

      // Seed CollegeStudent master records
      const CollegeStudent = require('../models/CollegeStudent');
      const testStudents = [
        { studentId: 'E23CS048', name: 'Gokulnath K', gender: 'Male', year: 'III Year', collegeName: 'Sri Shanmugha Educational Institution', department: 'Computer Science and Engineering', batch: '2023-2027', qrVerificationCode: 'QR_E23CS048' },
        { studentId: 'SIN230145', name: 'Gokulnath K', gender: 'Male', year: 'III Year', collegeName: 'Sri Shanmugha Educational Institution', department: 'Computer Science and Engineering', batch: '2023-2027', qrVerificationCode: 'QR_SIN230145' },
        { studentId: 'SIN230146', name: 'Vinay K', gender: 'Male', year: 'III Year', collegeName: 'Sri Shanmugha Educational Institution', department: 'Computer Science and Engineering', batch: '2023-2027', qrVerificationCode: 'QR_SIN230146' },
        { studentId: 'SIN230147', name: 'Sanjay', gender: 'Male', year: 'III Year', collegeName: 'Sri Shanmugha Educational Institution', department: 'Computer Science and Engineering', batch: '2023-2027', qrVerificationCode: 'QR_SIN230147' },
        { studentId: 'E23CS021', name: 'Sanjay (Student)', gender: 'Male', year: 'III Year', collegeName: 'Sri Shanmugha Educational Institution', department: 'Computer Science and Engineering', batch: '2023-2027', qrVerificationCode: 'QR_E23CS021' },
        { studentId: '19CSE123', name: 'Sanjay', gender: 'Male', year: 'IV Year', collegeName: 'Sri Shanmugha Educational Institution', department: 'Computer Science and Engineering', batch: '2019-2023', qrVerificationCode: 'QR_19CSE123' }
      ];

      for (const ts of testStudents) {
        const studentExists = await CollegeStudent.findOne({ studentId: ts.studentId });
        if (!studentExists) {
          await CollegeStudent.create(ts);
          console.log(`Pre-seeded eligible CollegeStudent: ${ts.studentId}`);
        }
      }
      
      const Registration = require('../models/Registration');
      const Payment = require('../models/Payment');

      let hackathonEvent = await Event.findOne({ title: 'Mock Hackathon 2026' });
      if (!hackathonEvent) {
        hackathonEvent = await Event.create({
          title: 'Mock Hackathon 2026',
          description: 'A test event created automatically for the in-memory database.',
          date: new Date(Date.now() + 86400000 * 5), // 5 days from now
          time: '09:00 AM',
          startTime: '09:00 AM',
          endTime: '05:00 PM',
          venue: 'Main Auditorium',
          category: 'Hackathon',
          internalPrice: 150,
          externalPrice: 200,
          seatLimit: 100,
          registeredCount: 1,
          isActive: true,
          isFeatured: true,
          poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
          certificateTemplateType: 'custom',
          certificateTemplatePath: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=1200&auto=format&fit=crop&q=80',
          certificateEditorLayout: {
            placeholders: [
              { id: 'participant_name', name: '{{participant_name}}', x: 300, y: 340, w: 523, h: 50, fontSize: 32, bold: true, font: 'Times New Roman', color: '#000000', align: 'center' },
              { id: 'college_name', name: '{{college_name}}', x: 200, y: 410, w: 723, h: 40, fontSize: 18, font: 'Times New Roman', color: '#000000', align: 'center' },
              { id: 'event_name', name: '{{event_name}}', x: 250, y: 480, w: 623, h: 45, fontSize: 24, bold: true, font: 'Times New Roman', color: '#000000', align: 'center' },
              { id: 'qr_code', name: '{{qr_code}}', x: 930, y: 70, w: 120, h: 120, fontSize: 12, font: 'Times New Roman', color: '#000000', align: 'center' }
            ]
          }
        });
        console.log('Test Event created: Mock Hackathon 2026');
      }

      let workshopEvent = await Event.findOne({ title: 'AI & Machine Learning Workshop' });
      if (!workshopEvent) {
        workshopEvent = await Event.create({
          title: 'AI & Machine Learning Workshop',
          description: 'Hands-on workshop on building deep learning models.',
          date: new Date(Date.now() + 86400000 * 10), // 10 days from now
          time: '10:00 AM',
          startTime: '10:00 AM',
          endTime: '04:00 PM',
          venue: 'CS Lab 1',
          category: 'Workshop',
          internalPrice: 50,
          externalPrice: 100,
          seatLimit: 50,
          registeredCount: 0,
          isActive: true,
          poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
          certificateTemplateType: 'custom',
          certificateTemplatePath: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=1200&auto=format&fit=crop&q=80',
          certificateEditorLayout: {
            placeholders: [
              { id: 'participant_name', name: '{{participant_name}}', x: 300, y: 340, w: 523, h: 50, fontSize: 32, bold: true, font: 'Times New Roman', color: '#000000', align: 'center' },
              { id: 'college_name', name: '{{college_name}}', x: 200, y: 410, w: 723, h: 40, fontSize: 18, font: 'Times New Roman', color: '#000000', align: 'center' },
              { id: 'event_name', name: '{{event_name}}', x: 250, y: 480, w: 623, h: 45, fontSize: 24, bold: true, font: 'Times New Roman', color: '#000000', align: 'center' },
              { id: 'qr_code', name: '{{qr_code}}', x: 930, y: 70, w: 120, h: 120, fontSize: 12, font: 'Times New Roman', color: '#000000', align: 'center' }
            ]
          }
        });
        console.log('Test Event created: AI Workshop');
      }

      // Add 10 additional events (5 paid, 5 free)
      const additionalEvents = [
        // Free Events
        { title: 'Open Source Contribution Guide', description: 'Learn how to contribute to major open source projects.', category: 'Seminar', venue: 'Virtual', internalPrice: 0, externalPrice: 0, seatLimit: 500, time: '11:00 AM', startTime: '11:00 AM', endTime: '01:00 PM', days: 2, poster: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80' },
        { title: 'Campus Photography Walk', description: 'Explore the campus through your lens.', category: 'Cultural', venue: 'Main Gate', internalPrice: 0, externalPrice: 0, seatLimit: 30, time: '04:00 PM', startTime: '04:00 PM', endTime: '06:00 PM', days: 3, poster: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80' },
        { title: 'Resume Building Session', description: 'Get your resume reviewed by industry experts.', category: 'Non-Tech', venue: 'Placement Cell', internalPrice: 0, externalPrice: 0, seatLimit: 100, time: '02:00 PM', startTime: '02:00 PM', endTime: '04:00 PM', days: 7, poster: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&auto=format&fit=crop&q=80' },
        { title: 'Intra-College Debate', description: 'Debate on the latest technological ethics.', category: 'Cultural', venue: 'Seminar Hall 2', internalPrice: 0, externalPrice: 0, seatLimit: 50, time: '10:00 AM', startTime: '10:00 AM', endTime: '01:00 PM', days: 14, poster: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80' },
        { title: 'Morning Yoga Retreat', description: 'Relax your mind before exams.', category: 'Sports', venue: 'College Ground', internalPrice: 0, externalPrice: 0, seatLimit: 100, time: '06:00 AM', startTime: '06:00 AM', endTime: '07:30 AM', days: 1, poster: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=80' },
        // Paid Events
        { title: 'Robotics Workshop Pro', description: 'Build your first line-following robot.', category: 'Workshop', venue: 'Mech Lab', internalPrice: 300, externalPrice: 500, seatLimit: 40, time: '09:00 AM', startTime: '09:00 AM', endTime: '04:00 PM', days: 6, poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80' },
        { title: 'National CodeFest 2026', description: 'Compete with coders nationwide for a grand prize.', category: 'Hackathon', venue: 'Auditorium 2', internalPrice: 200, externalPrice: 400, seatLimit: 200, time: '08:00 AM', startTime: '08:00 AM', endTime: '05:00 PM', days: 15, poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80' },
        { title: 'Cybersecurity Bootcamp', description: 'Intensive 2-day bootcamp on ethical hacking.', category: 'Tech', venue: 'CS Lab 3', internalPrice: 500, externalPrice: 800, seatLimit: 30, time: '10:00 AM', startTime: '10:00 AM', endTime: '05:00 PM', days: 20, poster: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80' },
        { title: 'E-Sports Tournament (Valorant)', description: '5v5 Valorant tournament. Bring your own peripherals.', category: 'Sports', venue: 'IT Lab', internalPrice: 100, externalPrice: 250, seatLimit: 60, time: '11:00 AM', startTime: '11:00 AM', endTime: '04:00 PM', days: 8, poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80' },
        { title: 'Annual Gala Night', description: 'The biggest cultural night of the year with DJ and dinner.', category: 'Cultural', venue: 'Open Air Theater', internalPrice: 400, externalPrice: 600, seatLimit: 1000, time: '06:00 PM', startTime: '06:00 PM', endTime: '10:00 PM', days: 25, poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80' }
      ];

      for (const ev of additionalEvents) {
        const exists = await Event.findOne({ title: ev.title });
        if (!exists) {
          await Event.create({
            title: ev.title,
            description: ev.description,
            date: new Date(Date.now() + 86400000 * ev.days),
            time: ev.time,
            startTime: ev.startTime,
            endTime: ev.endTime,
            venue: ev.venue,
            category: ev.category,
            internalPrice: ev.internalPrice,
            externalPrice: ev.externalPrice,
            seatLimit: ev.seatLimit,
            poster: ev.poster,
            isActive: true,
            certificateTemplateType: 'custom',
            certificateTemplatePath: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=1200&auto=format&fit=crop&q=80',
            certificateEditorLayout: {
              placeholders: [
                { id: 'participant_name', name: '{{participant_name}}', x: 300, y: 340, w: 523, h: 50, fontSize: 32, bold: true, font: 'Times New Roman', color: '#000000', align: 'center' },
                { id: 'college_name', name: '{{college_name}}', x: 200, y: 410, w: 723, h: 40, fontSize: 18, font: 'Times New Roman', color: '#000000', align: 'center' },
                { id: 'event_name', name: '{{event_name}}', x: 250, y: 480, w: 623, h: 45, fontSize: 24, bold: true, font: 'Times New Roman', color: '#000000', align: 'center' },
                { id: 'qr_code', name: '{{qr_code}}', x: 930, y: 70, w: 120, h: 120, fontSize: 12, font: 'Times New Roman', color: '#000000', align: 'center' }
              ]
            }
          });
        }
      }
      console.log('10 additional events seeded successfully.');

      // Create a mock registration for the student
      const student = await StudentInternal.findOne({ email: 'student@college.edu' });
      if (student && hackathonEvent) {
        const existingReg = await Registration.findOne({ studentId: student._id, eventId: hackathonEvent._id });
        if (!existingReg) {
          const reg = await Registration.create({
            eventId: hackathonEvent._id,
            studentId: student._id,
            studentType: 'StudentInternal',
            fullName: student.name,
            usn: student.registerNumber,
            collegeName: 'Our College',
            department: student.department,
            yearSemester: student.year,
            email: student.email,
            phone: student.phone,
            status: 'approved',
            paymentStatus: 'completed',
            attendanceStatus: 'absent'
          });

          await Payment.create({
            registrationId: reg._id,
            studentId: student._id,
            studentType: 'StudentInternal',
            eventId: hackathonEvent._id,
            amount: 150,
            razorpayOrderId: 'order_test_12345',
            razorpayPaymentId: 'pay_test_12345',
            status: 'completed'
          });
          console.log('Test Registration and Payment created for student!');
        }
      }

      // 2. REGISTER SANJAY FOR OPEN SOURCE CONTRIBUTION GUIDE
      const sanjay = await StudentInternal.findOne({ email: 'sanjay@shanmugha.edu.in' });
      const openSourceEvent = await Event.findOne({ title: 'Open Source Contribution Guide' });
      
      if (sanjay && openSourceEvent) {
        const existingSanjayReg = await Registration.findOne({ studentId: sanjay._id, eventId: openSourceEvent._id });
        if (!existingSanjayReg) {
          const regSanjay = await Registration.create({
            eventId: openSourceEvent._id,
            studentId: sanjay._id,
            studentType: 'StudentInternal',
            fullName: sanjay.name,
            usn: sanjay.registerNumber,
            collegeName: 'Shanmugha College',
            department: sanjay.department,
            yearSemester: sanjay.year,
            email: sanjay.email,
            phone: sanjay.phone,
            status: 'approved',
            paymentStatus: 'not_required', // free event
            attendanceStatus: 'present',
            certificateStatus: 'released',
            certificateNumber: 'CEH-2026-TEST'
          });
          
          const Certificate = require('../models/Certificate');
          await Certificate.create({
            studentId: sanjay._id,
            studentType: 'StudentInternal',
            eventId: openSourceEvent._id,
            registrationId: regSanjay._id,
            certificateNumber: 'CEH-2026-TEST',
            verificationCode: 'test-verify-123',
            status: 'approved',
            approvedAt: Date.now()
          });

          console.log('Test Registration and Certificate created for Sanjay -> Open Source Contribution Guide!');
        }
      }

      await syncParticipants();
    } catch (memError) {
      console.error(`Failed to start in-memory database: ${memError.message}`);
      process.exit(1);
    }
  }
};

const syncParticipants = async () => {
  try {
    const StudentInternal = require('../models/StudentInternal');
    const StudentExternal = require('../models/StudentExternal');
    const { ensureParticipant } = require('../utils/participantHelper');

    const internals = await StudentInternal.find({});
    for (const student of internals) {
      await ensureParticipant(student._id, 'StudentInternal', student);
    }

    const externals = await StudentExternal.find({});
    for (const student of externals) {
      await ensureParticipant(student._id, 'StudentExternal', student);
    }
    console.log('Participants synchronized successfully.');
  } catch (err) {
    console.error('Error synchronizing participants:', err.message);
  }
};

module.exports = connectDB;
