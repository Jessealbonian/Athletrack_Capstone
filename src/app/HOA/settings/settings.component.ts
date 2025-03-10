import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SidenavComponent, NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  isNavOpen = true;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }
}
