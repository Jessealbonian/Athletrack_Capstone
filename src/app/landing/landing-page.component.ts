import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  visitCount = 0;
  displayedCount = 0;
  isLoading = true;
  lastError: string | null = null;
  dbStatus: string = 'Not queried';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchAndAnimateVisits();
  }

  fetchAndAnimateVisits() {
    this.isLoading = true;
    this.lastError = null;
    this.dbStatus = 'Querying...';
    // API endpoint to increment and get visits
    const url = `${environment.apiUrl}/routes.php?request=landing-visits&increment=1`;
    this.http.get<any>(url).subscribe({
      next: res => {
        console.log('Landing count API raw response:', res);
        if (!res) {
          this.dbStatus = 'No response from backend!';
          this.lastError = 'Visit API response was empty.';
          console.error('No response:', res);
          this.isLoading = false;
          return;
        }
        if (typeof res.visit_count !== 'number') {
          this.dbStatus = 'Invalid data from backend!';
          this.lastError = 'Visit API response was invalid.';
          console.error('Invalid response:', res);
          this.isLoading = false;
          return;
        }
        this.dbStatus = `Backend responded: visit_count=${res.visit_count}`;
        const newCount = res.visit_count;
        this.animateVisitCount(newCount);
        this.isLoading = false;
      },
      error: err => {
        this.lastError = `Failed to fetch visits: ${err.message || err}`;
        this.dbStatus = 'Backend request failed!';
        console.error('Landing visit API error', err);
        this.isLoading = false;
      }
    });
  }

  animateVisitCount(to: number) {
    const from = this.displayedCount;
    const duration = 1000;
    const step = Math.max(1, Math.floor((to - from) / 30));
    let current = from;
    const increment = () => {
      if (current < to) {
        current += step;
        if (current > to) current = to;
        this.displayedCount = current;
        setTimeout(increment, duration / (to - from));
      } else {
        this.displayedCount = to;
      }
    };
    increment();
  }
}
