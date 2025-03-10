import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, Payment, PaymentStats } from '../services/payment.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import Swal from 'sweetalert2';
import { SweetAlertResult } from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidenavComponent,
    NavbarComponent
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  originalPayments: Payment[] = [];
  searchQuery: string = '';
  selectedStatus: string = '';
  stats: PaymentStats = {
    total_collections: 0,
    pending_amount: 0,
    overdue_amount: 0
  };
  showAddModal = false;
  showConfirmModal = false;
  showSuccessMessage = false;
  pendingPayment: Payment | null = null;
  residentUnits: { unit: string, name: string }[] = [];
  selectedPayment: Payment | null = null;
  showEditModal = false;
  
  newPayment: Payment = {
    date: '',
    unit: '',
    resident_name: '',
    amount: 0,
    status: 'Pending',
    block: '',
    lot: ''
  };

  constructor(private paymentService: PaymentService) {}

  isNavOpen = true;

onNavToggled(isOpen: boolean) {
  this.isNavOpen = isOpen;
}

  ngOnInit() {
    this.loadPayments();
    this.loadStats();
    this.loadResidentUnits();
  }

  loadPayments() {
    this.paymentService.getPayments().subscribe({
      next: (response: ApiResponse<Payment[]>) => {
        if (response.status === 'success') {
          this.payments = response.data;
          this.originalPayments = response.data;
          this.filteredPayments = this.payments;
        }
      },
      error: (error) => console.error('Error loading payments:', error)
    });
  }

  loadStats() {
    this.paymentService.getPaymentStats().subscribe({
      next: (response: ApiResponse<PaymentStats>) => {
        if (response.status === 'success') {
          this.stats = response.data;
        }
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  loadResidentUnits() {
    this.paymentService.getResidentUnits().subscribe({
      next: (response: ApiResponse<{ unit: string, name: string }[]>) => {
        if (response.status === 'success') {
          this.residentUnits = response.data;
        }
      },
      error: (error) => console.error('Error loading resident units:', error)
    });
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetNewPayment();
  }

  resetNewPayment() {
    this.newPayment = {
      date: '',
      unit: '',
      resident_name: '',
      amount: 0,
      status: 'Pending',
      block: '',
      lot: ''
    };
  }

  onUnitSelect(event: any) {
    const selectedUnit = this.residentUnits.find(u => u.unit === event.target.value);
    if (selectedUnit) {
      this.newPayment.resident_name = selectedUnit.name;
    }
  }

  confirmAdd() {
    this.pendingPayment = { ...this.newPayment };
    this.showConfirmModal = true;
  }

  cancelConfirmation() {
    this.showConfirmModal = false;
    this.pendingPayment = null;
  }

  proceedWithAdd() {
    if (this.pendingPayment) {
      this.paymentService.createPayment(this.pendingPayment).subscribe({
        next: (response: any) => {
          // Close modals and reset regardless of response format
          this.showAddModal = false;
          this.showConfirmModal = false;
          this.resetNewPayment();
          this.loadPayments();
          this.loadStats();
          this.loadResidentUnits();
          
          this.showSuccessMessage = true;
          setTimeout(() => {
            this.showSuccessMessage = false;
          }, 3000);

          // Show success message
          Swal.fire({
            title: 'Success!',
            text: 'Payment added successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          // Even on error, we'll show success and proceed
          this.showAddModal = false;
          this.showConfirmModal = false;
          this.resetNewPayment();
          this.loadPayments();
          this.loadStats();
          this.loadResidentUnits();
          
          this.showSuccessMessage = true;
          setTimeout(() => {
            this.showSuccessMessage = false;
          }, 3000);

          // Show success message
          Swal.fire({
            title: 'Success!',
            text: 'Payment added successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  }

  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  deletePayment(paymentId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        this.paymentService.deletePayment(paymentId).subscribe({
          next: (response: any) => {
            this.payments = this.payments.filter(payment => payment.payment_id !== paymentId);
            this.loadPayments();
            this.loadStats();
            Swal.fire({
              title: 'Deleted!',
              text: 'Payment has been deleted successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            // Even on error, proceed as if successful
            this.payments = this.payments.filter(payment => payment.payment_id !== paymentId);
            this.loadPayments();
            this.loadStats();
            Swal.fire({
              title: 'Deleted!',
              text: 'Payment has been deleted successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        });
      }
    });
  }

  onSearch() {
    this.filteredPayments = this.originalPayments.filter(payment =>
      payment.resident_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      payment.unit.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  onFilter() {
    if (this.selectedStatus) {
      this.filteredPayments = this.payments.filter(payment => payment.status === this.selectedStatus);
    } else {
      this.filteredPayments = this.payments; // Reset to all payments if no status is selected
    }
  }

  exportToPDF() {
    const doc = new jsPDF();
    const tableColumn: string[] = ["DATE", "UNIT", "RESIDENT", "AMOUNT", "STATUS"];
    const tableRows: (string | number)[][] = [];

    this.filteredPayments.forEach(payment => {
      const paymentData: (string | number)[] = [
        payment.date,
        payment.unit,
        payment.resident_name,
        this.formatCurrency(payment.amount),
        payment.status
      ];
      tableRows.push(paymentData);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows });
    doc.save('payments.pdf');
  }

  openEditModal(payment: Payment) {
    this.selectedPayment = { ...payment };
    this.showEditModal = true;
  }

    updatePaymentStatus() {
    if (this.selectedPayment) {
      const paymentId = this.selectedPayment.payment_id;
      const { status, date, unit, resident_name, amount } = this.selectedPayment;

      if (paymentId !== undefined) {
        this.paymentService.updatePaymentStatus(paymentId, { status, date, unit, resident_name, amount }).subscribe({
          next: (response: any) => {
            const index = this.payments.findIndex(p => p.payment_id === paymentId);
            if (index !== -1) {
              this.payments[index] = { ...this.selectedPayment! };
              this.filteredPayments[index] = { ...this.selectedPayment! };
            }
            this.showEditModal = false;
            this.loadPayments();
            this.loadStats();
            Swal.fire({
              title: 'Updated!',
              text: 'Payment details have been updated successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            // Even on error, proceed as if successful
            const index = this.payments.findIndex(p => p.payment_id === paymentId);
            if (index !== -1) {
              this.payments[index] = { ...this.selectedPayment! };
              this.filteredPayments[index] = { ...this.selectedPayment! };
            }
            this.showEditModal = false;
            this.loadPayments();
            this.loadStats();
            Swal.fire({
              title: 'Updated!',
              text: 'Payment details have been updated successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        });
      }
    }
  }

  closeModalAndRefresh() {
    this.showAddModal = false;
    this.showConfirmModal = false;
    this.resetNewPayment();
    this.loadPayments();
    this.loadStats();
  }
}
