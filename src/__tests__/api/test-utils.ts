/**
 * API Route Test Utilities
 * =========================
 * Helper functions for testing Next.js API routes
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing
 * Note: In Node.js test environment, NextRequest works differently
 */
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3002',
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: headers || {},
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
    requestInit.headers = {
      ...requestInit.headers,
      'Content-Type': 'application/json',
    };
  }

  const request = new NextRequest(url, requestInit);

  // Mock json() method if body is provided
  if (body !== undefined) {
    (request as any).json = jest.fn().mockResolvedValue(body);
  }

  return request;
}

/**
 * Create a mock NextRequest with search params
 */
export function createMockRequestWithParams(
  method: string = 'GET',
  path: string = '/api/test',
  searchParams?: Record<string, string>,
  body?: unknown
): NextRequest {
  const params = new URLSearchParams(searchParams);
  const url = `http://localhost:3002${path}${params.toString() ? `?${params.toString()}` : ''}`;
  return createMockRequest(method, url, body);
}

/**
 * Helper to extract JSON from NextResponse
 */
export async function getResponseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Helper to get response status
 */
export function getResponseStatus(response: Response): number {
  return response.status;
}
