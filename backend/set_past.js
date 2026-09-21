const mongoose = require('mongoose');
const Event = require('./models/Event');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/college-event-hub');
  console.log('Connected');

  const titles = ['Career Paths in Data Science', 'Cloud Computing Expo'];
  for (const title of titles) {
    const e = await Event.findOne({ title });
    if (e) {
      e.date = new Date(Date.now() - 86400000 * 3);
      await e.save();
      console.log('Updated to past:', title);
    } else {
      console.log('Not found:', title);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(console.error);
