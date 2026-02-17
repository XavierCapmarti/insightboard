/**
 * Dataset Store
 * =============
 * Hybrid storage: In-memory cache + file persistence
 * - Fast in-memory access for active datasets
 * - File persistence survives server restarts
 */

import { DataRecord, StageEvent, Actor } from '@/types/core';
import { saveDataset, loadDataset, deleteDatasetFile, listDatasetIds } from './fileStorage';
import { logger } from './logger';

export interface StoredDataset {
  id: string;
  records: DataRecord[];
  stageEvents: StageEvent[];
  actors: Actor[];
  createdAt: Date;
  metadata: {
    sourceType: string;
    rowCount: number;
    fieldMappings: Array<{ sourceField: string; targetField: string }>;
  };
}

// In-memory store (Map for O(1) lookup)
// NOTE: This is cleared on server restart. For production, use persistent storage.
// Use globalThis to persist across hot reloads in dev mode
const globalKey = '__clarLensDatasetStore__';

// Get or create the store (survives hot reloads)
function getStore(): Map<string, StoredDataset> {
  if (typeof globalThis !== 'undefined' && !(globalKey in globalThis)) {
    (globalThis as any)[globalKey] = new Map<string, StoredDataset>();
    logger.debug('Dataset store created', { timestamp: new Date().toISOString() });
  } else if (typeof globalThis !== 'undefined' && globalKey in globalThis) {
    const existing = (globalThis as any)[globalKey] as Map<string, StoredDataset>;
    logger.debug('Using existing dataset store', { datasetCount: existing.size, timestamp: new Date().toISOString() });
    return existing;
  }
  return (globalThis as any)[globalKey] as Map<string, StoredDataset>;
}

const datasets = getStore();

// Track when store was last cleared (for debugging)
let lastClearTime = Date.now();
let storeCreatedAt = Date.now();

// Get store creation time from global if available
if (typeof globalThis !== 'undefined' && '__clarLensStoreCreatedAt__' in globalThis) {
  storeCreatedAt = (globalThis as any)['__clarLensStoreCreatedAt__'];
} else if (typeof globalThis !== 'undefined') {
  (globalThis as any)['__clarLensStoreCreatedAt__'] = Date.now();
  storeCreatedAt = Date.now();
}

/**
 * Store a normalized dataset (in-memory + file persistence)
 */
export async function storeDataset(
  records: DataRecord[],
  stageEvents: StageEvent[],
  actors: Actor[],
  metadata: StoredDataset['metadata']
): Promise<string> {
  const datasetId = `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const dataset: StoredDataset = {
    id: datasetId,
    records,
    stageEvents,
    actors,
    createdAt: new Date(),
    metadata,
  };
  
  // Store in memory cache
  const store = getStore();
  store.set(datasetId, dataset);
  console.log(`[DatasetStore] ✓ Stored dataset ${datasetId} in memory`);
  console.log(`[DatasetStore]   - Records: ${records.length}`);
  console.log(`[DatasetStore]   - StageEvents: ${stageEvents.length}`);
  console.log(`[DatasetStore]   - Actors: ${actors.length}`);
  console.log(`[DatasetStore]   - Total datasets in store: ${store.size}`);
  
  // Persist to disk (async, survives server restart)
  try {
    await saveDataset(dataset);
    console.log(`[DatasetStore] ✓ Persisted dataset ${datasetId} to disk`);
  } catch (error) {
    console.error(`[DatasetStore] ✗ Failed to persist dataset ${datasetId} to disk:`, error);
    // Don't throw - in-memory storage still works
  }
  
  return datasetId;
}

/**
 * Get a stored dataset (checks memory cache first, then disk)
 */
export async function getDataset(datasetId: string): Promise<StoredDataset | null> {
  const store = getStore();
  console.log(`[DatasetStore] getDataset called for: ${datasetId}`);
  console.log(`[DatasetStore]   - Memory cache has ${store.size} datasets`);
  
  // Check memory cache first (fast path)
  const cached = store.get(datasetId);
  if (cached) {
    console.log(`[DatasetStore] ✓ Dataset found in memory: ${datasetId} (${cached.records.length} records)`);
    return cached;
  }
  
  // Not in memory - try loading from disk
  console.log(`[DatasetStore] Dataset ${datasetId} not in memory, checking disk...`);
  try {
    const fromDisk = await loadDataset(datasetId);
    if (fromDisk) {
      // Cache in memory for future requests
      store.set(datasetId, fromDisk);
      console.log(`[DatasetStore] ✓ Dataset loaded from disk and cached: ${datasetId} (${fromDisk.records.length} records)`);
      return fromDisk;
    }
  } catch (error) {
    console.error(`[DatasetStore] Error loading dataset ${datasetId} from disk:`, error);
  }
  
  console.error(`[DatasetStore] ✗ Dataset ${datasetId} NOT FOUND (memory or disk)`);
  return null;
}

/**
 * Delete a dataset (from memory and disk)
 */
export async function deleteDataset(datasetId: string): Promise<boolean> {
  const store = getStore();
  const deletedFromMemory = store.delete(datasetId);
  
  // Also delete from disk
  try {
    await deleteDatasetFile(datasetId);
  } catch (error) {
    console.error(`[DatasetStore] Error deleting dataset ${datasetId} from disk:`, error);
  }
  
  return deletedFromMemory;
}

/**
 * List all datasets (for debugging/admin)
 */
export function listDatasets(): Array<{ id: string; createdAt: Date; rowCount: number }> {
  const store = getStore();
  return Array.from(store.values()).map(d => ({
    id: d.id,
    createdAt: d.createdAt,
    rowCount: d.metadata.rowCount,
  }));
}

