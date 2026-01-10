import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';
import User from '../server/models/User.js';

// Load environment variables
dotenv.config();

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yur-finance';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get user input
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 chars): ');
    const name = await question('Enter admin name (optional): ');

    if (!email || !password) {
      console.error('❌ Email and password are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️  User already exists. Updating to admin...');
      existingUser.role = 'admin';
      if (name) {
        existingUser.profile = existingUser.profile || {};
        existingUser.profile.name = name;
      }
      await existingUser.save();
      console.log('✅ User updated to admin successfully!');
    } else {
      // Create new admin user
      const user = new User({
        email: email.toLowerCase(),
        password, // Will be hashed by pre-save hook
        role: 'admin',
        profile: {
          name: name || '',
        },
        isActive: true,
      });

      await user.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📝 Admin Details:');
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Role: admin`);
    console.log(`   Name: ${name || 'Not set'}`);
    console.log('\n✅ You can now log in with this account!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
