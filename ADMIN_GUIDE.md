# Admin Features Guide

This guide explains how admins can use the platform's admin features.

## 📧 **1. Sending & Receiving Messages**

### How to Send Messages:
1. Go to **Messages** page (from sidebar)
2. Click **"New Message"** button (top right - admin only)
3. Select user(s) from the dropdown
4. Enter subject and message
5. Click **"Send Message"**

### How to Receive Messages:
- Messages sent to you will appear in your **Messages** inbox
- Unread messages are highlighted with a blue border
- Click on any message to view and reply

### Features:
- Admin can send messages to any user
- Regular users can only reply to messages they receive
- Thread-based conversations for easy tracking

---

## 🔔 **2. Sending Notifications**

### How to Send Notifications:
1. Go to **Admin Dashboard** → **Users** tab
2. Click the **Eye icon** (👁️) next to any user to view details
3. In the user details modal, click **"Send Notification"** button
4. Fill in the notification form:
   - **To Users**: Select one or multiple users (hold Ctrl/Cmd for multiple)
   - **Type**: Choose info, success, warning, error, or system
   - **Title**: Notification title (required)
   - **Message**: Notification content (required)
   - **Action URL**: Optional link (e.g., `/dashboard`)
   - **Priority**: Normal, High, or Urgent
5. Click **"Send Notification"**

### Notification Features:
- Send to single or multiple users at once
- Different notification types (info, success, warning, error)
- Priority levels (normal, high, urgent)
- Optional action URLs for direct navigation
- Real-time delivery via WebSocket

---

## 📢 **3. Creating Announcements**

### How to Create Announcements:
1. Go to **Announcements** page (from sidebar)
2. Click **"Create Announcement"** button (top right - admin only)
3. Fill in the form:
   - **Title**: Announcement title (required)
   - **Content**: Announcement content - HTML supported (required)
   - **Type**: Info, Warning, Success, or Error
   - **Priority**: Normal, High, or Urgent
   - **Target Audience**: All Users, Regular Users Only, or Admins Only
   - **Start Date**: Optional - when announcement becomes active
   - **End Date**: Optional - when announcement expires
4. Click **"Create Announcement"**

### Announcement Features:
- Platform-wide announcements visible to all users
- Targeted announcements (all users, regular users, or admins only)
- Scheduled announcements (start/end dates)
- Priority levels for important updates
- HTML content support for rich formatting
- Auto-expiration based on end date

### Viewing Announcements:
- Regular users see only active announcements
- Admins can see all announcements (active and inactive)
- Announcements appear on the Announcements page

---

## 🎫 **4. Viewing & Managing Tickets**

### How to View All Tickets (Admin):
1. Go to **Support Tickets** page (from sidebar)
2. As an admin, you automatically see **ALL tickets** from all users
3. Regular users only see their own tickets

### Ticket Management Features:
- **View All Tickets**: Admins see tickets from all users
- **Filter by Status**: All, Open, In Progress, Resolved, Closed
- **Ticket Information**:
  - Ticket ID, subject, description
  - User who created it (shown for admins)
  - Category, priority, status
  - Assignment information
  - Creation date

### Admin Actions on Tickets:
- **Start**: Change status from "open" to "in_progress"
- **Resolve**: Mark ticket as resolved
- **View Details**: See full ticket information including user details

### Regular User Actions:
- Create new tickets
- View their own tickets
- See ticket status updates

---

## 🎯 **Quick Reference**

### Admin-Only Features:
- ✅ Send messages to any user
- ✅ Send notifications to single or multiple users
- ✅ Create platform-wide announcements
- ✅ View all support tickets (not just your own)
- ✅ Manage users (create, edit, delete)
- ✅ View analytics and statistics
- ✅ Export user data
- ✅ Manage webhooks and API keys

### Access Points:
- **Messages**: Sidebar → Messages → "New Message" button
- **Notifications**: Admin Dashboard → Users → View User → "Send Notification"
- **Announcements**: Sidebar → Announcements → "Create Announcement" button
- **Tickets**: Sidebar → Support Tickets (automatically shows all tickets for admins)

---

## 💡 **Tips**

1. **Bulk Notifications**: Use the notification modal to select multiple users at once (hold Ctrl/Cmd)
2. **Scheduled Announcements**: Set start/end dates to schedule announcements in advance
3. **Ticket Priority**: High-priority tickets are automatically highlighted
4. **Message Threads**: All replies are grouped in threads for easy conversation tracking
5. **Real-time Updates**: Notifications and messages are delivered in real-time via WebSocket

---

**Last Updated**: January 2025
