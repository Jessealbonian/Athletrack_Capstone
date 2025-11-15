import { Injectable } from '@angular/core';

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

interface PendingSync {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: any;
  timestamp: number;
  retries: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private dbName = 'AthleTrackDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly SYNC_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineData')) {
          const dataStore = db.createObjectStore('offlineData', { keyPath: 'key' });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Wait for DB to be ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    await this.initDB();
    if (!this.db) throw new Error('Failed to initialize IndexedDB');
    return this.db;
  }

  /**
   * Save data to cache
   */
  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const cachedItem: CachedData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined
      };

      await store.put(cachedItem);
      console.log(`Data cached: ${key}`);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result as CachedData | undefined;
          if (!result) {
            resolve(null);
            return;
          }

          // Check if expired
          if (result.expiresAt && Date.now() > result.expiresAt) {
            this.removeCachedData(key);
            resolve(null);
            return;
          }

          resolve(result.data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Remove cached data
   */
  async removeCachedData(key: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.delete(key);
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Save data for offline use (freeze state)
   */
  async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');

      const offlineItem = {
        key,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        timestamp: Date.now()
      };

      await store.put(offlineItem);
      console.log(`Offline data saved: ${key}`);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  /**
   * Get offline data
   */
  async getOfflineData(key: string): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  /**
   * Get all offline data keys
   */
  async getAllOfflineDataKeys(): Promise<string[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => {
          resolve(request.result as string[]);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting offline data keys:', error);
      return [];
    }
  }

  /**
   * Queue a request for sync when online
   */
  async queueForSync(url: string, method: string, body?: any, headers?: any): Promise<string> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');

      const syncItem: PendingSync = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        method,
        body,
        headers,
        timestamp: Date.now(),
        retries: 0
      };

      await store.put(syncItem);
      console.log(`Request queued for sync: ${syncItem.id}`);
      return syncItem.id;
    } catch (error) {
      console.error('Error queueing for sync:', error);
      throw error;
    }
  }

  /**
   * Get all pending sync requests
   */
  async getPendingSyncs(): Promise<PendingSync[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result as PendingSync[]);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting pending syncs:', error);
      return [];
    }
  }

  /**
   * Remove a pending sync request
   */
  async removePendingSync(id: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      await store.delete(id);
    } catch (error) {
      console.error('Error removing pending sync:', error);
    }
  }

  /**
   * Clear all pending syncs
   */
  async clearPendingSyncs(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      await store.clear();
      console.log('Pending syncs cleared');
    } catch (error) {
      console.error('Error clearing pending syncs:', error);
    }
  }

  /**
   * Sync all pending requests (called automatically when online)
   */
  async syncPendingRequests(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Still offline, cannot sync');
      return;
    }

    const pendingSyncs = await this.getPendingSyncs();
    if (pendingSyncs.length === 0) {
      console.log('No pending syncs');
      return;
    }

    console.log(`Syncing ${pendingSyncs.length} pending requests...`);

    for (const syncItem of pendingSyncs) {
      try {
        const response = await fetch(syncItem.url, {
          method: syncItem.method,
          body: syncItem.body ? JSON.stringify(syncItem.body) : undefined,
          headers: {
            'Content-Type': 'application/json',
            ...syncItem.headers
          }
        });

        if (response.ok) {
          await this.removePendingSync(syncItem.id);
          console.log(`Successfully synced: ${syncItem.id}`);
        } else {
          syncItem.retries++;
          if (syncItem.retries >= this.MAX_RETRIES) {
            await this.removePendingSync(syncItem.id);
            console.error(`Max retries reached for: ${syncItem.id}`);
          } else {
            // Update retry count
            const db = await this.ensureDB();
            const transaction = db.transaction(['pendingSync'], 'readwrite');
            const store = transaction.objectStore('pendingSync');
            await store.put(syncItem);
          }
        }
      } catch (error) {
        console.error(`Error syncing ${syncItem.id}:`, error);
        syncItem.retries++;
        if (syncItem.retries >= this.MAX_RETRIES) {
          await this.removePendingSync(syncItem.id);
        } else {
          const db = await this.ensureDB();
          const transaction = db.transaction(['pendingSync'], 'readwrite');
          const store = transaction.objectStore('pendingSync');
          await store.put(syncItem);
        }
      }
    }
  }
}

