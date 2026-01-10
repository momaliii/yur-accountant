# Mobile App Build & Installation Guide

This guide explains how to build and install the mobile app versions for iOS and Android.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Capacitor CLI** (installed globally or via npm)
3. **For iOS**: Xcode (Mac only)
4. **For Android**: Android Studio

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Web App

First, build the web application:

```bash
npm run build
```

This creates the `dist` folder with all the compiled assets.

### 3. Sync with Capacitor

Sync the web build with Capacitor:

```bash
npm run capacitor:sync
```

Or use the mobile build command which does both:

```bash
npm run mobile:build
```

## Building for Android

### 1. Open Android Studio

```bash
npm run mobile:android
```

This will:
- Build the web app
- Sync with Capacitor
- Open Android Studio

### 2. Build APK in Android Studio

1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for the build to complete
3. The APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk` (debug) or `android/app/build/outputs/apk/release/app-release.apk` (release)

### 3. Generate Signed APK (for Production)

1. Go to **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select a keystore
4. Fill in the keystore information
5. Select **release** build variant
6. Click **Finish**

### 4. Install APK on Device

**Option A: Direct Install**
- Transfer APK to device via USB, email, or cloud storage
- Open the APK file on the device
- Allow installation from unknown sources if prompted
- Install the app

**Option B: ADB Install**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Create App Version in Admin Dashboard

After building and testing:

1. Upload the APK to a server/CDN (optional, for direct downloads)
2. Go to **Admin Dashboard** → **App Updates**
3. Click **Create Version**
4. Fill in:
   - Platform: **Android**
   - Version: e.g., `1.0.0`
   - Build Number: e.g., `1`
   - Download URL: Link to APK (if uploaded)
   - Release Notes: Describe the version
   - Active: Checked
5. Click **Create Version**

## Building for iOS

### 1. Open Xcode

```bash
npm run mobile:ios
```

This will:
- Build the web app
- Sync with Capacitor
- Open Xcode

### 2. Configure Signing

1. In Xcode, select your project
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Xcode will automatically manage signing

### 3. Build for Device

1. Connect your iOS device via USB
2. Select your device from the device dropdown
3. Click the **Play** button or press `Cmd + R`
4. The app will build and install on your device

### 4. Build for App Store

1. Select **Any iOS Device** or **Generic iOS Device**
2. Go to **Product** → **Archive**
3. Wait for the archive to complete
4. In the Organizer window:
   - Click **Distribute App**
   - Choose distribution method (App Store, Ad Hoc, Enterprise, etc.)
   - Follow the prompts

### 5. Create App Version in Admin Dashboard

After building:

1. Go to **Admin Dashboard** → **App Updates**
2. Click **Create Version**
3. Fill in:
   - Platform: **iOS**
   - Version: e.g., `1.0.0`
   - Build Number: e.g., `1`
   - Download URL: App Store link (if published)
   - Release Notes: Describe the version
   - Active: Checked
4. Click **Create Version**

## Using the Command Line Script

You can also create app versions using the command line:

```bash
npm run create-app-version
```

This will prompt you for:
- Platform (iOS/Android/Web)
- Version number
- Build number
- Release notes
- Download URL
- Manifest URL
- Required update status
- Active status

## Quick Build Commands

### Android
```bash
# Build and open Android Studio
npm run mobile:android

# Or manually:
npm run build
npm run capacitor:sync
npx cap open android
```

### iOS
```bash
# Build and open Xcode
npm run mobile:ios

# Or manually:
npm run build
npm run capacitor:sync
npx cap open ios
```

## Version Numbering

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- **1.0.0** - Initial release
- **1.0.1** - Bug fix
- **1.1.0** - New feature
- **2.0.0** - Major update

Build numbers should increment with each build:
- First build: `1`
- Second build: `2`
- etc.

## Publishing to App Stores

### Google Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Create a new app in Google Play Console
3. Upload the signed APK or AAB (Android App Bundle)
4. Fill in store listing information
5. Submit for review

### Apple App Store

1. Create an Apple Developer account ($99/year)
2. Create a new app in App Store Connect
3. Upload the IPA file via Xcode or Transporter
4. Fill in app information
5. Submit for review

## Over-The-Air (OTA) Updates

For updates that don't require app store approval:

1. Build your app: `npm run mobile:build`
2. Upload the `dist` folder to a CDN/server
3. Create a manifest.json:
```json
{
  "version": "1.0.1",
  "url": "https://your-cdn.com/app-updates/1.0.1/",
  "checksum": "sha256-hash"
}
```
4. In Admin Dashboard → App Updates:
   - Set **Manifest URL** to your manifest.json
   - Users will receive the update automatically

## Testing Before Release

1. **Build Debug Version**: Test on your device
2. **Test All Features**: Ensure everything works
3. **Test Updates**: Verify update system works
4. **Create Test Version**: Add a test version in Admin Dashboard
5. **Verify Update Flow**: Check that updates are received
6. **Build Release Version**: Create production build
7. **Create Production Version**: Add to Admin Dashboard

## Troubleshooting

### Build Errors

**Android:**
- Check Android SDK is installed
- Verify `ANDROID_HOME` environment variable
- Update Gradle if needed

**iOS:**
- Check Xcode is up to date
- Verify signing certificates
- Clean build folder: `Product` → `Clean Build Folder`

### Installation Issues

**Android:**
- Enable "Install from unknown sources"
- Check device compatibility (API level)
- Verify APK is not corrupted

**iOS:**
- Check device is registered in Apple Developer account
- Verify provisioning profile
- Check device UDID is added

### Update Not Working

1. Check version is **Active** in Admin Dashboard
2. Verify version number is higher than current
3. Check platform matches device
4. Ensure internet connection
5. Check server logs for errors

## Best Practices

1. **Always test** before creating a version
2. **Increment version numbers** properly
3. **Write clear release notes**
4. **Use semantic versioning**
5. **Test updates** in development first
6. **Keep old versions** for rollback
7. **Monitor update adoption** rates

## Example Workflow

### First Release

1. Build app: `npm run mobile:build`
2. Test on device
3. Build release version in Android Studio/Xcode
4. Upload to app store (optional)
5. Create version in Admin Dashboard:
   - Platform: Android/iOS
   - Version: 1.0.0
   - Build: 1
   - Active: Yes
6. Publish to app store

### Bug Fix Update

1. Fix the bug
2. Build: `npm run mobile:build`
3. Test the fix
4. Build release version
5. Update version in Admin Dashboard:
   - Version: 1.0.1
   - Build: 2
   - Release Notes: "Fixed login issue"
6. Users receive update automatically

## Support

For issues:
- Check build logs
- Verify Capacitor configuration
- Review Admin Dashboard → System Health
- Check server logs
