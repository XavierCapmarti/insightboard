/**
 * CSRF Protection Utility
 * =======================
 * Prevents Cross-Site Request Forgery attacks by validating tokens on state-changing requests
 *
 * How it works:
 * 1. Server generates a unique CSRF token and stores it in a cookie
 * 2. Client includes this token in the request header (X-CSRF-Token)
 * 3. Server validates the token matches the cookie before processing the request
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';

const CSRF_COOKIE_NAME = 'clarlens_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create HMAC signature of token for validation
 */
function signToken(token: string): string {
  const secret = process.env.SESSION_SECRET || 'dev-csrf-secret';
  return createHmac('sha256', secret)
    .update(token)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
function verifyToken(token: string, signature: string): boolean {
  const expectedSignature = signToken(token);

  // Timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Generate and set CSRF token cookie
 * Returns the token for inclusion in response/forms
 */
export async function generateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = generateToken();
  const signature = signToken(token);

  // Store signed token in cookie
  const cookieValue = `${token}:${signature}`;

  cookieStore.set(CSRF_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_MAX_AGE,
    path: '/',
  });

  return token;
}

/**
 * Get current CSRF token from cookie
 * Returns null if no token exists
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME);

  if (!csrfCookie?.value) {
    return null;
  }

  const [token] = csrfCookie.value.split(':');
  return token || null;
}

/**
 * Validate CSRF token from request
 * Checks that token in header matches token in cookie
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME);

  if (!csrfCookie?.value) {
    return false;
  }

  const [cookieToken, signature] = csrfCookie.value.split(':');

  if (!cookieToken || !signature) {
    return false;
  }

  // Verify signature
  if (!verifyToken(cookieToken, signature)) {
    return false;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!headerToken) {
    return false;
  }

  // Timing-safe comparison
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Middleware to protect API routes from CSRF attacks
 * Use this for all state-changing operations (POST, PUT, DELETE, PATCH)
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfError = await requireCsrfToken(request);
 *   if (csrfError) return csrfError;
 *
 *   // Process request...
 * }
 * ```
 */
export async function requireCsrfToken(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF check for GET, HEAD, OPTIONS (safe methods)
  const method = request.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  // Validate token
  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        message: 'CSRF token is missing or invalid. Please refresh the page and try again.',
        code: 'CSRF_VALIDATION_FAILED',
      },
      { status: 403 }
    );
  }

  return null; // Valid, proceed with request
}

/**
 * API route to get CSRF token for client-side requests
 * Call this from the frontend before making state-changing requests
 */
export async function getCsrfTokenForClient(): Promise<string> {
  const existingToken = await getCsrfToken();

  if (existingToken) {
    return existingToken;
  }

  return generateCsrfToken();
}
