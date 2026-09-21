const mongoose = require('mongoose');
const Event = require('./models/Event');

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/college-event-hub');
    console.log('Connected to MongoDB');

    // Make "Open Source Contribution Guide" completed
    const event1 = await Event.findOneAndUpdate(
      { title: 'Open Source Contribution Guide' },
      { date: new Date(Date.now() - 86400000 * 5) },
      { new: true }
    );
    if (event1) {
      console.log('Updated "Open Source Contribution Guide" to be in the past:', event1.date);
    } else {
      console.log('"Open Source Contribution Guide" not found.');
    }

    // Make "Morning Yoga Retreat" completed
    const event2 = await Event.findOneAndUpdate(
      { title: 'Morning Yoga Retreat' },
      { date: new Date(Date.now() - 86400000 * 2) },
      { new: true }
    );
    if (event2) {
      console.log('Updated "Morning Yoga Retreat" to be in the past:', event2.date);
    } else {
      console.log('"Morning Yoga Retreat" not found.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
