import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppwriteService } from './services/appwrite.service';
import { PwaInstallComponent } from './components/pwa-install/pwa-install.component';
import { OfflinePageComponent } from './components/offline-page/offline-page.component';
import { PwaUpdateComponent } from './components/pwa-update/pwa-update.component';
import { PwaService } from './services/pwa.service';
import { OfflineStorageService } from './services/offline-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, RouterOutlet, PwaInstallComponent, OfflinePageComponent, PwaUpdateComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'HomeFinder_HOA';
  pingResult?: string;

  constructor(
    private appwriteService: AppwriteService,
    private pwaService: PwaService,
    private offlineStorage: OfflineStorageService
  ) {}

  ngOnInit(): void {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }

    // Listen for online event to trigger automatic sync
    window.addEventListener('online', () => {
      console.log('App detected online - triggering automatic sync');
      this.offlineStorage.syncPendingRequests().catch(err => {
        console.error('Auto-sync failed:', err);
      });
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private handleServiceWorkerMessage(data: any): void {
    if (data.type === 'AUTO_SYNC' || data.type === 'ONLINE') {
      console.log('Service worker requested sync:', data.message);
      // Automatically sync without user prompt
      this.offlineStorage.syncPendingRequests().catch(err => {
        console.error('Auto-sync failed:', err);
      });
    }
  }

  pingAppwrite(): void {
    this.pingResult = 'Pinging Appwrite...';
    this.appwriteService.ping().subscribe({
      next: (res) => {
        this.pingResult = `OK: ${JSON.stringify(res)}`;
      },
      error: (err) => {
        this.pingResult = `Error: ${err?.message ?? 'Unknown error'}`;
        // Also log to console for easier debugging
        console.error('Appwrite ping error', err);
      }
    });
  }
}