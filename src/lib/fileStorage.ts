/**
 * File-Based Dataset Storage
 * ==========================
 * Persists datasets to JSON files on disk
 * Survives server restarts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { StoredDataset } from './datasetStore';

const DATA_DIR = path.join(process.cwd(), 'data', 'datasets');

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('[FileStorage] Failed to create data directory:', error);
    throw error;
  }
}

/**
 * Get file path for a dataset
 */
function getDatasetPath(datasetId: string): string {
  return path.join(DATA_DIR, `${datasetId}.json`);
}

/**
 * Save dataset to file
 */
export async function saveDataset(dataset: StoredDataset): Promise<void> {
  await ensureDataDir();
  const filePath = getDatasetPath(dataset.id);
  
  // Convert dates to ISO strings for JSON serialization
  const serializable = {
    ...dataset,
    createdAt: dataset.createdAt.toISOString(),
    records: dataset.records.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      closedAt: r.closedAt?.toISOString(),
    })),
    stageEvents: dataset.stageEvents.map(e => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    })),
    actors: dataset.actors.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };
  
  await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf-8');
  console.log(`[FileStorage] ✓ Saved dataset ${dataset.id} to ${filePath}`);
}

/**
 * Load dataset from file
 */
export async function loadDataset(datasetId: string): Promise<StoredDataset | null> {
  const filePath = getDatasetPath(datasetId);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Convert ISO strings back to Date objects
    const dataset: StoredDataset = {
      ...data,
      createdAt: new Date(data.createdAt),
      records: data.records.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        closedAt: r.closedAt ? new Date(r.closedAt) : undefined,
      })),
      stageEvents: data.stageEvents.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      })),
      actors: data.actors.map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
      })),
    };
    
    console.log(`[FileStorage] ✓ Loaded dataset ${datasetId} (${dataset.records.length} records)`);
    return dataset;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`[FileStorage] Dataset ${datasetId} not found`);
      return null;
    }
    console.error(`[FileStorage] Error loading dataset ${datasetId}:`, error);
    throw error;
  }
}

/**
 * Delete dataset file
 */
export async function deleteDatasetFile(datasetId: string): Promise<boolean> {
  const filePath = getDatasetPath(datasetId);
  
  try {
    await fs.unlink(filePath);
    console.log(`[FileStorage] ✓ Deleted dataset ${datasetId}`);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    console.error(`[FileStorage] Error deleting dataset ${datasetId}:`, error);
    throw error;
  }
}

/**
 * List all dataset IDs
 */
export async function listDatasetIds(): Promise<string[]> {
  await ensureDataDir();
  
  try {
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('[FileStorage] Error listing datasets:', error);
    return [];
  }
}

/**
 * Load all datasets (for debugging/admin)
 */
export async function loadAllDatasets(): Promise<StoredDataset[]> {
  const ids = await listDatasetIds();
  const datasets: StoredDataset[] = [];
  
  for (const id of ids) {
    const dataset = await loadDataset(id);
    if (dataset) {
      datasets.push(dataset);
    }
  }
  
  return datasets;
}
