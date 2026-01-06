/**
 * Adapter Registry
 * ================
 * Central registry for all data adapters
 */

import { DataAdapter, AdapterRegistry } from '@/types/adapters';
import { CSVUploadAdapter, createCSVAdapter } from './csv';
import { GoogleSheetsAdapter, createGoogleSheetsAdapter } from './google-sheets';
import { GenericCRMAdapter, createGenericCRMAdapter } from './generic-crm';

// =============================================================================
// REGISTRY IMPLEMENTATION
// =============================================================================

class AdapterRegistryImpl implements AdapterRegistry {
  adapters = new Map<string, DataAdapter>();

  register(adapter: DataAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  get(type: string): DataAdapter | undefined {
    return this.adapters.get(type);
  }

  list(): DataAdapter[] {
    return Array.from(this.adapters.values());
  }
}

// =============================================================================
// GLOBAL REGISTRY
// =============================================================================

export const adapterRegistry = new AdapterRegistryImpl();

// Register built-in adapters
adapterRegistry.register(createCSVAdapter());
adapterRegistry.register(createGoogleSheetsAdapter());
adapterRegistry.register(createGenericCRMAdapter());

// =============================================================================
// EXPORTS
// =============================================================================

export { BaseAdapter } from './base';
export { CSVUploadAdapter, createCSVAdapter } from './csv';
export { GoogleSheetsAdapter, createGoogleSheetsAdapter } from './google-sheets';
export { GenericCRMAdapter, createGenericCRMAdapter } from './generic-crm';

/**
 * Get an adapter by type
 */
export function getAdapter(type: string): DataAdapter | undefined {
  return adapterRegistry.get(type);
}

/**
 * Get all registered adapters
 */
export function getAdapters(): DataAdapter[] {
  return adapterRegistry.list();
}

/**
 * Register a custom adapter
 */
export function registerAdapter(adapter: DataAdapter): void {
  adapterRegistry.register(adapter);
}

