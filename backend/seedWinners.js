const mongoose = require('mongoose');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const EventResult = require('./models/EventResult');

mongoose.connect('mongodb://127.0.0.1:27017/eventhub').then(async () => {
  // Create a past event
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  
  const newEvent = await Event.create({
    title: 'National Tech Symposium 2026',
    description: 'A grand tech event that happened in the past.',
    category: 'Tech',
    date: pastDate,
    startTime: '09:00 AM',
    endTime: '04:00 PM',
    venue: 'Main Auditorium',
    internalPrice: 0,
    externalPrice: 0,
    seatLimit: 100,
    registeredCount: 3,
    poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
  });
  
  console.log('Created Past Event:', newEvent.title);

  // Create 3 Registrations for this event
  const reg1 = await Registration.create({
    eventId: newEvent._id,
    fullName: 'Rahul Sharma',
    email: 'rahul@example.com',
    collegeName: 'IIT Madras',
    department: 'CSE',
    usn: 'CS001',
    registrationType: 'individual',
    paymentStatus: 'completed'
  });
  const reg2 = await Registration.create({
    eventId: newEvent._id,
    fullName: 'Priya Patel',
    email: 'priya@example.com',
    collegeName: 'NIT Trichy',
    department: 'IT',
    usn: 'IT045',
    registrationType: 'individual',
    paymentStatus: 'completed'
  });
  const reg3 = await Registration.create({
    eventId: newEvent._id,
    fullName: 'Arun Kumar',
    email: 'arun@example.com',
    collegeName: 'Anna University',
    department: 'ECE',
    usn: 'EC102',
    registrationType: 'individual',
    paymentStatus: 'completed'
  });

  // Assign Winners
  await EventResult.create([
    {eventId: newEvent._id, participantId: reg1._id, position: 1, prizeAmount: 5000, remarks: 'Excellent project'}, 
    {eventId: newEvent._id, participantId: reg2._id, position: 2, prizeAmount: 3000, remarks: 'Great presentation'}, 
    {eventId: newEvent._id, participantId: reg3._id, position: 3, prizeAmount: 1000, remarks: 'Good effort'}
  ]);
  
  console.log('Added 3 winners successfully!');
  process.exit(0);
}).catch(err => console.error(err));
