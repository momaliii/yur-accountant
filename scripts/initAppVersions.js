import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppVersion from '../server/models/AppVersion.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yur-finance';

async function initAppVersions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if versions already exist
    const existingVersions = await AppVersion.countDocuments();
    if (existingVersions > 0) {
      console.log(`Found ${existingVersions} existing app versions. Skipping initialization.`);
      console.log('To add new versions, use the Admin Dashboard → App Updates tab.');
      await mongoose.disconnect();
      return;
    }

    // Default app versions
    const defaultVersions = [
      {
        version: '1.0.0',
        platform: 'ios',
        buildNumber: '1',
        releaseNotes: 'Initial release of YUR Finance mobile app for iOS',
        downloadUrl: '',
        manifestUrl: '',
        isRequired: false,
        isActive: true,
        minSupportedVersion: null,
        updateSize: 0,
        releaseDate: new Date(),
      },
      {
        version: '1.0.0',
        platform: 'android',
        buildNumber: '1',
        releaseNotes: 'Initial release of YUR Finance mobile app for Android',
        downloadUrl: '',
        manifestUrl: '',
        isRequired: false,
        isActive: true,
        minSupportedVersion: null,
        updateSize: 0,
        releaseDate: new Date(),
      },
      {
        version: '1.0.0',
        platform: 'web',
        buildNumber: '1',
        releaseNotes: 'Initial release of YUR Finance web application',
        downloadUrl: '',
        manifestUrl: '',
        isRequired: false,
        isActive: true,
        minSupportedVersion: null,
        updateSize: 0,
        releaseDate: new Date(),
      },
    ];

    // Insert default versions
    const createdVersions = await AppVersion.insertMany(defaultVersions);
    console.log(`✅ Created ${createdVersions.length} default app versions:`);
    createdVersions.forEach(v => {
      console.log(`   - ${v.platform.toUpperCase()} v${v.version} (Build ${v.buildNumber})`);
    });

    console.log('\n📱 To update versions:');
    console.log('   1. Go to Admin Dashboard → App Updates');
    console.log('   2. Click "Create Version" or edit existing versions');
    console.log('   3. Fill in the version details');
    console.log('   4. Set "Required Update" for critical updates');
    console.log('   5. Set "Active" to make it available to users');

    await mongoose.disconnect();
    console.log('\n✅ App versions initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing app versions:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
initAppVersions();
