import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import AppVersion from '../server/models/AppVersion.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yur-finance';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAppVersion() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('Select platform:');
    console.log('1. iOS');
    console.log('2. Android');
    console.log('3. Web');
    const platformChoice = await question('Enter choice (1-3): ');
    const platforms = { '1': 'ios', '2': 'android', '3': 'web' };
    const platform = platforms[platformChoice] || 'web';

    const version = await question('Enter version number (e.g., 1.0.0): ');
    if (!version) {
      console.log('❌ Version is required');
      await mongoose.disconnect();
      process.exit(1);
    }

    const buildNumber = await question('Enter build number (e.g., 1, 2, 101): ');
    if (!buildNumber) {
      console.log('❌ Build number is required');
      await mongoose.disconnect();
      process.exit(1);
    }

    const releaseNotes = await question('Enter release notes (optional): ');
    const downloadUrl = await question('Enter download URL for native apps (optional): ');
    const manifestUrl = await question('Enter manifest URL for Live Updates (optional): ');
    const minSupportedVersion = await question('Enter minimum supported version (optional): ');
    const updateSizeStr = await question('Enter update size in bytes (optional, default 0): ');
    const updateSize = updateSizeStr ? parseInt(updateSizeStr) : 0;
    const isRequiredStr = await question('Is this a required update? (y/n, default: n): ');
    const isRequired = isRequiredStr.toLowerCase() === 'y' || isRequiredStr.toLowerCase() === 'yes';
    const isActiveStr = await question('Make this version active? (y/n, default: y): ');
    const isActive = isActiveStr.toLowerCase() !== 'n' && isActiveStr.toLowerCase() !== 'no';

    const versionData = {
      version,
      platform,
      buildNumber,
      releaseNotes: releaseNotes || '',
      downloadUrl: downloadUrl || '',
      manifestUrl: manifestUrl || '',
      isRequired,
      isActive,
      minSupportedVersion: minSupportedVersion || null,
      updateSize,
      releaseDate: new Date(),
    };

    const existing = await AppVersion.findOne({
      platform,
      version,
      buildNumber,
    });

    if (existing) {
      const overwrite = await question(`\n⚠️  Version ${version} (Build ${buildNumber}) for ${platform} already exists. Overwrite? (y/n): `);
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        await mongoose.disconnect();
        process.exit(0);
      }
      Object.assign(existing, versionData);
      await existing.save();
      console.log(`\n✅ Updated existing version: ${platform.toUpperCase()} v${version} (Build ${buildNumber})`);
    } else {
      const newVersion = new AppVersion(versionData);
      await newVersion.save();
      console.log(`\n✅ Created new version: ${platform.toUpperCase()} v${version} (Build ${buildNumber})`);
    }

    console.log('\n📱 Version Details:');
    console.log(`   Platform: ${platform.toUpperCase()}`);
    console.log(`   Version: ${version}`);
    console.log(`   Build: ${buildNumber}`);
    console.log(`   Release Notes: ${releaseNotes || '(none)'}`);
    console.log(`   Required Update: ${isRequired ? 'Yes' : 'No'}`);
    console.log(`   Active: ${isActive ? 'Yes' : 'No'}`);
    if (downloadUrl) console.log(`   Download URL: ${downloadUrl}`);
    if (manifestUrl) console.log(`   Manifest URL: ${manifestUrl}`);

    console.log('\n✅ App version created successfully!');
    console.log('   Users will receive this update automatically.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating app version:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAppVersion();
