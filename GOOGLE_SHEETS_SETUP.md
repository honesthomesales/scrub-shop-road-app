# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API integration for the Scrub Shop Road App.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. A Google Sheets spreadsheet with the required sheets:
   - `Camper_History`
   - `Trailer_History` 
   - `Venues`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Scrub Shop Road App")
4. Click "Create"

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API" and then "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "Scrub Shop Road App"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the remaining steps

4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "Scrub Shop Road App Web Client"
   - Authorized JavaScript origins: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
   - Click "Create"

5. Note down the Client ID and Client Secret

## Step 4: Get Your Spreadsheet ID

1. Open your Google Sheets spreadsheet
2. The spreadsheet ID is in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the SPREADSHEET_ID

## Step 5: Configure Environment Variables

1. Copy `web/env.example` to `web/.env`
2. Fill in the values:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEETS_CLIENT_ID=your_oauth_client_id_here
VITE_GOOGLE_SHEETS_CLIENT_SECRET=your_oauth_client_secret_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
```

## Step 6: Prepare Your Google Sheets

Your spreadsheet should have these sheets with the following column headers:

### Camper_History Sheet
- Date
- Status
- Commission
- Revenue
- Total
- Venue

### Trailer_History Sheet
- Date
- Status
- Commission
- Revenue
- Total
- Venue

### Venues Sheet
- Venue Name
- Active
- Address
- Contact Person
- Phone
- Email
- Hours
- Notes
- Priority

## Step 7: Set Up Authentication Callback Route

The app needs to handle the OAuth callback. Add this route to your app:

```javascript
// In your main App.js or routing configuration
<Route path="/auth/callback" element={<AuthCallback />} />
```

## Step 8: Test the Integration

1. Start the development server: `npm run dev`
2. Navigate to the app
3. The app will redirect you to Google OAuth
4. Grant permissions to access your Google Sheets
5. You should be redirected back to the app with live data

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - Include the protocol (http:// or https://)

2. **"Access denied" error**
   - Check that the Google Sheets API is enabled
   - Verify your OAuth consent screen is configured

3. **"Spreadsheet not found" error**
   - Verify the spreadsheet ID is correct
   - Ensure the spreadsheet is shared with your Google account
   - Check that the sheet names match exactly (case-sensitive)

4. **"Authentication required" error**
   - Clear browser storage and try again
   - Check that environment variables are loaded correctly

### Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Regularly rotate your OAuth client secrets
- Consider using a service account for production deployments

## Production Deployment

For production, you'll need to:

1. Update the OAuth consent screen to "Published"
2. Add your production domain to authorized origins
3. Use HTTPS for all URLs
4. Consider using a service account instead of OAuth 2.0 for server-side operations

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure your Google Sheets has the correct structure
4. Check that the Google Sheets API is enabled in your project 