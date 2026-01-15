# YUR Finance - Media Buyer Dashboard

A comprehensive financial dashboard for media buyers to track income, expenses, clients, and debts with AI-powered insights and expert financial analysis.

## Features

### Client Management
- Track multiple clients with different payment models:
  - **Fixed Salary**: Set monthly/project rate
  - **Fixed + % of Ad Spend**: Base rate plus percentage of advertising spend
  - **% of Ad Spend Only**: Commission-based on ad spend
  - **Commission (Outsourcing)**: Client pays you X, you pay subcontractor Y, keep the difference
  - **Per Project**: Variable payment amounts per project basis
- Track services provided per client (Facebook Ads, Google Ads, TikTok Ads, Strategy, Creative)
- View per-client earnings and profitability
- **Client Rating System**: Rate clients from 1-5 stars
- **Risk Assessment**: Categorize clients as Low, Medium, or High risk
- **Detailed Client Pages**: Comprehensive client profiles with:
  - Payment history and statistics
  - AI-powered client analysis
  - Performance insights
  - Payment pattern analysis
  - Risk evaluation and recommendations

### Income Tracking
- Log income with multiple payment methods:
  - **Vodafone Cash**: Automatic fee calculation (configurable 1-1.5%)
  - **Bank Transfer**: No fees
  - **InstaPay**: No fees
  - **Cash**: No fees
  - **Other**: Custom payment methods
- Multi-currency support with automatic conversion (EGP, USD, EUR, SAR, AED)
- Net amount calculation after fees
- Link income to specific clients and projects
- Track ad spend for percentage-based clients
- Project name tracking for per-project clients

### Expense Tracking
- Comprehensive expense categories:
  - **Subscriptions**: Software, services subscriptions
  - **Fees**: Transaction fees, platform fees
  - **Tools**: Marketing tools, software licenses
  - **Salaries/Payroll**: Employee payments
  - **Outsourcing**: Freelancer, contractor payments
  - **Advertising**: Ad spend, marketing campaigns
  - **Office Supplies**: Stationery, equipment
  - **Travel**: Transportation, accommodation
  - **Rent**: Office/apartment rent
  - **Utilities**: Water, electricity, gas
  - **Internet/Phone**: Internet and phone bills
  - **Transportation**: Uber, Didi, taxi expenses
  - **Other**: Miscellaneous expenses
- Mark recurring expenses
- AI-powered auto-categorization
- Link expenses to specific clients
- Multi-currency support

### Debt Management
- Track money owed to you (client debts)
- Track money you owe (to subcontractors, vendors)
- Due date tracking with overdue alerts
- Quick "Mark as Paid" functionality
- Status tracking (Pending, Paid, Overdue)

### Invoices Management
- Create and manage invoices for clients
- Track invoice status (Draft, Sent, Paid, Overdue)
- Add multiple items to invoices
- Set due dates and payment terms
- Link invoices to specific clients
- **PDF Export**: Generate professional PDF invoices
- Invoice number auto-generation
- Payment tracking per invoice

### Tax Reports
- Calculate taxable income and deductions
- Estimate VAT/GST based on configurable tax rate
- View income by category for tax purposes
- Track tax deductions from expenses
- Period-based tax calculations (monthly, quarterly, yearly)
- **PDF Export**: Generate tax reports as PDF documents

### Reports & Analytics
- Monthly/Quarterly/Yearly financial reports
- Per-client profitability breakdown
- Income vs Expense trends
- Profit margin analysis
- Expense breakdown by category
- Client performance metrics
- **PDF Export**: Export comprehensive financial reports as PDF
- Export reports as JSON

### Financial Goals
- Set income, expense, and profit goals
- Track progress with visual indicators
- Monthly, quarterly, and yearly goal periods
- Category-specific expense budgets
- Automatic progress calculation
- Goal completion notifications
- Visual progress bars and statistics

### Savings Tracking
- Track multiple savings types:
  - **Gold**: Track gold holdings with quantity and price per unit
  - **Money/Cash**: Traditional cash savings
  - **Certificates/Deposits**: Track deposits with interest rates and maturity dates
  - **Stocks/Investments**: Monitor investment portfolios
- Transaction history (deposits, withdrawals, value updates)
- Multi-currency support for savings
- Target amount and date tracking
- AI-powered savings insights and projections
- Visual charts and analytics

### To-Do List
- Create and manage tasks with priorities (High, Medium, Low)
- Organize tasks into custom lists with color coding
- Task categories (Financial, Administrative, Follow-up, Personal, Other)
- Due date tracking with overdue alerts
- Recurring tasks (daily, weekly, monthly, yearly)
- Task completion tracking
- Search and filter functionality
- Status filtering (all, completed, pending, overdue)

