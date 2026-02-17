/**
 * Google OAuth 2.0 Client
 * ========================
 * Handles OAuth flow for Google Sheets access
 * Uses OAuth 2.0 for user authentication (better than service account)
 */

import { google, Auth } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// OAuth 2.0 credentials from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/auth/google/callback`;

// Scopes needed for reading Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

/**
 * Create OAuth 2.0 client
 */
export function createOAuthClient(): OAuth2Client {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      'Google OAuth credentials not configured. ' +
      'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    );
  }

  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = createOAuthClient();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
    state: state || undefined,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const oauth2Client = createOAuthClient();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
  };
}

/**
 * Create authenticated Sheets client from tokens
 */
export function createSheetsClient(tokens: {
  access_token: string;
  refresh_token?: string;
}): Auth.OAuth2Client {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);
  
  return oauth2Client;
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expiry_date?: number }> {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date || undefined,
  };
}

/**
 * Get Sheets API client with OAuth authentication
 */
export function getAuthenticatedSheetsClient(tokens: {
  access_token: string;
  refresh_token?: string;
}) {
  const auth = createSheetsClient(tokens);
  return google.sheets({ version: 'v4', auth });
}
