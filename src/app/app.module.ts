import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PaymentService } from './HOA/services/payment.service';

import { AppComponent } from './app.component';
import { PaymentComponent } from './HOA/payment/payment.component';
import { ChatComponent } from './HOAuser/userchat/userchat.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppComponent,
    ChatComponent,
    PaymentComponent
  ],
  providers: [
    PaymentService
  ]
})
export class AppModule { }