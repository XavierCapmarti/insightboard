/**
 * @jest-environment node
 * 
 * Dataset Metrics API Route Tests
 * ================================
 * Tests for /api/dataset/[datasetId]/metrics endpoint
 */

import { GET } from '@/app/api/dataset/[datasetId]/metrics/route';
import { createMockRequestWithParams, getResponseJson, getResponseStatus } from './test-utils';
import { getDataset } from '@/lib/datasetStore';
import { createMetricsEngine, createPeriod } from '@/engine';
import { createFunnelEngine, inferStagesFromRecords } from '@/engine/funnel';

// Mock dependencies
jest.mock('@/lib/datasetStore');
jest.mock('@/engine');
jest.mock('@/engine/funnel');
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetDataset = getDataset as jest.MockedFunction<typeof getDataset>;
const mockCreateMetricsEngine = createMetricsEngine as jest.MockedFunction<typeof createMetricsEngine>;
const mockCreatePeriod = createPeriod as jest.MockedFunction<typeof createPeriod>;
const mockCreateFunnelEngine = createFunnelEngine as jest.MockedFunction<typeof createFunnelEngine>;
const mockInferStagesFromRecords = inferStagesFromRecords as jest.MockedFunction<typeof inferStagesFromRecords>;

describe('/api/dataset/[datasetId]/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCreatePeriod.mockReturnValue({
      type: 'month',
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    });
  });

  describe('GET', () => {
    const mockDataset = {
      id: 'test-dataset-id',
      records: [
        {
          id: '1',
          ownerId: 'user1',
          value: 1000,
          status: 'prospecting',
          metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-05'),
        },
        {
          id: '2',
          ownerId: 'user2',
          value: 2000,
          status: 'qualification',
          metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-06'),
        },
        {
          id: '3',
          ownerId: 'user1',
          value: 3000,
          status: 'won',
          metadata: { source: 'csv', sourceType: 'csv_upload', customFields: {} },
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-10'),
          closedAt: new Date('2024-01-10'),
        },
      ],
      stageEvents: [],
      actors: [],
      createdAt: new Date(),
      metadata: {
        sourceType: 'csv_upload',
        rowCount: 3,
        fieldMappings: [],
      },
    };

    it('should compute metrics for existing dataset', async () => {
      mockGetDataset.mockResolvedValue(mockDataset);
      
      mockInferStagesFromRecords.mockReturnValue(['prospecting', 'qualification', 'won']);
      
      const mockFunnelEngine = {
        compute: jest.fn().mockReturnValue({
          stages: [
            { stage: 'prospecting', count: 1, percentage: 33.3, conversionToNext: 66.7, dropOff: 33.3, averageTimeInStage: 4 },
            { stage: 'qualification', count: 1, percentage: 33.3, conversionToNext: 100, dropOff: 0, averageTimeInStage: 4 },
            { stage: 'won', count: 1, percentage: 33.3, conversionToNext: null, dropOff: null, averageTimeInStage: 7 },
          ],
          overallConversion: 33.3,
          averageCycleTime: 7,
        }),
      };
      
      mockCreateFunnelEngine.mockReturnValue(mockFunnelEngine as any);
      mockCreateMetricsEngine.mockReturnValue({} as any);

      const request = createMockRequestWithParams('GET', '/api/dataset/test-dataset-id/metrics', {
        period: 'month',
      });

      // Mock params
      const params = Promise.resolve({ datasetId: 'test-dataset-id' });
      const response = await GET(request, { params });
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.success).toBe(true);
      expect(data.datasetId).toBe('test-dataset-id');
      expect(data.metrics).toBeDefined();
      expect(data.funnel).toBeDefined();
      expect(mockGetDataset).toHaveBeenCalledWith('test-dataset-id');
    });

    it('should return 404 for non-existent dataset', async () => {
      mockGetDataset.mockResolvedValue(null);

      const request = createMockRequestWithParams('GET', '/api/dataset/non-existent/metrics', {
        period: 'month',
      });

      const params = Promise.resolve({ datasetId: 'non-existent' });
      const response = await GET(request, { params });
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(404);
      expect(data.error).toBe('Dataset not found');
      expect(data.message).toContain('re-upload');
    });

    it('should return 400 for dataset with no records', async () => {
      const emptyDataset = {
        ...mockDataset,
        records: [],
      };
      
      mockGetDataset.mockResolvedValue(emptyDataset);

      const request = createMockRequestWithParams('GET', '/api/dataset/empty-dataset/metrics', {
        period: 'month',
      });

      const params = Promise.resolve({ datasetId: 'empty-dataset' });
      const response = await GET(request, { params });
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('Dataset has no records');
      expect(data.message).toContain('field mappings');
    });

    it('should return 400 when no stages found', async () => {
      mockGetDataset.mockResolvedValue(mockDataset);
      mockInferStagesFromRecords.mockReturnValue([]);

      const request = createMockRequestWithParams('GET', '/api/dataset/test-dataset-id/metrics', {
        period: 'month',
      });

      const params = Promise.resolve({ datasetId: 'test-dataset-id' });
      const response = await GET(request, { params });
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(400);
      expect(data.error).toBe('No stages found in data');
      expect(data.message).toContain('Stage/Status field');
    });

    it('should handle different period types', async () => {
      const periods = ['day', 'week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        mockGetDataset.mockResolvedValue(mockDataset);
        mockInferStagesFromRecords.mockReturnValue(['prospecting', 'qualification', 'won']);
        
        mockCreatePeriod.mockReturnValue({
          type: period as any,
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        });
        
        const mockFunnelEngine = {
          compute: jest.fn().mockReturnValue({
            stages: [],
            overallConversion: 0,
            averageCycleTime: 0,
          }),
        };
        mockCreateFunnelEngine.mockReturnValue(mockFunnelEngine as any);
        mockCreateMetricsEngine.mockReturnValue({} as any);

        const request = createMockRequestWithParams('GET', `/api/dataset/test-dataset-id/metrics`, {
          period,
        });

        const params = Promise.resolve({ datasetId: 'test-dataset-id' });
        const response = await GET(request, { params });
        
        expect(getResponseStatus(response)).toBe(200);
        expect(mockCreatePeriod).toHaveBeenCalledWith(period);
      }
    });

    it('should handle invalid dates gracefully', async () => {
      const datasetWithInvalidDates = {
        ...mockDataset,
        records: [
          {
            ...mockDataset.records[0],
            createdAt: new Date('invalid'),
            updatedAt: new Date('invalid'),
          },
        ],
      };
      
      mockGetDataset.mockResolvedValue(datasetWithInvalidDates);
      mockInferStagesFromRecords.mockReturnValue(['prospecting']);
      
      const mockFunnelEngine = {
        compute: jest.fn().mockReturnValue({
          stages: [],
          overallConversion: 0,
          averageCycleTime: 0,
        }),
      };
      mockCreateFunnelEngine.mockReturnValue(mockFunnelEngine as any);
      mockCreateMetricsEngine.mockReturnValue({} as any);

      const request = createMockRequestWithParams('GET', '/api/dataset/test-dataset-id/metrics', {
        period: 'month',
      });

      const params = Promise.resolve({ datasetId: 'test-dataset-id' });
      const response = await GET(request, { params });

      // Should still succeed but log warning
      expect(getResponseStatus(response)).toBe(200);
    });

    it('should handle server errors gracefully', async () => {
      mockGetDataset.mockRejectedValue(new Error('Database error'));

      const request = createMockRequestWithParams('GET', '/api/dataset/test-dataset-id/metrics', {
        period: 'month',
      });

      const params = Promise.resolve({ datasetId: 'test-dataset-id' });
      const response = await GET(request, { params });
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(500);
      expect(data.error).toBe('Failed to compute metrics');
      expect(data.message).toBeDefined();
    });

    it('should include funnel metrics in response', async () => {
      mockGetDataset.mockResolvedValue(mockDataset);
      mockInferStagesFromRecords.mockReturnValue(['prospecting', 'qualification', 'won']);
      
      const mockFunnelEngine = {
        compute: jest.fn().mockReturnValue({
          stages: [
            { stage: 'prospecting', count: 1, percentage: 33.3, conversionToNext: 66.7, dropOff: 33.3, averageTimeInStage: 4 },
            { stage: 'qualification', count: 1, percentage: 33.3, conversionToNext: 100, dropOff: 0, averageTimeInStage: 4 },
            { stage: 'won', count: 1, percentage: 33.3, conversionToNext: null, dropOff: null, averageTimeInStage: 7 },
          ],
          overallConversion: 33.3,
          averageCycleTime: 7,
        }),
      };
      
      mockCreateFunnelEngine.mockReturnValue(mockFunnelEngine as any);
      mockCreateMetricsEngine.mockReturnValue({} as any);

      const request = createMockRequestWithParams('GET', '/api/dataset/test-dataset-id/metrics', {
        period: 'month',
      });

      const params = Promise.resolve({ datasetId: 'test-dataset-id' });
      const response = await GET(request, { params });
      const data = await getResponseJson(response);

      expect(getResponseStatus(response)).toBe(200);
      expect(data.funnel).toBeDefined();
      expect(data.funnel.stages).toBeDefined();
      expect(data.funnel.overallConversion).toBe(33.3);
      expect(data.funnel.averageCycleTime).toBe(7);
    });
  });
});
