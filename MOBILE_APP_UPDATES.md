# Mobile App Updates Guide

This guide explains how to manage and update mobile app versions for iOS, Android, and Web platforms.

## Overview

The app uses an Over-The-Air (OTA) update system that allows you to push updates to mobile apps without requiring users to download a new version from the app store. This is especially useful for:

- Bug fixes
- UI improvements
- Feature additions
- Security patches

## Initial Setup

### 1. Initialize Default Versions

Run the initialization script to create default app versions:

```bash
npm run init-app-versions
```

This creates initial versions for:
- iOS v1.0.0
- Android v1.0.0
- Web v1.0.0

### 2. Access Admin Dashboard

1. Log in as an admin user
2. Navigate to **Admin Dashboard** → **App Updates** tab
3. You'll see all existing app versions organized by platform

## Creating a New Version

### Step 1: Open the Create Version Modal

1. Click the **"Create Version"** button in the App Updates tab
2. A modal will open with all version fields

### Step 2: Fill in Version Details

**Required Fields:**
- **Platform**: Select iOS, Android, or Web
- **Version**: Enter version number (e.g., "1.0.1", "1.1.0", "2.0.0")
- **Build Number**: Enter build number (e.g., "2", "101", "2024.01")

**Optional Fields:**
- **Release Notes**: Describe what's new in this version
- **Download URL**: For native app updates (APK/IPA download link)
- **Manifest URL**: For Capacitor Live Updates (manifest.json URL)
- **Minimum Supported Version**: Oldest version that can still use the app
- **Update Size**: Size of the update in bytes

**Settings:**
- **Required Update**: Check this for critical updates that users must install
- **Active**: Check this to make the version available to users

### Step 3: Save the Version

Click **"Create Version"** to save. The version will immediately be available to users.

## Updating an Existing Version

1. Find the version in the App Updates tab
2. Click the **"Edit"** button next to the version
3. Modify the fields as needed
4. Click **"Update Version"** to save changes

## Deleting a Version

1. Find the version in the App Updates tab
2. Click the **"Delete"** button next to the version
3. Confirm the deletion

⚠️ **Warning**: Deleting a version will remove it permanently. Users on that version will not be able to check for updates.

## Version Numbering Best Practices

### Semantic Versioning

Use semantic versioning format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)

### Examples

- `1.0.0` - Initial release
- `1.0.1` - Bug fix
- `1.1.0` - New feature
- `2.0.0` - Major update with breaking changes

## Update Types

### 1. Optional Updates

- Users are notified but can dismiss
- Update is applied in the background (mobile)
- Users can continue using the app

**Use for:**
- Minor bug fixes
- UI improvements
- New features

### 2. Required Updates

- Users cannot dismiss the notification
- Update is automatically applied after 2 seconds
- Users must update to continue using the app

**Use for:**
- Critical security patches
- Breaking changes
- Major bug fixes

## Platform-Specific Notes

### iOS

- **Download URL**: Link to .ipa file or App Store page
- **Manifest URL**: For Capacitor Live Updates
- **Build Number**: Must match App Store Connect build number

### Android

- **Download URL**: Link to .apk file or Google Play Store page
- **Manifest URL**: For Capacitor Live Updates
- **Build Number**: Must match Google Play Console build number

### Web

- **Download URL**: Not applicable
- **Manifest URL**: Not applicable
- **Update**: Users get the latest version on page reload

## Capacitor Live Updates

For Capacitor apps, you can use Live Updates to push updates without app store approval:

1. Build your app and deploy to a CDN/server
2. Create a manifest file pointing to the new build
3. Set the **Manifest URL** in the version
4. Users will automatically receive the update

### Setting Up Live Updates

1. Build your app: `npm run mobile:build`
2. Upload the `dist` folder to your server/CDN
3. Create a manifest.json file:
```json
{
  "version": "1.0.1",
  "url": "https://your-cdn.com/app-updates/1.0.1/",
  "checksum": "sha256-hash-of-build"
}
```
4. Set the manifest URL in the Admin Dashboard

## Automatic Update Flow

1. **Check for Updates**: App checks every 15 minutes (mobile) or 30 minutes (web)
2. **Detect New Version**: Server compares current version with latest version
3. **Show Notification**: User sees update notification
4. **Apply Update**:
   - **Required**: Automatically applied after 2 seconds
   - **Optional**: User can click "Update Now" or dismiss

## Testing Updates

### Test on Development

1. Create a test version with a higher version number
2. Set it as "Active"
3. Open the app and wait for the update check (or trigger manually)
4. Verify the update notification appears
5. Test the update process

### Test on Production

1. Create a version with a small increment (e.g., 1.0.0 → 1.0.1)
2. Set "Required Update" to false initially
3. Monitor user feedback
4. If stable, mark as required or create next version

## Troubleshooting

### Users Not Receiving Updates

1. **Check Version is Active**: Ensure "Active" is checked
2. **Check Version Number**: Must be higher than current version
3. **Check Platform**: Ensure platform matches user's device
4. **Check Update Check Interval**: Updates check every 15-30 minutes

### Update Not Applying

1. **Check Manifest URL**: Ensure it's accessible and valid
2. **Check Download URL**: Ensure it's accessible (for native apps)
3. **Check Network**: User must have internet connection
4. **Check Capacitor Plugin**: Ensure Live Updates plugin is installed

### Version Conflicts

- Only one version per platform can be "Active" at a time
- The latest version (by version number) is used for update checks
- Deactivate old versions when creating new ones

## API Endpoints

### For Admins

- `GET /api/app/updates?platform=all` - Get all versions
- `POST /api/admin/app-versions` - Create version
- `PUT /api/admin/app-versions/:id` - Update version
- `DELETE /api/admin/app-versions/:id` - Delete version

### For Users

- `GET /api/app/updates/check?platform=ios&version=1.0.0` - Check for updates
- `GET /api/app/version?platform=ios&version=1.0.0` - Get version info

## Best Practices

1. **Version Incrementing**: Always increment version numbers
2. **Release Notes**: Always include clear release notes
3. **Testing**: Test updates in development before production
4. **Gradual Rollout**: Start with optional updates, then make required
5. **Monitoring**: Monitor update adoption rates
6. **Documentation**: Keep release notes detailed and helpful

## Example Workflow

### Releasing a Bug Fix

1. Fix the bug in your code
2. Build and test the fix
3. Go to Admin Dashboard → App Updates
4. Click "Create Version"
5. Set:
   - Platform: iOS/Android/Web
   - Version: 1.0.1 (increment patch)
   - Build Number: 2
   - Release Notes: "Fixed login issue"
   - Required Update: false (optional)
   - Active: true
6. Click "Create Version"
7. Monitor update adoption
8. After 24-48 hours, if stable, you can mark as required

### Releasing a Major Update

1. Complete development and testing
2. Go to Admin Dashboard → App Updates
3. Click "Create Version"
4. Set:
   - Platform: iOS/Android/Web
   - Version: 2.0.0 (increment major)
   - Build Number: 1
   - Release Notes: "Major update with new features..."
   - Required Update: true (critical)
   - Active: true
5. Click "Create Version"
6. Users will be forced to update within 2 seconds

## Support

For issues or questions:
1. Check the Admin Dashboard → System Health
2. Review server logs
3. Check the App Updates tab for version status
4. Verify API endpoints are accessible
