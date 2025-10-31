import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private installPromptSource = new BehaviorSubject<PWAInstallPrompt | null>(null);
  private pwaStatusSource = new BehaviorSubject<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    version: '1.0.0'
  });

  public installPrompt$ = this.installPromptSource.asObservable();
  public pwaStatus$ = this.pwaStatusSource.asObservable();

  constructor() {
    this.initializePWA();
  }

  private initializePWA(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as unknown as PWAInstallPrompt;
      this.installPromptSource.next(this.deferredPrompt);
      this.updatePWAStatus({ isInstallable: true });
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.updatePWAStatus({ isInstalled: true, isInstallable: false });
      this.deferredPrompt = null;
      this.installPromptSource.next(null);
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updatePWAStatus({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.updatePWAStatus({ isOnline: false });
    });

    // Check if app is already installed
    this.checkIfInstalled();
  }

  /**
   * Show the install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.deferredPrompt = null;
        this.installPromptSource.next(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Check if the app is already installed
   */
  private checkIfInstalled(): void {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      this.updatePWAStatus({ isInstalled: true, isInstallable: false });
    }
  }

  /**
   * Update PWA status
   */
  private updatePWAStatus(updates: Partial<PWAStatus>): void {
    const currentStatus = this.pwaStatusSource.value;
    const newStatus = { ...currentStatus, ...updates };
    this.pwaStatusSource.next(newStatus);
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return true;
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }
    return false;
  }

  /**
   * Force update the service worker
   */
  async forceUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (error) {
        console.error('Error forcing update:', error);
      }
    }
  }

  /**
   * Get current PWA status
   */
  getCurrentStatus(): PWAStatus {
    return this.pwaStatusSource.value;
  }

  /**
   * Check if PWA is supported
   */
  isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  /**
   * Check notification permission
   */
  getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  /**
   * Show a notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<Notification | null> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/assets/Logo.png',
          badge: '/assets/Logo.png',
          ...options
        });
        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<PushSubscription | null> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey as BufferSource
        });
        return subscription;
      } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Convert VAPID public key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get service worker registration
   */
  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration || null;
      } catch (error) {
        console.error('Error getting service worker registration:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Unregister service worker
   */
  async unregisterServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          return true;
        }
      } catch (error) {
        console.error('Error unregistering service worker:', error);
      }
    }
    return false;
  }
}
