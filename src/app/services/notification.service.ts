import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
  })
  export class NotificationService {
    private audio: HTMLAudioElement;
  
    constructor() {
      this.audio = new Audio();
      this.audio.src = '../assets/sounds/notificationsound.mp3';
      this.audio.load();
    }
  
    playNotificationSound(): void {
        this.audio.play().catch(error => console.error('Error playing sound:', error));
    }
  }