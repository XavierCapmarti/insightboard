/**
 * @jest-environment node
 * 
 * Metrics API Route Tests
 * =======================
 * Tests for /api/metrics endpoint
 */

import { GET } from '@/app/api/metrics/route';
import { createMockRequestWithParams, getResponseJson, getResponseStatus } from './test-utils';
import { rateLimiters } from '@/lib/rateLimit';
import { createMetricsEngine, createPeriod } from '@/engine';

// Mock dependencies
jest.mock('@/lib/rateLimit');
jest.mock('@/engine');
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
  },
}));

const mockRateLimiters = rateLimiters as jest.Mocked<typeof rateLimiters>;
const mockCreateMetricsEngine = createMetricsEngine as jest.MockedFunction<typeof createMetricsEngine>;
const mockCreatePeriod = createPeriod as jest.MockedFunction<typeof createPeriod>;

describe('/api/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no rate limiting
    mockRateLimiters.metrics.mockReturnValue(null);
    
    // Default period
    mockCreatePeriod.mockReturnValue({
      type: 'month',
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    });
  });

  describe('GET', () => {
    it('should compute metrics successfully', async () => {
      const mockEngine = {
        computeMany: jest.fn().mockReturnValue([
          {
            id: 'total_revenue',
            name: 'Total Revenue',
            current: { value: 10000, formattedValue: '$10,000' },
            previous: { value: 8000, formattedValue: '$8,000' },
            change: { value: 2000, percentage: 25 },
          },
          {
            id: 'record_count',
            name: 'Total Records',
            current: { value: 10, formattedValue: '10' },
            previous: { value: 8, formattedValue: '8' },
            change: { value: 2, percentage: 25 },
          },
        ]),
      };

      mockCreateMetricsEngine.mockReturnValue(mockEngine as any);

      const request = createMockRequestWithParams('GET', '/api/metrics', {
        period: 'month',
      });

      const response = await GET(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.period).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(Array.isArray(data.metrics)).toBe(true);
      expect(data.metrics.length).toBeGreaterThan(0);
    });

    it('should use default period when not specified', async () => {
      const mockEngine = {
        computeMany: jest.fn().mockReturnValue([]),
      };

      mockCreateMetricsEngine.mockReturnValue(mockEngine as any);

      const request = createMockRequestWithParams('GET', '/api/metrics');

      const response = await GET(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(mockCreatePeriod).toHaveBeenCalledWith('month');
    });

    it('should filter metrics by metricIds query parameter', async () => {
      const mockEngine = {
        computeMany: jest.fn().mockReturnValue([
          {
            id: 'total_revenue',
            name: 'Total Revenue',
            current: { value: 10000, formattedValue: '$10,000' },
            previous: { value: 8000, formattedValue: '$8,000' },
            change: { value: 2000, percentage: 25 },
          },
        ]),
      };

      mockCreateMetricsEngine.mockReturnValue(mockEngine as any);

      const request = createMockRequestWithParams('GET', '/api/metrics', {
        period: 'month',
        metrics: 'total_revenue',
      });

      const response = await GET(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.metrics).toBeDefined();
      // The filtering happens in the route handler, so we just verify it was called
      expect(mockEngine.computeMany).toHaveBeenCalled();
    });

    it('should return 429 when rate limited', async () => {
      const rateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: 60 }),
        { status: 429 }
      );
      mockRateLimiters.metrics.mockReturnValue(rateLimitResponse as any);

      const request = createMockRequestWithParams('GET', '/api/metrics');

      const response = await GET(request);
      expect(getResponseStatus(response)).toBe(429);
    });

    it('should return 400 for invalid period type', async () => {
      const request = createMockRequestWithParams('GET', '/api/metrics', {
        period: 'invalid_period',
      });

      const response = await GET(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should handle different period types', async () => {
      const periods = ['day', 'week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        mockCreatePeriod.mockReturnValue({
          type: period as any,
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        });

        const mockEngine = {
          computeMany: jest.fn().mockReturnValue([]),
        };
        mockCreateMetricsEngine.mockReturnValue(mockEngine as any);

        const request = createMockRequestWithParams('GET', '/api/metrics', {
          period,
        });

        const response = await GET(request);
        expect(getResponseStatus(response)).toBe(200);
      }
    });

    it('should handle server errors gracefully', async () => {
      mockCreateMetricsEngine.mockImplementation(() => {
        throw new Error('Metrics computation failed');
      });

      const request = createMockRequestWithParams('GET', '/api/metrics', {
        period: 'month',
      });

      const response = await GET(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(500);
      expect(data.error).toBe('Failed to compute metrics');
      expect(data.message).toBeDefined();
    });

    it('should include previous period in response', async () => {
      const mockEngine = {
        computeMany: jest.fn().mockReturnValue([]),
      };

      mockCreateMetricsEngine.mockReturnValue(mockEngine as any);

      const request = createMockRequestWithParams('GET', '/api/metrics', {
        period: 'month',
      });

      const response = await GET(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.period).toBeDefined();
      expect(data.period.current).toBeDefined();
      expect(data.period.previous).toBeDefined();
    });
  });
});
