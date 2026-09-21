const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-event-hub';

const sampleWinners = [
  {
    firstPrize: { winnerName: 'Rahul Kumar', collegeName: 'PSG College of Technology', department: 'CSE', year: '4', prizeType: 'Cash + Medal + Certificate', cashAmount: 10000, photoUrl: '' },
    secondPrize: { winnerName: 'Nivetha R', collegeName: 'Kumaraguru College of Technology', department: 'IT', year: '3', prizeType: 'Cash + Medal + Certificate', cashAmount: 5000, photoUrl: '' },
    thirdPrize: { winnerName: 'Harish M', collegeName: 'Sri Ramakrishna Engineering College', department: 'ECE', year: '2', prizeType: 'Cash + Certificate', cashAmount: 2500, photoUrl: '' }
  },
  {
    firstPrize: { winnerName: 'Akash Prabhu', collegeName: 'Kongu Engineering College', department: 'AI & DS', year: '4', prizeType: 'Cash + Medal + Certificate', cashAmount: 15000, photoUrl: '' },
    secondPrize: { winnerName: 'Keerthana S', collegeName: 'Coimbatore Institute of Technology', department: 'CSE', year: '3', prizeType: 'Cash + Medal + Certificate', cashAmount: 7500, photoUrl: '' },
    thirdPrize: { winnerName: 'Praveen Kumar', collegeName: 'Government College of Technology', department: 'EEE', year: '4', prizeType: 'Cash + Certificate', cashAmount: 3000, photoUrl: '' }
  },
  {
    firstPrize: { winnerName: 'Dharani K', collegeName: 'Velammal Engineering College', department: 'Cyber Security', year: '3', prizeType: 'Cash + Medal', cashAmount: 8000, photoUrl: '' },
    secondPrize: { winnerName: 'Vignesh R', collegeName: 'Bannari Amman Institute of Technology', department: 'Mechanical', year: '4', prizeType: 'Cash + Medal', cashAmount: 4000, photoUrl: '' },
    thirdPrize: { winnerName: 'Swetha P', collegeName: 'KPR Institute of Engineering and Technology', department: 'CSE', year: '2', prizeType: 'Cash + Certificate', cashAmount: 2000, photoUrl: '' }
  },
  {
    firstPrize: { winnerName: 'Siddharth V', collegeName: 'SRM Institute of Science and Technology', department: 'Software Engineering', year: '4', prizeType: 'Cash + Medal + Certificate', cashAmount: 12000, photoUrl: '' },
    secondPrize: { winnerName: 'Anjali D', collegeName: 'VIT Vellore', department: 'CSE', year: '3', prizeType: 'Cash + Medal + Certificate', cashAmount: 6000, photoUrl: '' },
    thirdPrize: { winnerName: 'Manoj C', collegeName: 'SSN College of Engineering', department: 'IT', year: '4', prizeType: 'Cash + Certificate', cashAmount: 3000, photoUrl: '' }
  },
  {
    firstPrize: { winnerName: 'Gowtham N', collegeName: 'Thiagarajar College of Engineering', department: 'Mechatronics', year: '4', prizeType: 'Trophy + Certificate', cashAmount: 0, photoUrl: '' },
    secondPrize: { winnerName: 'Sneha K', collegeName: 'SASTRA Deemed University', department: 'Bioinformatics', year: '3', prizeType: 'Medal + Certificate', cashAmount: 0, photoUrl: '' },
    thirdPrize: { winnerName: 'Prasanth L', collegeName: 'Rajalakshmi Engineering College', department: 'ECE', year: '2', prizeType: 'Certificate', cashAmount: 0, photoUrl: '' }
  }
];

const generateResults = async () => {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(dbUrl);
    console.log('MongoDB Connected.');

    const pastEvents = await Event.find({ date: { $lt: new Date() }, isActive: true });
    console.log(`Found ${pastEvents.length} completed events to populate.`);

    let index = 0;
    for (const event of pastEvents) {
      const winnerData = sampleWinners[index % sampleWinners.length];
      
      await Event.findByIdAndUpdate(event._id, {
        firstPrize: winnerData.firstPrize,
        secondPrize: winnerData.secondPrize,
        thirdPrize: winnerData.thirdPrize
      });
      console.log(`Populated results for event: ${event.title}`);
      index++;
    }

    console.log('Successfully generated results for all completed events.');
    process.exit(0);
  } catch (error) {
    console.error('Error generating results:', error);
    process.exit(1);
  }
};

generateResults();
