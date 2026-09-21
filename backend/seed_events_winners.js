const mongoose = require('mongoose');
const Event = require('./models/Event');
const StudentInternal = require('./models/StudentInternal');
const Registration = require('./models/Registration');
const EventResult = require('./models/EventResult');
const Admin = require('./models/Admin');

mongoose.connect('mongodb://127.0.0.1:27017/college-event-hub').then(async () => {
  const db = mongoose.connection.db;
  const admin = await Admin.findOne();
  
  // Create 3 mock events in the past
  const events = await Event.insertMany([
    {
      title: 'Code Sprint 2026',
      description: 'Annual competitive programming contest.',
      category: 'Hackathon',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      startTime: '09:00',
      endTime: '17:00',
      venue: 'Lab 1',
      seatLimit: 100,
      isActive: true,
      time: '09:00 AM'
    },
    {
      title: 'Tech Symposium',
      description: 'Paper presentations and tech talks.',
      category: 'Tech',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      startTime: '10:00',
      endTime: '15:00',
      venue: 'Main Auditorium',
      seatLimit: 200,
      isActive: true,
      time: '10:00 AM'
    },
    {
      title: 'Web Dev Workshop',
      description: 'Hands-on session on React.',
      category: 'Workshop',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      startTime: '14:00',
      endTime: '16:00',
      venue: 'Lab 2',
      seatLimit: 50,
      isActive: true,
      time: '02:00 PM'
    }
  ]);

  // Create 3 mock students
  const students = await StudentInternal.insertMany([
    { name: 'Alice Smith', registerNumber: 'REG001', department: 'CSE', year: '3', phone: '1234567890', email: 'alice@gmail.com', gender: 'Female', password: 'password', verified: true },
    { name: 'Bob Jones', registerNumber: 'REG002', department: 'ECE', year: '2', phone: '1234567891', email: 'bob@gmail.com', gender: 'Male', password: 'password', verified: true },
    { name: 'Charlie Brown', registerNumber: 'REG003', department: 'MECH', year: '4', phone: '1234567892', email: 'charlie@gmail.com', gender: 'Male', password: 'password', verified: true }
  ]);

  // Register them to events
  const registrations = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = 0; j < students.length; j++) {
      const reg = await Registration.create({
        studentId: students[j]._id,
        studentType: 'StudentInternal',
        eventId: events[i]._id,
        fullName: students[j].name,
        usn: students[j].registerNumber,
        collegeName: 'Our College',
        department: students[j].department,
        yearSemester: students[j].year,
        email: students[j].email,
        phone: students[j].phone,
        status: 'approved',
        paymentStatus: 'completed'
      });
      registrations.push(reg);
    }
  }

  // Create winners
  for (let i = 0; i < events.length; i++) {
    const eventRegs = registrations.filter(r => r.eventId.equals(events[i]._id));
    await EventResult.create({
      eventId: events[i]._id,
      participantId: eventRegs[0]._id,
      position: 1,
      prizeAmount: 5000,
      createdBy: admin ? admin._id : new mongoose.Types.ObjectId()
    });
    await EventResult.create({
      eventId: events[i]._id,
      participantId: eventRegs[1]._id,
      position: 2,
      prizeAmount: 3000,
      createdBy: admin ? admin._id : new mongoose.Types.ObjectId()
    });
  }

  console.log('Successfully seeded events and winners!');
  process.exit(0);
});
