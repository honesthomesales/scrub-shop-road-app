# Scrub Shop Road App

A cross-platform sales tracking & venue management application built with React (web) and React Native (mobile), featuring Google Sheets integration for live data management.

## 🚀 Features

- **Cross-Platform**: Web, iOS, and Android support
- **Live Data Sync**: Real-time Google Sheets integration
- **Sales Tracking**: Comprehensive sales history management
- **Venue Management**: Complete venue database with contact information
- **Calendar System**: Advanced scheduling with worker assignments
- **Dashboard Analytics**: Sales performance visualization
- **Responsive Design**: Mobile-first approach with TailwindCSS

## 📊 Data Structure

### Google Sheets Integration
- **Camper_History**: Date, Status, Sales Tax, Net Sales, Gross Sales
- **Trailer_History**: Date, Status, Sales Tax, Net Sales, Gross Sales
- **Venues**: Promo, Promo To Send, Address/City, Contact, Phone, Email, Times, Show Info, Forecast Will

## 🛠 Tech Stack

- **Frontend**: React 18, React Native
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Calendar**: FullCalendar.io
- **State Management**: React Context API
- **API**: Google Sheets API v4 + OAuth2
- **Build Tools**: Vite (web), Expo (mobile)

## 📁 Project Structure

```
/app-root
├── /web                     # Web application
│   ├── /public
│   ├── /src
│   │   ├── /components      # Reusable components
│   │   ├── /pages           # Page-level views
│   │   ├── /contexts        # State management
│   │   ├── /services        # API services
│   │   ├── /utils           # Utilities
│   │   └── /styles          # Global styles
│   └── package.json
├── /mobile                  # React Native app
│   ├── /src
│   │   ├── /components      # Shared components
│   │   ├── /screens         # Mobile screens
│   │   ├── /contexts        # State management
│   │   ├── /services        # API services
│   │   └── /utils           # Utilities
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud Console account (for Sheets API)

### Web App Setup
```bash
cd web
npm install
npm run dev
```

### Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```

### Google Sheets API Setup
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials
4. Add credentials to environment variables

## 📱 Screens

1. **Dashboard**: Sales analytics and performance metrics
2. **Daily Sales**: Sales entry management with infinite scroll
3. **Calendar**: Event scheduling with worker assignments
4. **Venues**: Venue database management
5. **Staff**: Worker management (optional)

## 🔧 Configuration

Environment variables needed:
- `GOOGLE_SHEETS_API_KEY`
- `GOOGLE_SHEETS_CLIENT_ID`
- `GOOGLE_SHEETS_CLIENT_SECRET`

## 📄 License

MIT License 

<!-- Trigger redeploy for GitHub Pages --> 