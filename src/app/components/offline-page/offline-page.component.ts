import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Small offline indicator when cached data is available -->
    <div class="offline-indicator" *ngIf="isOffline && hasCachedData && !shouldShowOfflinePage">
      <div class="offline-badge">
        <i class="fas fa-wifi-slash mr-2"></i>
        <span>Offline - Using cached data</span>
      </div>
    </div>

    <!-- Full offline page only when no cached data -->
    <div class="offline-container" *ngIf="shouldShowOfflinePage">
      <div class="offline-content">
        <div class="offline-icon">
          <i class="fas fa-wifi-slash text-red-500 text-6xl"></i>
        </div>
        
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-description">
          Don't worry! AthleTrack works offline too. Some features may be limited, but you can still:
        </p>
        
        <div class="offline-features">
          <div class="feature-item">
            <i class="fas fa-eye text-green-500"></i>
            <span>View cached class routines</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-calendar text-blue-500"></i>
            <span>Check your schedule</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-user text-purple-500"></i>
            <span>Access your profile</span>
          </div>
        </div>
        
        <div class="offline-actions">
          <button 
            (click)="retryConnection()" 
            class="retry-btn"
            [disabled]="isRetrying">
            <i class="fas fa-sync-alt mr-2" [class.animate-spin]="isRetrying"></i>
            {{ isRetrying ? 'Retrying...' : 'Try Again' }}
          </button>
        </div>
        
        <div class="offline-info" *ngIf="!isRetrying">
          <p class="text-sm text-gray-600">
            <i class="fas fa-info-circle mr-2"></i>
            Data will automatically sync when connection is restored
          </p>
        </div>
        
        <div class="offline-tips">
          <h3 class="tips-title">Offline Tips:</h3>
          <ul class="tips-list">
            <li>Make sure you have a stable internet connection</li>
            <li>Try refreshing the page</li>
            <li>Check if your device is in airplane mode</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      padding: 20px;
    }

    .offline-content {
      background: white;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .offline-icon {
      margin-bottom: 24px;
    }

    .offline-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }

    .offline-description {
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .offline-features {
      margin-bottom: 32px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      color: #374151;
    }

    .feature-item i {
      width: 20px;
      text-align: center;
    }

    .offline-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      justify-content: center;
    }

    .retry-btn, .update-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }

    .retry-btn {
      background: #3b82f6;
      color: white;
    }

    .retry-btn:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .retry-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .update-btn {
      background: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }

    .update-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .offline-tips {
      text-align: left;
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
    }

    .tips-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
    }

    .tips-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .tips-list li {
      color: #6b7280;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }

    .tips-list li:before {
      content: "•";
      color: #3b82f6;
      font-weight: bold;
      position: absolute;
      left: 0;
    }

    .tips-list li:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 640px) {
      .offline-content {
        padding: 24px;
        margin: 20px;
      }

      .offline-title {
        font-size: 1.5rem;
      }

      .offline-actions {
        flex-direction: column;
      }

      .retry-btn, .update-btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* Small offline indicator */
    .offline-indicator {
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    }

    .offline-badge {
      background: rgba(239, 68, 68, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .offline-indicator {
        top: 60px;
        right: 10px;
        left: 10px;
      }

      .offline-badge {
        justify-content: center;
        font-size: 0.75rem;
        padding: 6px 12px;
      }
    }
  `]
})
export class OfflinePageComponent implements OnInit, OnDestroy {
  isOffline = false;
  isRetrying = false;
  hasCachedData = false;
  shouldShowOfflinePage = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private pwaService: PwaService,
    private offlineStorage: OfflineStorageService
  ) {}

  ngOnInit(): void {
    // Subscribe to online/offline status
    this.subscriptions.push(
      this.pwaService.pwaStatus$.subscribe(status => {
        this.isOffline = !status.isOnline;
        this.checkCachedData();
      })
    );

    // Also listen to browser's online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.checkCachedData();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.checkCachedData();
    });

    // Initial check
    this.checkCachedData();
  }

  /**
   * Check if there's cached data available
   * Only show offline page if offline AND no cached data
   */
  private async checkCachedData(): Promise<void> {
    if (!this.isOffline) {
      // Online - don't show offline page
      this.shouldShowOfflinePage = false;
      this.hasCachedData = false;
      return;
    }

    // Offline - check if we have cached data
    try {
      let hasIndexedDBCache = false;
      let hasCacheAPICache = false;

      // Check IndexedDB for cached data
      try {
        // Check offlineData store
        const offlineDataKeys = await this.offlineStorage.getAllOfflineDataKeys();
        hasIndexedDBCache = offlineDataKeys.length > 0;
        
        // Also check cache store for API responses
        // Try to get a sample cached response from common endpoints
        const sampleKeys = [
          'appState',
          'GET:/api/routes.php?request=getClasses',
          'GET:/api/routes.php?request=getTotalStudents',
          'GET:/api/routes.php?request=getDailyStudentActivity'
        ];
        for (const key of sampleKeys) {
          const cached = await this.offlineStorage.getCachedData(key);
          if (cached) {
            hasIndexedDBCache = true;
            break;
          }
        }
        
        // Also check if we can access IndexedDB directly
        if ('indexedDB' in window) {
          try {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              const request = indexedDB.open('AthleTrackDB', 1);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            
            // Check cache store
            if (db.objectStoreNames.contains('cache')) {
              const transaction = db.transaction(['cache'], 'readonly');
              const store = transaction.objectStore('cache');
              const countRequest = store.count();
              const count = await new Promise<number>((resolve, reject) => {
                countRequest.onsuccess = () => resolve(countRequest.result);
                countRequest.onerror = () => reject(countRequest.error);
              });
              if (count > 0) {
                hasIndexedDBCache = true;
              }
            }
            
            db.close();
          } catch (e) {
            // Ignore direct IndexedDB access errors
          }
        }
      } catch (e) {
        console.log('IndexedDB check failed:', e);
      }
      
      // Check Cache API
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (cacheName.includes('athletrack') || cacheName.includes('dynamic') || cacheName.includes('static')) {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              if (keys.length > 0) {
                hasCacheAPICache = true;
                break;
              }
            }
          }
        } catch (e) {
          console.log('Cache API check failed:', e);
        }
      }

      this.hasCachedData = hasIndexedDBCache || hasCacheAPICache;

      // Only show offline page if we're offline AND have no cached data
      this.shouldShowOfflinePage = this.isOffline && !this.hasCachedData;
      
      if (this.hasCachedData && this.isOffline) {
        console.log('📦 Offline mode: Using cached data. App will continue to work.');
        console.log(`   IndexedDB Cache: ${hasIndexedDBCache ? 'Yes' : 'No'}`);
        console.log(`   Cache API: ${hasCacheAPICache ? 'Yes' : 'No'}`);
      } else if (this.isOffline && !this.hasCachedData) {
        console.log('⚠️  Offline mode: No cached data available. Showing offline page.');
      }
    } catch (error) {
      console.error('Error checking cached data:', error);
      // If we can't check, assume no cache and show offline page
      this.shouldShowOfflinePage = this.isOffline;
      this.hasCachedData = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async retryConnection(): Promise<void> {
    this.isRetrying = true;
    
    try {
      // Wait a bit to simulate retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we're back online
      if (navigator.onLine) {
        this.isOffline = false;
        // You could also trigger a page refresh here
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      this.isRetrying = false;
    }
  }

}