### AI Features (requires OpenAI API key)
- **Smart Insights**: Get AI-generated expert analysis of your finances with actionable recommendations
- **Predictions**: Forecast next month's income and expenses based on historical data
- **Auto-Categorization**: AI suggests expense categories automatically
- **AI Chatbot**: Ask natural language questions about your finances and get expert financial advice
- **Client Analysis**: Comprehensive AI-powered analysis for each client including:
  - Payment pattern analysis
  - Profitability assessment
  - Risk evaluation
  - Performance insights
  - Actionable recommendations
  - Payment forecasting
- **Savings Insights**: AI-powered analysis and projections for your savings

### Privacy & Security
- **Privacy Mode**: Toggle to blur/hide sensitive financial data when viewing in public
- **Local-First Architecture**: All data stored locally in your browser (IndexedDB) for fast access
- **Cloud Sync**: Optional Supabase sync for multi-device access and backup
- **Offline Support**: Full functionality works offline, syncs when online
- **Export/Import**: Backup and restore functionality
- **Secure Authentication**: Supabase Auth with JWT tokens

### Help Center
- Built-in help documentation
- Quick guides for common tasks
- FAQ section organized by feature
- Step-by-step tutorials
- Search functionality

### User Interface
- **Modern Dark Theme**: Beautiful gradient accents (Indigo → Cyan → Emerald)
- **Glass-morphism Effects**: Modern UI with frosted glass effects
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Sidebar Minimization**: Collapse sidebar to maximize screen space
- **Smooth Animations**: Polished user experience
- **Privacy Toggle**: Quick access to hide/show sensitive data

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand with persistence
- **Local Database**: IndexedDB (Dexie.js) - for fast offline access
- **Online Database**: Supabase (PostgreSQL) - for cloud sync and multi-device access
- **Backend**: Fastify (Node.js) - hosted on Railway
- **Authentication**: Supabase Auth
- **AI**: OpenAI API (optional, user provides key)
- **Currency**: Exchange Rate API (exchangerate-api.com)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **PDF Generation**: jsPDF + jsPDF AutoTable
- **Desktop**: Electron (for desktop app)
- **Mobile**: Capacitor (iOS and Android)

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server (web)
npm run dev

# Build for production (web)
npm run build

# Preview production build (web)
npm run preview
```

The web app will be available at `http://localhost:5173`

**Note:** For cloud sync functionality, you'll need to set up Supabase environment variables. See [FRONTEND_ENV_SETUP.md](FRONTEND_ENV_SETUP.md) for instructions.

### Desktop Application

The app can also be built as a desktop application for Windows, macOS, and Linux.

#### Development (Desktop)

```bash
# Install Electron dependencies (if not already installed)
npm install

# Run in development mode (requires web dev server running)
# Terminal 1: Start web dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

#### Building Desktop Applications

```bash
# Build for your current platform
npm run electron:build

# Build for specific platforms
npm run electron:build:mac    # macOS (DMG, ZIP)
npm run electron:build:win    # Windows (NSIS installer, Portable)
npm run electron:build:linux   # Linux (AppImage, DEB)
```

Built applications will be in the `release/` directory:
- **macOS**: `.dmg` installer and `.zip` archive
- **Windows**: `.exe` installer (NSIS) and portable `.exe`
- **Linux**: `.AppImage` and `.deb` package

#### Desktop App Features

- ✅ Native desktop application
- ✅ Works offline (after initial load)
- ✅ All data stored locally
- ✅ No browser required
- ✅ System tray support (macOS)
- ✅ Native menus and shortcuts
- ✅ Auto-updates ready (can be configured)

### Mobile Application

The app can be built as a native mobile application for iOS and Android using Capacitor.

#### Prerequisites

**For iOS Development:**
- macOS (required)
- Xcode (latest version recommended)
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for device testing and App Store distribution)

**For Android Development:**
- Android Studio (latest version)
- Java Development Kit (JDK) 11 or later
- Android SDK (installed via Android Studio)
- Environment variables:
  - `ANDROID_HOME` or `ANDROID_SDK_ROOT` pointing to your Android SDK location
  - Add `$ANDROID_HOME/platform-tools` and `$ANDROID_HOME/tools` to your PATH

#### Development (Mobile)

```bash
# Build the web app
npm run build

# Sync with Capacitor (copies web build to native projects)
npm run capacitor:sync

# Open iOS project in Xcode
npm run mobile:ios

