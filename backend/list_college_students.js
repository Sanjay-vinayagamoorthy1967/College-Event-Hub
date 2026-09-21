const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CollegeStudent = require('./models/CollegeStudent');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/event_db';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);

  try {
    const students = await CollegeStudent.find({});
    console.log(`Total students in CollegeStudent catalog: ${students.length}`);
    if (students.length > 0) {
      console.log('List of first 10 students:');
      students.slice(0, 10).forEach(s => {
        console.log(`- ID: ${s.studentId}, Name: ${s.name}, College: ${s.collegeName}, Department: ${s.department}, Batch: ${s.batch}`);
      });
    } else {
      console.log('No college students found in database. The catalog is empty.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
