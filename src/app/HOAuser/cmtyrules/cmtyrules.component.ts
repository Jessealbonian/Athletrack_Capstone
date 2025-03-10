import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cmtyrules',
  //standalone: true, (need if may imports ang alam ko pero kayo na may lagay HAHAHAHHA)
  imports: [SidenavComponent,NavbarComponent, CommonModule],
  templateUrl: './cmtyrules.component.html',
  styleUrls: ['./cmtyrules.component.css']
})
export class CmtyrulesComponent {
  isNavOpen = true;
  isModalOpen = false;
  uploadedDocuments = ['Document1.pdf', 'Document2.pdf', 'Document3.pdf'];

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  openModal() {
    console.log('Opening modal'); // Debugging line
    this.isModalOpen = true; // Open the modal
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
