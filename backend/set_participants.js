const mongoose = require('mongoose');
const Event = require('./models/Event');

mongoose.connect('mongodb://127.0.0.1:27017/college-event-hub').then(async () => {
  const events = await Event.find({ date: { $lt: new Date() } });
  console.log(`Found ${events.length} completed events`);
  
  for (let event of events) {
    // Generate a random number of participants between 30 and the seat limit (or 150 if no limit)
    const maxSeats = event.seatLimit > 0 ? event.seatLimit : 150;
    const minSeats = Math.floor(maxSeats * 0.4); // At least 40% full
    const randomCount = Math.floor(Math.random() * (maxSeats - minSeats + 1)) + minSeats;
    
    await Event.findByIdAndUpdate(event._id, {
        registeredCount: randomCount,
        seatLimit: event.seatLimit < randomCount ? randomCount + Math.floor(Math.random() * 20) + 5 : event.seatLimit
    });
    console.log(`Updated ${event.title}: ${event.registeredCount} / ${event.seatLimit} seats`);
  }
  
  process.exit(0);
});
