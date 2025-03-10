import { Component } from '@angular/core';
import { NavbarComponent } from "../../HOAuser/navbar/navbar.component";
import { SidenavComponent } from "../../HOAuser/sidenav/sidenav.component";

@Component({
  selector: 'app-userbusiness',
  standalone: true,
  imports: [NavbarComponent, SidenavComponent],
  templateUrl: './userbusiness.component.html',
  styleUrl: './userbusiness.component.css'
})
export class UserbusinessComponent {
  isModalVisible = false;
  isDetailsModalVisible = false;

  showModal(): void {
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  showDetailsModal(): void {
    this.isDetailsModalVisible = true;
  }

  closeDetailsModal(): void {
    this.isDetailsModalVisible = false;
  }
}