
import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { EventService } from './event.service';
import { SafePipe } from './safe.pipe';


interface NewsItem {
  id?: number;
  title: string;
  description: string;
  fullContent: string; // MUST DO - ADD IN MODAL DETIALS IN TABLES
  image: string;
}

interface Event {
  image: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  attendees: number;
  status: string;
}

interface Vlog {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  author: string;
  publishDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SafePipe, SidenavComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent {
  constructor(private http: HttpClient, private eventService: EventService) {}
  activeSection: string = 'news';
  showNewsDetails: boolean = false;
  showBlogDetails: boolean = false;
  showVlogDetails: boolean = false;
  showEventDetails: boolean = false;
  selectedNews: any = null;
  selectedBlog: any = null;
  selectedVlog: any = null;
  selectedEvent: any = null;
  isNavOpen = true;

  newsItems: NewsItem[] = [];
  blogItems: any[] = [];
  vlogItems: Vlog[] = [];
  eventItems: any[] = [];
  currentNewsPage = 0;
  currentEventPage = 0;
  currentBlogPage = 0;
  currentVlogPage = 0;

  isLoading = false;
  events: Event[] = [];
  defaultImageUrl = 'https://placehold.co/400x300?text=No+Image';
  apiBaseUrl = 'http://localhost/demoproj1';

  ngOnInit() {
    this.fetchMediaData();
    this.loadEvents();
  }
 
  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  loadEvents() {
    this.isLoading = true;
    this.eventService.getEvents().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response.status === 'success') {
        this.events = (response.data || []).map((event: Event) => {
          const imageUrl = event.image 
            ? (event.image.startsWith('http') ? event.image : `${this.apiBaseUrl}/api/uploads/events/${event.image}`)
            : this.defaultImageUrl;
          return {
            ...event,
            image: imageUrl
          };
        });
        
      }
    });
  }

  


  fetchMediaData() {
    this.http.get('http://localhost/DEMO2/demoproject/api/get_media/news').subscribe((data: any) => {
      this.newsItems = data.payload;
    });

    this.http.get('http://localhost/DEMO2/demoproject/api/get_media/events').subscribe((data: any) => {
      this.eventItems = data.payload;
    });

    this.http.get('http://localhost/DEMO2/demoproject/api/get_media/blogs').subscribe((data: any) => {
      this.blogItems = data.payload;
    });

    this.http.get('http://localhost/DEMO2/demoproject/api/get_media/vlogs').subscribe((data: any) => {
      this.vlogItems = data.payload;
    });
  }

  showSection(section: string) {
    this.activeSection = section;
  }

  viewNewsDetails(news: any) {
    this.selectedNews = news;
    this.showNewsDetails = true;
  }

  viewBlogDetails(blog: any) {
    this.selectedBlog = blog;
    this.showBlogDetails = true;
  }

  viewVlogDetails(vlog: any) {
    this.selectedVlog = vlog;
    this.showVlogDetails = true;
  }

  viewEventDetails(event: any) {
    this.selectedEvent = event;
    this.showEventDetails = true;
  }

  closeNewsDetails() {
    this.showNewsDetails = false;
    this.selectedNews = null;
  }

  closeBlogDetails() {
    this.showBlogDetails = false;
    this.selectedBlog = null;
  }

  closeVlogDetails() {
    this.showVlogDetails = false;
    this.selectedVlog = null;
  }

  closeEventDetails() {
    this.showEventDetails = false;
    this.selectedEvent = null;
  }

  getVisibleItems(items: any[], currentPage: number): any[] {
    const itemsPerPage = 3;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }

  nextNewsPage() {
    if ((this.currentNewsPage + 1) * 3 < this.newsItems.length) {
      this.currentNewsPage++;
    }
  }


  getPageArray(items: any[]): number[] {
    return Array(Math.ceil(items.length / 3)).fill(0);
  }

  goToNewsPage(pageIndex: number) {
    this.currentNewsPage = pageIndex;
  }

  previousNewsPage() {
    if (this.currentNewsPage > 0) {
      this.currentNewsPage--;
    }
  }

  previousEventPage() {
    if (this.currentEventPage > 0) this.currentEventPage--;
  }

  nextEventPage() {
    if ((this.currentEventPage + 1) * 3 < this.eventItems.length) this.currentEventPage++;
  }

  goToEventPage(page: number) {
    this.currentEventPage = page;
  }

  previousBlogPage() {
    if (this.currentBlogPage > 0) this.currentBlogPage--;
  }

  nextBlogPage() {
    if ((this.currentBlogPage + 1) * 3 < this.blogItems.length) this.currentBlogPage++;
  }

  goToBlogPage(page: number) {
    this.currentBlogPage = page;
  }

  previousVlogPage() {
    if (this.currentVlogPage > 0) this.currentVlogPage--;
  }

  nextVlogPage() {
    if ((this.currentVlogPage + 1) * 3 < this.vlogItems.length) this.currentVlogPage++;
  }

  goToVlogPage(page: number) {
    this.currentVlogPage = page;
  }

  fetchVlogs() {
    this.http.get('http://localhost/DEMO2/demoproject/api/get_vlogs')
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            this.vlogItems = response.payload.map((vlog: any) => ({
              ...vlog,
              thumbnail_url: `https://img.youtube.com/vi/${this.getYoutubeId(vlog.video_url)}/maxresdefault.jpg`,
              video_url: this.getEmbedUrl(vlog.video_url)
            }));
          }
        },
        error: (error) => console.error('Error fetching vlogs:', error)
      });
  }

  private getYoutubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }

  private getEmbedUrl(url: string): string {
    const videoId = this.getYoutubeId(url);
    return `https://www.youtube.com/embed/${videoId}`;
  }
}
