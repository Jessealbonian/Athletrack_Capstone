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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchAndAnimateVisits();
  }

  fetchAndAnimateVisits() {
    this.isLoading = true;
    // API endpoint to increment and get visits
    const url = `${environment.apiUrl}/routes.php?request=landing-visits&increment=1`;
    this.http.get<any>(url).subscribe({
      next: res => {
        const newCount = res.visit_count || 0;
        this.animateVisitCount(newCount);
        this.isLoading = false;
      },
      error: _ => {
        // fallback
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
