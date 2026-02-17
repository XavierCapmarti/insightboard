/**
 * @jest-environment node
 * 
 * Ingest API Route Tests
 * ======================
 * Tests for /api/ingest endpoint
 */

import { POST } from '@/app/api/ingest/route';
import { createMockRequest, getResponseJson, getResponseStatus } from './test-utils';
import { storeDataset } from '@/lib/datasetStore';
import { getAdapter } from '@/adapters';
import { rateLimiters } from '@/lib/rateLimit';

// Mock dependencies
jest.mock('@/lib/datasetStore');
jest.mock('@/adapters');
jest.mock('@/lib/rateLimit');
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
  },
}));

const mockStoreDataset = storeDataset as jest.MockedFunction<typeof storeDataset>;
const mockGetAdapter = getAdapter as jest.MockedFunction<typeof getAdapter>;
const mockRateLimiters = rateLimiters as jest.Mocked<typeof rateLimiters>;

describe('/api/ingest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no rate limiting
    mockRateLimiters.ingest.mockReturnValue(null);
  });

  describe('POST', () => {
    it('should successfully ingest CSV data', async () => {
      const csvContent = `id,name,value,status,created_at
1,Deal A,1000,prospecting,2024-01-01
2,Deal B,2000,qualification,2024-01-02`;

      const mockAdapter = {
        ingest: jest.fn().mockResolvedValue({
          success: true,
          data: {
            headers: ['id', 'name', 'value', 'status', 'created_at'],
            rows: [
              { id: '1', name: 'Deal A', value: '1000', status: 'prospecting', created_at: '2024-01-01' },
              { id: '2', name: 'Deal B', value: '2000', status: 'qualification', created_at: '2024-01-02' },
            ],
          },
          rowCount: 2,
          warnings: [],
          metadata: {},
        }),
        normalise: jest.fn().mockResolvedValue({
          records: [
            {
              id: '1',
              ownerId: '',
              value: 1000,
              status: 'prospecting',
              metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            {
              id: '2',
              ownerId: '',
              value: 2000,
              status: 'qualification',
              metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
              createdAt: new Date('2024-01-02'),
              updatedAt: new Date('2024-01-02'),
            },
          ],
          stageEvents: [],
          actors: [],
          transformErrors: [],
          unmappedFields: [],
        }),
        detectSchema: jest.fn().mockResolvedValue({
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'value', type: 'number' },
            { name: 'status', type: 'string' },
            { name: 'created_at', type: 'date' },
          ],
        }),
      };

      mockGetAdapter.mockReturnValue(mockAdapter as any);
      mockStoreDataset.mockResolvedValue('test-dataset-id');

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'csv_upload',
        content: csvContent,
        config: {
          fieldMappings: [
            { sourceField: 'status', targetField: 'status' },
            { sourceField: 'created_at', targetField: 'createdAt' },
            { sourceField: 'value', targetField: 'value' },
          ],
        },
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.success).toBe(true);
      expect(data.datasetId).toBe('test-dataset-id');
      expect(data.rowCount).toBe(2);
      expect(mockAdapter.ingest).toHaveBeenCalled();
      expect(mockAdapter.normalise).toHaveBeenCalled();
      expect(mockStoreDataset).toHaveBeenCalled();
    });

    it('should return 429 when rate limited', async () => {
      const rateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: 60 }),
        { status: 429 }
      );
      mockRateLimiters.ingest.mockReturnValue(rateLimitResponse as any);

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'csv_upload',
        content: 'test',
      });

      const response = await POST(request);
      expect(getResponseStatus(response)).toBe(429);
    });

    it('should return 400 for invalid request body', async () => {
      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        // Missing required sourceType
        content: 'test',
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for unknown source type', async () => {
      mockGetAdapter.mockReturnValue(null);

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'unknown_source',
        content: 'test',
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('Unsupported data source');
      expect(data.supportedTypes).toBeDefined();
    });

    it('should return 400 when ingestion fails', async () => {
      const mockAdapter = {
        ingest: jest.fn().mockResolvedValue({
          success: false,
          error: 'Invalid CSV format',
          warnings: [],
        }),
      };

      mockGetAdapter.mockReturnValue(mockAdapter as any);

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'csv_upload',
        content: 'invalid,csv',
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('Invalid CSV format');
    });

    it('should return 400 when no records are normalized', async () => {
      const mockAdapter = {
        ingest: jest.fn().mockResolvedValue({
          success: true,
          data: {
            headers: ['id', 'name'],
            rows: [{ id: '1', name: 'Test' }],
          },
          rowCount: 1,
          warnings: [],
          metadata: {},
        }),
        normalise: jest.fn().mockResolvedValue({
          records: [],
          stageEvents: [],
          actors: [],
          transformErrors: [{ row: 0, field: 'status', error: 'Missing required field' }],
          unmappedFields: ['status'],
        }),
      };

      mockGetAdapter.mockReturnValue(mockAdapter as any);

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'csv_upload',
        content: 'id,name\n1,Test',
        config: {
          fieldMappings: [],
        },
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('No records could be processed');
      expect(data.message).toContain('no records could be normalized');
    });

    it('should handle server errors gracefully', async () => {
      mockGetAdapter.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'csv_upload',
        content: 'test',
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(500);
      expect(data.error).toBe('Data ingestion failed');
      expect(data.message).toBeDefined();
    });

    it('should include schema in response', async () => {
      const mockAdapter = {
        ingest: jest.fn().mockResolvedValue({
          success: true,
          data: {
            headers: ['id', 'name', 'value'],
            rows: [{ id: '1', name: 'Test', value: '100' }],
          },
          rowCount: 1,
          warnings: [],
          metadata: {},
        }),
        normalise: jest.fn().mockResolvedValue({
          records: [
            {
              id: '1',
              ownerId: '',
              value: 100,
              status: 'prospecting',
              metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          stageEvents: [],
          actors: [],
          transformErrors: [],
          unmappedFields: [],
        }),
        detectSchema: jest.fn().mockResolvedValue({
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'value', type: 'number' },
          ],
        }),
      };

      mockGetAdapter.mockReturnValue(mockAdapter as any);
      mockStoreDataset.mockResolvedValue('test-dataset-id');

      const request = createMockRequest('POST', 'http://localhost:3002/api/ingest', {
        sourceType: 'csv_upload',
        content: 'id,name,value\n1,Test,100',
        config: {
          fieldMappings: [
            { sourceField: 'status', targetField: 'status' },
          ],
        },
      });

      const response = await POST(request);
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.schema).toBeDefined();
      expect(data.schema.fields).toBeDefined();
      expect(mockAdapter.detectSchema).toHaveBeenCalled();
    });
  });
});
