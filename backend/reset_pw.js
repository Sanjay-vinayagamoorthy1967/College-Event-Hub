const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/college-event-hub').then(async () => {
  const hashedPassword = await bcrypt.hash('Sanjay', 10);
  await mongoose.connection.db.collection('admins').updateOne(
    { email: 'e23cs021@shanmugha.edu.in' },
    { $set: { password: hashedPassword } }
  );
  console.log('Password reset successfully.');
  process.exit(0);
});
