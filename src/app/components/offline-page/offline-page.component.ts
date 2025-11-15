import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-container" *ngIf="isOffline">
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
  `]
})
export class OfflinePageComponent implements OnInit, OnDestroy {
  isOffline = false;
  isRetrying = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Subscribe to online/offline status
    this.subscriptions.push(
      this.pwaService.pwaStatus$.subscribe(status => {
        this.isOffline = !status.isOnline;
      })
    );

    // Also listen to browser's online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
    });
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

