import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class LandingPageComponent implements OnInit, OnDestroy {
  visitCount = 0;
  displayedCount = 0;
  isLoading = true;
  lastError: string | null = null;
  dbStatus: string = 'Not queried';
  featuresHighlight = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    this.loadAndIncrement();
  }

  ngOnDestroy() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  loadAndIncrement() {
    this.isLoading = true;
    this.lastError = null;
  
    const postUrl = `${environment.apiUrl}/routes.php?request=landing-visits`;
    const getUrl = `${environment.apiUrl}/routes.php?request=landing-visits&increment=0`;
  
    // do both sequentially
    this.http.post(postUrl, {}).subscribe({
      next: () => {
        this.http.get<any>(getUrl).subscribe({
          next: res => {
            this.visitCount = res.visit_count;
            this.displayedCount = res.visit_count;
            this.isLoading = false;
          },
          error: err => {
            this.lastError = `[GET] Fetch error: ${err.message || err}`;
            this.isLoading = false;
          }
        });
      },
      error: err => {
        this.lastError = `[POST] Increment error: ${err.message || err}`;
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

  watchDemo() {
    window.alert('Demo coming soon!');
  }

  focusFeatures() {
    this.featuresHighlight = true;
    window.setTimeout(() => {
      this.featuresHighlight = false;
    }, 1200);
  }
}
