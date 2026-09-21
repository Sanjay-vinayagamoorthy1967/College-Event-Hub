require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventhub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    const email = 'superadmin@eventhub.com'; // Change this
    const password = 'SuperAdmin123!'; // Change this

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      console.log('Super Admin already exists');
      process.exit();
    }

    // Admin model has a pre-save hook for password hashing, 
    // so we can just pass the plain password
    await Admin.create({
      name: 'System Super Admin',
      email: email,
      password: password,
      role: 'super_admin',
      verified: true, // Auto-verify the first super admin
      status: 'active'
    });

    console.log('Super Admin created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit();
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
