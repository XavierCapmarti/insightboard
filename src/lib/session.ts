/**
 * Secure Session Management
 * =========================
 * Handles secure storage and retrieval of OAuth tokens using encrypted cookies
 * 
 * Security Features:
 * - httpOnly cookies (not accessible via JavaScript)
 * - Secure flag (HTTPS only in production)
 * - SameSite protection (CSRF prevention)
 * - Encryption using AES-256-GCM
 * - Token expiration handling
 */

import { cookies } from 'next/headers';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const SESSION_COOKIE_NAME = 'clarlens_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface SessionTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

/**
 * Get encryption key from environment
 * Falls back to a default in development (not secure for production)
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SESSION_SECRET environment variable is required in production. ' +
        'Generate a secure random string (32+ characters) and add it to .env.local'
      );
    }
    // Development fallback - warn user
    console.warn(
      '⚠️  SESSION_SECRET not set. Using default (insecure for production). ' +
      'Set SESSION_SECRET in .env.local for secure token storage.'
    );
    return createHash('sha256').update('dev-secret-key-change-in-production').digest();
  }
  
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypt session data
 */
function encrypt(data: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt session data
 */
function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
function isTokenExpired(expiryDate?: number): boolean {
  if (!expiryDate) {
    return false; // No expiry date, assume valid
  }
  
  // Consider expired if within 5 minutes of expiry
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= (expiryDate - bufferTime);
}

/**
 * Store OAuth tokens in secure session cookie
 */
export async function setSessionTokens(tokens: SessionTokens): Promise<void> {
  const cookieStore = await cookies();
  
  // Encrypt tokens
  const encrypted = encrypt(JSON.stringify(tokens));
  
  // Set secure cookie
  cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Retrieve OAuth tokens from secure session cookie
 * Returns null if no session exists or token is invalid
 */
export async function getSessionTokens(): Promise<SessionTokens | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const decrypted = decrypt(sessionCookie.value);
    const tokens: SessionTokens = JSON.parse(decrypted);
    
    // Check if token is expired
    if (isTokenExpired(tokens.expiry_date)) {
      // Token expired, but we might have refresh token
      if (!tokens.refresh_token) {
        // No refresh token, clear session
        await clearSession();
        return null;
      }
      // Return tokens anyway - caller should refresh
      return tokens;
    }
    
    return tokens;
  } catch (error) {
    console.error('Failed to decrypt session:', error);
    // Invalid session, clear it
    await clearSession();
    return null;
  }
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user has an active session
 */
export async function hasActiveSession(): Promise<boolean> {
  const tokens = await getSessionTokens();
  return tokens !== null;
}

/**
 * Get access token, refreshing if needed
 * Returns null if no valid session or refresh fails
 */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getSessionTokens();
  
  if (!tokens) {
    return null;
  }
  
  // If token is not expired, return it
  if (!isTokenExpired(tokens.expiry_date)) {
    return tokens.access_token;
  }
  
  // Token expired, try to refresh
  if (!tokens.refresh_token) {
    await clearSession();
    return null;
  }
  
  // Refresh token logic would be called here
  // For now, return null - caller should handle refresh
  // TODO: Implement automatic refresh in API routes
  return null;
}
