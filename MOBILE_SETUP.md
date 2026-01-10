# Mobile App Setup Guide

This guide will help you set up and build mobile versions (iOS and Android) of YUR Finance using Capacitor.

## Prerequisites

### For iOS Development:
- macOS (required)
- Xcode (latest version recommended)
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for device testing and App Store distribution)

### For Android Development:
- Android Studio (latest version)
- Java Development Kit (JDK) 11 or later
- Android SDK (installed via Android Studio)
- Environment variables:
  - `ANDROID_HOME` or `ANDROID_SDK_ROOT` pointing to your Android SDK location
  - Add `$ANDROID_HOME/platform-tools` and `$ANDROID_HOME/tools` to your PATH

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Web App**
   ```bash
   npm run build
   ```

3. **Initialize Capacitor** (if not already done)
   ```bash
   npm run capacitor:init
   ```
   This will create the `ios` and `android` directories.

4. **Sync Capacitor** (copies web build to native projects)
   ```bash
   npm run capacitor:sync
   ```

## Building for iOS

1. **Open iOS Project in Xcode**
   ```bash
   npm run mobile:ios
   ```
   Or manually:
   ```bash
   npx cap open ios
   ```

2. **In Xcode:**
   - Select your development team in Signing & Capabilities
   - Choose a device or simulator
   - Click the Run button (▶️) or press `Cmd + R`

3. **For Device Testing:**
   - Connect your iOS device via USB
   - Trust the computer on your device
   - Select your device in Xcode
   - Click Run

## Building for Android

1. **Open Android Project in Android Studio**
   ```bash
   npm run mobile:android
   ```
   Or manually:
   ```bash
   npx cap open android
   ```

2. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Select a device/emulator
   - Click the Run button (▶️) or press `Shift + F10`

3. **For Device Testing:**
   - Enable Developer Options on your Android device
   - Enable USB Debugging
   - Connect device via USB
   - Select your device in Android Studio
   - Click Run

## Development Workflow

1. **Make changes to your React code**

2. **Rebuild and sync:**
   ```bash
   npm run mobile:build
   ```
   This runs `npm run build` and then `npx cap sync`

3. **Test on device/simulator:**
   - iOS: Use Xcode
   - Android: Use Android Studio

## Available Scripts

- `npm run mobile:build` - Build web app and sync to native projects
- `npm run mobile:ios` - Build, sync, and open iOS project in Xcode
- `npm run mobile:android` - Build, sync, and open Android project in Android Studio
- `npm run capacitor:sync` - Sync web build to native projects
- `npm run capacitor:copy` - Copy web assets to native projects
- `npm run capacitor:update` - Update Capacitor dependencies

## Configuration

The Capacitor configuration is in `capacitor.config.js`. You can modify:
- App ID: `com.mdz.yur-accountant`
- App Name: `YUR Finance`
- Web directory: `dist`
- Plugin settings

## Platform-Specific Notes

### iOS
- The app uses safe area insets for notched devices
- Status bar is configured to be dark
- Keyboard automatically resizes the view

### Android
- Back button handling is implemented
- Status bar is configured to be dark
- Mixed content is allowed for development

## Troubleshooting

### iOS Issues:
- **Build fails**: Make sure CocoaPods are installed and run `cd ios && pod install`
- **Signing errors**: Check your Apple Developer account and team selection in Xcode
- **Simulator not working**: Make sure Xcode Command Line Tools are installed

### Android Issues:
- **Gradle sync fails**: Check your Android SDK installation and environment variables
- **Device not detected**: Enable USB debugging and check ADB connection
- **Build errors**: Make sure you have the correct Android SDK versions installed

### General:
- **Changes not appearing**: Run `npm run mobile:build` after making code changes
- **Plugin issues**: Run `npm run capacitor:update` to update Capacitor plugins

## Publishing

### iOS (App Store):
1. Archive the app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Complete app information in App Store Connect
4. Submit for review

### Android (Google Play):
1. Build a release APK/AAB in Android Studio
2. Sign the app with your keystore
3. Upload to Google Play Console
4. Complete app information
5. Submit for review

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/ios/)
- [Android Development Guide](https://developer.android.com/)

