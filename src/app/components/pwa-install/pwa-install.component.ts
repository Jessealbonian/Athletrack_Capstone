import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService, PWAStatus } from '../../services/pwa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pwa-install-container" *ngIf="shouldShowInstall">
      <div class="pwa-install-card">
        <div class="pwa-install-header">
          <div class="pwa-install-icon">
            <i class="fas fa-download text-purple-600 text-2xl"></i>
          </div>
          <div class="pwa-install-title">
            <h3 class="text-lg font-semibold text-gray-800">Install AthleTrack</h3>
            <p class="text-sm text-gray-600">Get the full app experience</p>
          </div>
        </div>
        
        <div class="pwa-install-benefits">
          <div class="benefit-item">
            <i class="fas fa-mobile-alt text-green-500"></i>
            <span class="text-sm text-gray-700">Access from home screen</span>
          </div>
          <div class="benefit-item">
            <i class="fas fa-wifi text-blue-500"></i>
            <span class="text-sm text-gray-700">Works offline</span>
          </div>
          <div class="benefit-item">
            <i class="fas fa-bell text-orange-500"></i>
            <span class="text-sm text-gray-700">Push notifications</span>
          </div>
        </div>

        <div class="pwa-install-actions">
          <button 
            (click)="installApp()" 
            class="install-btn"
            [disabled]="isInstalling">
            <i class="fas fa-download mr-2"></i>
            {{ isInstalling ? 'Installing...' : 'Install App' }}
          </button>
          <button 
            (click)="dismissInstall()" 
            class="dismiss-btn">
            Not now
          </button>
        </div>
      </div>
    </div>

    <!-- PWA Status Indicator -->
    <div class="pwa-status" *ngIf="pwaStatus">
      <div class="status-item" [class]="pwaStatus.isOnline ? 'online' : 'offline'">
        <i class="fas" [class.fa-wifi]="pwaStatus.isOnline" [class.fa-wifi-slash]="!pwaStatus.isOnline"></i>
        <span class="text-xs">{{ pwaStatus.isOnline ? 'Online' : 'Offline' }}</span>
      </div>
      
      <div class="status-item" *ngIf="pwaStatus.isInstalled">
        <i class="fas fa-check-circle text-green-500"></i>
        <span class="text-xs">Installed</span>
      </div>
      
      <div class="status-item" *ngIf="pwaStatus.hasUpdate">
        <i class="fas fa-sync-alt text-blue-500 animate-spin"></i>
        <span class="text-xs">Update Available</span>
      </div>
    </div>
  `,
  styles: [`
    .pwa-install-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
    }

    .pwa-install-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 20px;
      border: 1px solid #e5e7eb;
    }

    .pwa-install-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .pwa-install-icon {
      width: 48px;
      height: 48px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pwa-install-title h3 {
      margin: 0;
      line-height: 1.2;
    }

    .pwa-install-title p {
      margin: 4px 0 0 0;
      line-height: 1.2;
    }

    .pwa-install-benefits {
      margin-bottom: 20px;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .benefit-item i {
      width: 16px;
      text-align: center;
    }

    .pwa-install-actions {
      display: flex;
      gap: 12px;
    }

    .install-btn {
      flex: 1;
      background: #735DA5;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .install-btn:hover:not(:disabled) {
      background: #5a4a7a;
      transform: translateY(-1px);
    }

    .install-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .dismiss-btn {
      background: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dismiss-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .pwa-status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      top: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      padding: 8px 12px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-size: 12px;
    }

    .status-item.online {
      border-left: 3px solid #10b981;
    }

    .status-item.offline {
      border-left: 3px solid #ef4444;
    }

    .status-item i {
      width: 16px;
      text-align: center;
    }

    @media (max-width: 640px) {
      .pwa-install-container {
        bottom: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .pwa-status {
        top: 10px;
        right: 10px;
      }
    }
  `]
})
export class PwaInstallComponent implements OnInit, OnDestroy {
  shouldShowInstall = false;
  isInstalling = false;
  pwaStatus: PWAStatus | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Subscribe to install prompt
    this.subscriptions.push(
      this.pwaService.installPrompt$.subscribe(prompt => {
        this.shouldShowInstall = !!prompt;
      })
    );

    // Subscribe to PWA status
    this.subscriptions.push(
      this.pwaService.pwaStatus$.subscribe(status => {
        this.pwaStatus = status;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async installApp(): Promise<void> {
    this.isInstalling = true;
    
    try {
      const success = await this.pwaService.showInstallPrompt();
      if (success) {
        this.shouldShowInstall = false;
        // Show success message
        this.showSuccessMessage();
      }
    } catch (error) {
      console.error('Installation failed:', error);
      // Show error message
      this.showErrorMessage();
    } finally {
      this.isInstalling = false;
    }
  }

  dismissInstall(): void {
    this.shouldShowInstall = false;
    // Store dismissal preference
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  private showSuccessMessage(): void {
    // You can implement a toast notification here
    console.log('App installed successfully!');
  }

  private showErrorMessage(): void {
    // You can implement a toast notification here
    console.error('App installation failed!');
  }
}
