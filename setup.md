# Scrub Shop Road App - Setup Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Console account (for Sheets API)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install web app dependencies
cd web
npm install

# Install mobile app dependencies
cd ../mobile
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `web` directory with the following variables:

```env
# Google Sheets API Configuration
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEETS_CLIENT_ID=your_client_id_here
VITE_GOOGLE_SHEETS_CLIENT_SECRET=your_client_secret_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here

# App Configuration
VITE_APP_NAME="Scrub Shop Road App"
VITE_APP_VERSION="1.0.0"

# Development Settings
VITE_DEV_MODE=true
VITE_MOCK_API=true
```

### 3. Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials
5. Download credentials and add to environment variables

### 4. Run the Applications

#### Web App
```bash
cd web
npm run dev
```
Open http://localhost:3000

#### Mobile App
```bash
cd mobile
npx expo start
```
Scan QR code with Expo Go app or run on simulator

## Project Structure

```
/app-root
├── /web                     # Web application (React + Vite)
│   ├── /src
│   │   ├── /components      # Reusable components
│   │   ├── /pages           # Page-level views
│   │   ├── /contexts        # State management
│   │   ├── /services        # API services
│   │   ├── /utils           # Utilities
│   │   └── /styles          # Global styles
│   └── package.json
├── /mobile                  # React Native app (Expo)
│   ├── /src
│   │   ├── /screens         # Mobile screens
│   │   ├── /contexts        # State management
│   │   ├── /services        # API services
│   │   └── /utils           # Utilities
│   └── package.json
└── README.md
```

## Features

### Web App
- ✅ Dashboard with sales analytics
- ✅ Daily Sales management with CRUD
- ✅ Calendar with FullCalendar integration
- ✅ Venues management with search/filter
- ✅ Staff management
- ✅ Responsive design with TailwindCSS
- ✅ Google Sheets integration (mock)

### Mobile App
- ✅ Basic navigation structure
- ✅ Dashboard screen
- ✅ Placeholder screens for other features
- ✅ Shared context and utilities

## Development Notes

- Currently using mock data for Google Sheets API
- Mobile app has basic structure, full features coming soon
- Web app is fully functional with mock data
- Real Google Sheets integration requires OAuth 2.0 setup

## Next Steps

1. Set up real Google Sheets API credentials
2. Complete mobile app screens
3. Add authentication
4. Add offline support
5. Add push notifications
6. Add data export features 