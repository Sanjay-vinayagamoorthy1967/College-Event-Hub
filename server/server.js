require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const deletionRoutes = require('./routes/deletionRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploaded templates
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/deletion-requests', deletionRoutes);
app.use('/api/internal-students', require('./routes/internalStudentRoutes'));
app.use('/api/internal', require('./routes/internalRoutes'));

app.get('/', (req, res) => {
  res.send('College Event Hub API is running...');
});

const PORT = process.env.PORT || 5000;

const { updateEventStatuses } = require('./utils/eventStatusHelper');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Run background job every 1 minute to auto-update event statuses
  setInterval(updateEventStatuses, 60000);
  // Also run once immediately on startup
  updateEventStatuses();
});
