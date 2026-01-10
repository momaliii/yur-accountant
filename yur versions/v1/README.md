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

### Reports & Analytics
- Monthly/Quarterly financial reports
- Per-client profitability breakdown
- Income vs Expense trends
- Profit margin analysis
- Expense breakdown by category
- Client performance metrics
- Export reports as JSON

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

### Privacy & Security
- **Privacy Mode**: Toggle to blur/hide sensitive financial data when viewing in public
- All data stored locally in your browser (IndexedDB)
- No data sent to external servers (except OpenAI API for AI features)
- Export/Import functionality for backups

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
- **Database**: IndexedDB (Dexie.js) - all data stored locally
- **AI**: OpenAI API (optional, user provides key)
- **Currency**: Exchange Rate API (exchangerate-api.com)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Desktop**: Electron (for desktop app)

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

### Configuration

1. Open the app and go to **Settings**
2. (Optional) Add your OpenAI API key for AI features:
   - Get your API key from [OpenAI](https://platform.openai.com/api-keys)
   - Paste it in the Settings page
   - AI features will be enabled automatically
3. Set your preferred base currency (EGP, USD, EUR, SAR, AED)
4. Configure Vodafone Cash fee percentage (default: 1.5%)

## Data Storage

All data is stored locally in your browser using IndexedDB. This means:
- ✅ Your data never leaves your device
- ✅ No account or login required
- ✅ Works offline after initial load
- ✅ You can export/import data for backup
- ✅ Privacy-first approach

### Backup & Restore

1. Go to **Settings**
2. Click **Export Data** to download a JSON backup
3. Click **Import Data** to restore from a backup file
4. Your data is automatically saved as you work

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

### Using AI Features

1. Ensure OpenAI API key is set in Settings
2. **AI Insights**: Go to Dashboard, click "Get AI Insights"
3. **Predictions**: Go to Reports, click "Get Predictions"
4. **Client Analysis**: Open any client detail page, AI analysis loads automatically
5. **AI Chat**: Navigate to AI Chat page, ask questions about your finances

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

## Privacy & Security

- All financial data is stored locally in your browser
- No data is sent to external servers (except OpenAI API when using AI features)
- Privacy mode allows you to blur sensitive data when viewing in public
- Export/Import functionality for your own backups
- No tracking, no analytics, no third-party data collection

## Troubleshooting

### AI Features Not Working
- Ensure OpenAI API key is set in Settings
- Check your API key is valid and has credits
- Verify internet connection

### Data Not Saving
- Check browser supports IndexedDB
- Try clearing browser cache and reloading
- Export your data as backup before troubleshooting

### Currency Rates Not Updating
- Rates update automatically every 24 hours
- Manual refresh available in Settings
- Check internet connection

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MDZ License - Feel free to use and modify for your needs.

---

**Built with ❤️ for media buyers and digital marketers**
