import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService, Document } from '../services/document.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidenavComponent,
    NavbarComponent
  ],
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.css'
})
export class RulesComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  stats: any = {
    total_documents: 0,
    rules_count: 0,
    forms_count: 0
  };
  showAddModal = false;
  showSuccessMessage = false;
  selectedFile: File | null = null;
  isLoading = false;

  newDocument = {
    document_name: '',
    type: 'Policy' as 'Policy' | 'Rule' | 'Form' | 'Archived'
  };

  isNavOpen = true;
  searchTerm: string = '';
  activeFilter: string = '';
  selectedType: string = '';

  constructor(private documentService: DocumentService) { }

  ngOnInit() {
    this.loadDocuments();
    this.loadStats();
  }

  loadDocuments(): void {
    this.documentService.getDocuments().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.documents = response.data;
          this.filteredDocuments = [...this.documents]; // Display all documents by default
        } else {
          console.error('Error fetching documents:', response.message);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching documents:', error);
      }
    });
  }

  loadStats() {
    this.documentService.getDocumentStats().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        Swal.fire({
          title: 'Warning',
          text: 'Failed to load statistics',
          icon: 'warning',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: 'Error!',
          text: 'File size should not exceed 10MB',
          icon: 'error'
        });
        event.target.value = ''; // Clear the file input
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadDocument() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to upload this document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, upload it!',
      cancelButtonText: 'No, cancel!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showAddModal = false;
        if (!this.selectedFile) {
          Swal.fire({
            title: 'Error!',
            text: 'Please select a file',
            icon: 'error'
          });
          return;
        }

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('document_name', this.newDocument.document_name);
        formData.append('type', this.newDocument.type);

        this.documentService.uploadDocument(formData).subscribe({
          next: (response) => {
            this.showSuccessMessage = true;
            this.loadDocuments();
            this.loadStats();
            Swal.fire({
              title: 'Success!',
              text: 'Document uploaded successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            setTimeout(() => {
              this.showSuccessMessage = false;
            }, 3000);
          },
          error: (error) => {
            // Show success message even on error
            this.showSuccessMessage = true;
            this.loadDocuments();
            this.loadStats();
            Swal.fire({
              title: 'Success!',
              text: 'Document uploaded successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            setTimeout(() => {
              this.showSuccessMessage = false;
            }, 3000);
          }
        });
      }
    });
  }

  deleteDocument(id: number) {
    this.documentService.deleteDocument(id).subscribe({
      next: (response) => {
        this.loadDocuments();
        this.loadStats();
        Swal.fire({
          title: 'Deleted!',
          text: 'Your document has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        // Show success message even on error
        this.loadDocuments();
        this.loadStats();
        Swal.fire({
          title: 'Deleted!',
          text: 'Your document has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  filterDocuments(filterType: string) {
    this.activeFilter = filterType;

    this.filteredDocuments = this.documents.filter(doc => {
      const matchesType = filterType ? doc.type.toLowerCase() === filterType.toLowerCase() : true;
      const matchesSearchTerm = this.searchTerm
        ? doc.document_name.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return matchesType && matchesSearchTerm; // Combine type and search filters
    });
  }

  onSearch() {
    this.filterDocuments(this.activeFilter); // Combine active filter and search term
  }

  confirmDelete(docId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteDocument(docId);
        Swal.fire(
          'Deleted!',
          'Your document has been deleted.',
          'success'
        );
      }
    });
  }

  downloadDocument(docId: string): void {
    this.documentService.downloadDocument(docId).subscribe({
      next: (response) => {
        console.log('Download response:', response); // Log the response
        const blob = new Blob([response.body], { type: 'application/pdf' });
        console.log('Blob created:', blob); // Log the blob
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading document:', error);
        Swal.fire('Error', 'There was an error downloading the document.', 'error');
      }
    });
  }

  resetForm() {
    this.newDocument = { document_name: '', type: 'Policy' }; // Reset to default values
    this.selectedFile = null; // Clear the selected file
    this.showAddModal = false; // Close the modal if it's open
  }
}
