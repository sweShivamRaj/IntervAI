require('dotenv').config();
const { connectDB } = require('../config/db');
const User = require('../models/User');
const config = require('../config/env');

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: config.admin.email });
  if (existing) {
    console.log('Admin already exists:', config.admin.email);
  } else {
    await User.create({
      name: 'Platform Admin',
      email: config.admin.email,
      password: config.admin.password,
      role: 'admin',
    });
    console.log('Admin created:', config.admin.email);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
