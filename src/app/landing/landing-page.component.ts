import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterLink } from '@angular/router';

interface LandingVisitResponse {
  visit_count: number;
  last_visited?: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private readonly visitIntervalMs = 30 * 60 * 1000;
  private readonly localLastIncrementKey = 'athletrack_landing_last_increment';

  visitCount = 0;
  displayedCount = 0;
  isLoading = true;
  lastError: string | null = null;
  dbStatus: string = 'Not queried';
  featuresHighlight = false;
  navMenuOpen = false;

  constructor(private http: HttpClient) {}

  toggleLandingNav(): void {
    this.navMenuOpen = !this.navMenuOpen;
  }

  closeLandingNav(): void {
    this.navMenuOpen = false;
  }

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

    const getUrl = `${environment.apiUrl}/routes.php?request=landing-visits&increment=0`;
    const postUrl = `${environment.apiUrl}/routes.php?request=landing-visits`;

    this.http.get<LandingVisitResponse>(getUrl).subscribe({
      next: res => {
        const currentCount = res.visit_count ?? 0;

        if (this.shouldIncrementVisit(res.last_visited)) {
          this.http.post(postUrl, {}).subscribe({
            next: () => {
              this.markLocalIncrement();
              this.fetchVisitCount();
            },
            error: err => {
              this.lastError = `[POST] Increment error: ${err.message || err}`;
              this.applyVisitCount(currentCount);
            }
          });
          return;
        }

        this.applyVisitCount(currentCount);
      },
      error: err => {
        this.lastError = `[GET] Fetch error: ${err.message || err}`;
        this.isLoading = false;
      }
    });
  }

  private fetchVisitCount(): void {
    const getUrl = `${environment.apiUrl}/routes.php?request=landing-visits&increment=0`;

    this.http.get<LandingVisitResponse>(getUrl).subscribe({
      next: res => this.applyVisitCount(res.visit_count ?? 0),
      error: err => {
        this.lastError = `[GET] Fetch error: ${err.message || err}`;
        this.isLoading = false;
      }
    });
  }

  private shouldIncrementVisit(lastVisited?: string): boolean {
    const serverLast = this.parseVisitTimestamp(lastVisited);
    const localLast = this.getLocalLastIncrement();
    const referenceMs =
      serverLast !== null && localLast !== null
        ? Math.max(serverLast, localLast)
        : serverLast ?? localLast;

    if (referenceMs === null) {
      return true;
    }

    return Date.now() - referenceMs >= this.visitIntervalMs;
  }

  private parseVisitTimestamp(value?: string): number | null {
    if (!value) {
      return null;
    }

    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = Date.parse(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private getLocalLastIncrement(): number | null {
    const stored = localStorage.getItem(this.localLastIncrementKey);
    if (!stored) {
      return null;
    }

    const parsed = Number(stored);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private markLocalIncrement(): void {
    localStorage.setItem(this.localLastIncrementKey, String(Date.now()));
  }

  private applyVisitCount(count: number): void {
    this.visitCount = count;
    this.displayedCount = count;
    this.isLoading = false;
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
