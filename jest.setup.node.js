/**
 * Jest setup for Node.js environment (API route tests)
 */
import '@testing-library/jest-dom';

// Mock Next.js server components
global.Request = global.Request || require('undici').Request;
global.Response = global.Response || require('undici').Response;
global.Headers = global.Headers || require('undici').Headers;
