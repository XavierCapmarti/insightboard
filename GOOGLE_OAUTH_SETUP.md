# Google Sheets OAuth Setup Guide

## Overview

ClarLens now supports Google Sheets integration via OAuth 2.0, allowing users to connect their own Google accounts to access their spreadsheets.

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for public use)
   - App name: ClarLens
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Save and continue through the steps
4. Create OAuth client:
   - Application type: **Web application**
   - Name: ClarLens Web Client
   - Authorized redirect URIs:
     - `http://localhost:3002/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# App URL (for redirect URI)
NEXT_PUBLIC_APP_URL=http://localhost:3002
# Or for production:
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Usage

#### For Users:

1. Navigate to onboarding page
2. Select "Google Sheets" as data source
3. Click "Connect Google Sheets"
4. Authorize access in Google's OAuth flow
5. Paste spreadsheet URL or ID
6. Select sheet and range
7. Map fields and proceed

#### For Developers:

The OAuth flow works as follows:

1. **Initiate OAuth**: `/api/auth/google?returnUrl=/onboarding`
2. **User authorizes** on Google's consent screen
3. **Callback**: `/api/auth/google/callback` receives authorization code
4. **Exchange code** for access/refresh tokens
5. **Store tokens** (currently in session, should use secure storage in production)
6. **Use tokens** to access Google Sheets API

## API Endpoints

### GET `/api/auth/google`
Initiates OAuth flow. Redirects to Google.

**Query params:**
- `returnUrl` (optional): Where to redirect after auth

### GET `/api/auth/google/callback`
OAuth callback handler. Exchanges code for tokens.

**Query params:**
- `code`: Authorization code from Google
- `state`: CSRF protection token

## Security Notes

⚠️ **Current Implementation**: Tokens are passed via URL params (not secure)
✅ **Production**: Should use secure session storage or encrypted cookies

## Fallback to Service Account

If OAuth tokens are not provided, the adapter falls back to service account authentication (existing implementation). This allows backward compatibility.

## Testing

1. Set up OAuth credentials
2. Start dev server: `npm run dev`
3. Navigate to `/onboarding`
4. Select Google Sheets
5. Click "Connect Google Sheets"
6. Complete OAuth flow
7. Test fetching a spreadsheet

## Troubleshooting

### "OAuth credentials not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Restart dev server after adding env vars

### "Redirect URI mismatch"
- Ensure redirect URI in Google Console matches `NEXT_PUBLIC_APP_URL/api/auth/google/callback`
- Check for trailing slashes

### "Permission denied"
- User must grant access to Google Sheets
- Check that Google Sheets API is enabled in Cloud Console

### "Invalid grant"
- Refresh token may have expired
- User needs to re-authorize
