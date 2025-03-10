import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private vendor: { vendor_id: number; vendor_name: string } | null = null;

  setVendor(vendor: { vendor_id: number; vendor_name: string }): void {
    this.vendor = vendor;
    console.log('Vendor set in SharedService:', vendor);
  }

  getVendor(): { vendor_id: number; vendor_name: string } | null {
    return this.vendor;
  }
}