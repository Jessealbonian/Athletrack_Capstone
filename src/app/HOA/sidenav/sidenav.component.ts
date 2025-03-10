import { Component, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';
import { MessageNotificationService } from '../../services/messsage-notification.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnInit {
  @Output() navToggled = new EventEmitter<boolean>();
  isNavOpen = true;
  hasNewMessage: boolean = false;
  pingExpired: boolean = true;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageNotificationService: MessageNotificationService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth < 1024) {
      this.isNavOpen = false;
      this.navToggled.emit(this.isNavOpen);
    } else {
      this.isNavOpen = true;
      this.navToggled.emit(this.isNavOpen);
    }
  }

  ngOnInit() {
    if (window.innerWidth < 1024) {
      this.isNavOpen = false;
      this.navToggled.emit(this.isNavOpen);
    }

    this.router.events.subscribe((event) => {
      if (window.innerWidth < 1024 && this.isNavOpen) {
        this.isNavOpen = false;
        this.navToggled.emit(this.isNavOpen);
      }
    });

    this.messageNotificationService.newMessage$.subscribe(hasNewMessage => {
      this.hasNewMessage = hasNewMessage;
      if (hasNewMessage) {
        this.pingExpired = false;
        setTimeout(() => {
          this.resetNewMessageFlag();
        }, 10000);
      }
    });
  }

  resetNewMessageFlag(): void {
    this.hasNewMessage = false;
    this.pingExpired = true;
    this.messageNotificationService.resetNewMessageNotification();
  }

  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
    this.navToggled.emit(this.isNavOpen);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  confirmLogout() {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.logout();

        // Redirect to admin_login instead of /login
        this.router.navigate(['/admin_login']);
        Swal.fire(
          'Logged out!',
          'You have been logged out.',
          'success'
        );
      }
    });
  }
}
