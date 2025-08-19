import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppwriteService } from './services/appwrite.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'HomeFinder_HOA';
  pingResult?: string;

  constructor(private appwriteService: AppwriteService) {}

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