# Open Android project in Android Studio
npm run mobile:android
```

#### Building Mobile Applications

**For iOS:**
1. Open the project in Xcode: `npm run mobile:ios`
2. Select your development team in Signing & Capabilities
3. Choose a device or simulator
4. Click Run (▶️) or press `Cmd + R`
5. For App Store distribution: Archive the app (Product → Archive)

**For Android:**
1. Open the project in Android Studio: `npm run mobile:android`
2. Wait for Gradle sync to complete
3. Select a device/emulator
4. Click Run (▶️) or press `Shift + F10`
5. For Google Play: Build a release APK/AAB in Android Studio

#### Mobile App Features

- ✅ Native iOS and Android applications
- ✅ Works offline (after initial load)
- ✅ All data stored locally
- ✅ Native keyboard handling
- ✅ Status bar customization
- ✅ Safe area support for notched devices
- ✅ Back button handling (Android)
- ✅ App Store and Google Play ready

For detailed mobile setup instructions, see:
- [Mobile Setup Guide](MOBILE_SETUP.md)
- [Android Build Guide](android/ANDROID_BUILD.md)

### Configuration

#### Environment Variables (Frontend)

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Required for online sync)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API URL (Backend server)
VITE_API_URL=https://web-production-9522e.up.railway.app/api
```

See [FRONTEND_ENV_SETUP.md](FRONTEND_ENV_SETUP.md) for detailed setup instructions.

#### App Settings

