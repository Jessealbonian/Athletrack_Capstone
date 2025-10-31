import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pwa-update',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="update-notification" *ngIf="showUpdateNotification">
      <div class="update-content">
        <div class="update-icon">
          <i class="fas fa-sync-alt text-blue-500 text-xl"></i>
        </div>
        
        <div class="update-text">
          <h3 class="update-title">Update Available</h3>
          <p class="update-description">A new version of AthleTrack is ready to install</p>
        </div>
        
        <div class="update-actions">
          <button 
            (click)="updateNow()" 
            class="update-btn"
            [disabled]="isUpdating">
            <i class="fas fa-download mr-2" [class.animate-spin]="isUpdating"></i>
            {{ isUpdating ? 'Updating...' : 'Update Now' }}
          </button>
          
          <button 
            (click)="dismissUpdate()" 
            class="dismiss-btn">
            Later
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .update-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
      z-index: 10000;
      max-width: 400px;
      width: 90%;
    }

    .update-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .update-icon {
      text-align: center;
      margin-bottom: 8px;
    }

    .update-text {
      text-align: center;
    }

    .update-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    .update-description {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0;
    }

    .update-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .update-btn, .dismiss-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      font-size: 0.9rem;
    }

    .update-btn {
      background: #3b82f6;
      color: white;
      flex: 2;
    }

    .update-btn:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .update-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .dismiss-btn {
      background: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      flex: 1;
    }

    .dismiss-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    @media (max-width: 640px) {
      .update-notification {
        top: 10px;
        left: 10px;
        right: 10px;
        transform: none;
        width: auto;
      }

      .update-actions {
        flex-direction: column;
      }

      .update-btn, .dismiss-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PwaUpdateComponent implements OnInit, OnDestroy {
  showUpdateNotification = false;
  isUpdating = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.showUpdateNotification = true;
      });
    }

    // Subscribe to PWA status for updates
    this.subscriptions.push(
      this.pwaService.pwaStatus$.subscribe(status => {
        if (status.hasUpdate) {
          this.showUpdateNotification = true;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async updateNow(): Promise<void> {
    this.isUpdating = true;
    
    try {
      await this.pwaService.forceUpdate();
      // The page will reload automatically after the update
    } catch (error) {
      console.error('Update failed:', error);
      this.isUpdating = false;
      // Show error message
      alert('Update failed. Please refresh the page manually.');
    }
  }

  dismissUpdate(): void {
    this.showUpdateNotification = false;
    // Store dismissal preference
    localStorage.setItem('pwa-update-dismissed', Date.now().toString());
  }
}

