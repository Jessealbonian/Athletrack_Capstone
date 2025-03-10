import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { SidenavComponent } from "../sidenav/sidenav.component";

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [NavbarComponent, SidenavComponent],
  templateUrl: './business.component.html',
  styleUrl: './business.component.css'
})
export class BusinessComponent {
  isNavOpen = true;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }
}