1. Open the app and go to **Settings**
2. (Optional) Add your OpenAI API key for AI features:
   - Get your API key from [OpenAI](https://platform.openai.com/api-keys)
   - Paste it in the Settings page
   - AI features will be enabled automatically
3. Set your preferred base currency (EGP, USD, EUR, SAR, AED)
4. Configure Vodafone Cash fee percentage (default: 1.5%)
5. Enable periodic sync (optional) for automatic cloud synchronization

## Data Storage

### Local Storage (IndexedDB)

All data is stored locally in your browser using IndexedDB for fast access:
- ✅ Instant data access (no network delay)
- ✅ Works completely offline
- ✅ Privacy-first approach
- ✅ No account required for local-only usage

### Cloud Sync (Supabase) - Optional

For multi-device access and automatic backups, enable Supabase sync:
- ✅ Access your data from any device
- ✅ Automatic sync across devices
- ✅ Secure cloud backup
- ✅ Conflict resolution for concurrent edits
- ✅ Periodic sync (configurable interval)
- ✅ Offline queue - changes sync when connection restored

**Setup Instructions:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL script from `server/supabase_tables.sql` in Supabase SQL Editor
3. Add Supabase credentials to `.env` file (see [FRONTEND_ENV_SETUP.md](FRONTEND_ENV_SETUP.md))
4. Restart the development server

### Backup & Restore

**Manual Backup:**
1. Go to **Settings**
2. Click **Export Data** to download a JSON backup
3. Click **Import Data** to restore from a backup file

**Automatic Backup (with Supabase):**
- Data automatically syncs to cloud
- Access from any device with your account
- No manual backup needed

## Usage Guide

### Adding Clients

1. Navigate to **Clients** page
2. Click **Add New Client**
3. Fill in client information:
   - Name, email, phone
   - Select payment model
   - Configure payment details based on model
   - Add services provided
   - Set initial rating and risk level
   - Add notes
4. Click **Add Client**

### Tracking Income

1. Go to **Income** page
2. Click **Add Income**
3. Select client (optional)
4. Enter amount and currency
5. Choose payment method
6. If Vodafone Cash, fee is calculated automatically
7. Add date and notes
8. For per-project clients, add project name

### Managing Expenses

1. Navigate to **Expenses** page
2. Click **Add Expense**
3. Select category (or use AI auto-categorization)
4. Enter amount and currency
5. Link to client if applicable
6. Mark as recurring if needed
7. Add date and description

### Viewing Client Details

1. Go to **Clients** page
2. Click **View Details** on any client card
3. View comprehensive client information:
   - Payment statistics
   - Payment history
   - AI analysis (if API key is set)
   - Edit rating and risk level
   - Add/edit notes

### Creating Invoices

1. Navigate to **Invoices** page
2. Click **Create Invoice**
3. Select a client
4. Add invoice items (description, quantity, price)
5. Set issue date and due date
6. Choose invoice status (Draft, Sent, Paid)
7. Click **Save Invoice**
8. Click **Generate PDF** to export as PDF

### Generating Tax Reports

1. Go to **Tax Reports** page
2. Select date range (month, quarter, or year)
3. Review calculated tax information:
   - Taxable income
   - Tax deductions
   - Estimated tax (VAT/GST)
4. Click **Export PDF** to generate tax report document

### Setting Financial Goals

1. Navigate to **Goals** page
2. Click **Add Goal**
3. Select goal type (Income, Expense Budget, or Profit)
4. Set target amount and period (Monthly, Quarterly, Yearly)
5. For expense goals, optionally select a category
6. Add notes if needed
7. Click **Add Goal**
8. Track progress automatically as you add transactions

### Managing Savings

1. Go to **My Savings** page
2. Click **Add Savings**
3. Select savings type (Gold, Money, Certificate, Stock)
4. Enter initial amount and currency
5. For gold/stocks: Add quantity and price per unit
6. For certificates: Add interest rate and maturity date
7. Optionally set target amount and date
8. Add transactions (deposits, withdrawals, value updates) as needed
9. View AI insights and projections (if API key is set)

### Using To-Do List

1. Navigate to **To-Do List** page
2. Create custom lists (optional) with color coding
3. Click **Add Task**
4. Enter task details:
   - Title and description
   - Priority (High, Medium, Low)
   - Category
   - Due date
   - Recurrence pattern (if recurring)
5. Assign to a list (optional)
6. Mark tasks as complete when done
7. Use filters and search to find specific tasks

### Using AI Features

1. Ensure OpenAI API key is set in Settings
2. **AI Insights**: Go to Dashboard, click "Get AI Insights"
3. **Predictions**: Go to Reports, click "Get Predictions"
4. **Client Analysis**: Open any client detail page, AI analysis loads automatically
5. **AI Chat**: Navigate to AI Assistant page, ask questions about your finances
6. **Savings Insights**: View AI-powered analysis in My Savings page

### Exporting PDFs

1. **Financial Reports**: Go to Reports page, select period, click "Export PDF"
2. **Invoices**: Go to Invoices page, click "Generate PDF" on any invoice
3. **Tax Reports**: Go to Tax Reports page, select period, click "Export PDF"

## Keyboard Shortcuts

- **Privacy Mode**: Toggle button in header (eye icon)
- **Sidebar Toggle**: Minimize button on sidebar (desktop only)

## Platform Support

### Web Browser
- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with IndexedDB support

### Desktop Application
- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.13+ (Intel and Apple Silicon)
- **Linux**: Most modern distributions (AppImage or DEB)

### Mobile Application
- **iOS**: iOS 13+ (iPhone and iPad)
- **Android**: Android 5.1+ (API level 22+)

## Privacy & Security

- **Local-First**: All financial data stored locally in your browser (IndexedDB)
- **Optional Cloud Sync**: Data only syncs to Supabase if you enable it
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Encrypted Connections**: All API calls use HTTPS
- **Privacy Mode**: Toggle to blur sensitive data when viewing in public
- **Export/Import**: Manual backup functionality available
- **No Tracking**: No analytics, no third-party data collection
- **OpenAI API**: Only used when you explicitly enable AI features (optional)

## Troubleshooting

### Supabase Sync Not Working
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`
- Restart development server after adding environment variables
- Check Supabase project is active and tables are created
- See [FRONTEND_ENV_SETUP.md](FRONTEND_ENV_SETUP.md) for detailed setup

### Login/Authentication Issues
- Verify `VITE_API_URL` is correctly set in `.env`
- Check Railway server is running and accessible
- Ensure CORS is configured on Railway (see [FIX_CORS_ERROR.md](FIX_CORS_ERROR.md))
- See [FIX_LOGIN_ERROR.md](FIX_LOGIN_ERROR.md) for detailed troubleshooting

### AI Features Not Working
- Ensure OpenAI API key is set in Settings
- Check your API key is valid and has credits
- Verify internet connection

### Data Not Saving
- Check browser supports IndexedDB
- Try clearing browser cache and reloading
- Export your data as backup before troubleshooting
- If using Supabase sync, check sync status in console

### Currency Rates Not Updating
- Rates update automatically every 24 hours
- Manual refresh available in Settings
- Check internet connection

## Additional Documentation

- [Frontend Environment Setup](FRONTEND_ENV_SETUP.md) - Configure Supabase for cloud sync
- [Supabase Setup Guide](ONLINE_STORAGE_GUIDE.md) - Detailed Supabase setup instructions
- [Create Admin Account](CREATE_ADMIN_SUPABASE.md) - How to create admin users
- [Get Supabase Keys](GET_SUPABASE_KEYS_V2.md) - How to get Supabase API keys
- [Fix Login Errors](FIX_LOGIN_ERROR.md) - Troubleshoot authentication issues
- [Fix CORS Errors](FIX_CORS_ERROR.md) - Resolve CORS configuration
- [Railway Setup](RAILWAY_SETUP.md) - Backend server configuration
- [Mobile Setup Guide](MOBILE_SETUP.md) - Build mobile applications

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MDZ License - Feel free to use and modify for your needs.

---

**Built with ❤️ for media buyers and digital marketers**
