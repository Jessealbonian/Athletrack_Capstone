import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';


@Component({
  selector: 'app-userdues',
  imports: [SidenavComponent,NavbarComponent],
  templateUrl: './userdues.component.html',
  styleUrl: './userdues.component.css'
})
export class UserduesComponent {
  isNavOpen = true;
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0; // Set this based on your total number of records
  Math = Math; // To use Math.min in template

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Implement your logic to fetch data for the new page
  }
}
