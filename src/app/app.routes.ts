import { Routes } from '@angular/router';
import { HomeComponent } from './HOA/home/home.component';
import { PaymentComponent } from './HOA/payment/payment.component';
import { ResidentsComponent } from './HOA/residents/residents.component';
import { EventsComponent } from './HOA/events/events.component';
import { RulesComponent } from './HOA/rules/rules.component';
import { MaintenanceComponent } from './HOA/maintenance/maintenance.component';
import { CommunicationsComponent } from './HOA/communications/communications.component';
import { BusinessComponent } from './HOA/business/business.component';
import { PropertyListComponent } from './HOA/property-list/property-list.component'; 
import { SettingsComponent } from './HOA/settings/settings.component';
import { LoginAdminComponent } from './HOA/login-admin/login-admin.component';
import { authGuard } from './services/auth.guard';
import { RegisterAdminComponent } from './HOA/register-admin/register-admin.component';


//HOAuser routes
import { DashboardComponent } from './HOAuser/dashboard/dashboard.component';
import { ProfileComponent } from './HOAuser/profile/profile.component';
import { CmtyrulesComponent } from './HOAuser/cmtyrules/cmtyrules.component';
import { CmntyeventsComponent } from './HOAuser/cmntyevents/cmntyevents.component';
import { LoginComponent } from './HOAuser/login/login.component';
import { RegisterComponent } from './HOAuser/register/register.component';
// import { UserduesComponent } from './HOAuser/userdues/userdues.component';
import { MaintenancereqComponent } from './HOAuser/maintenancereq/maintenancereq.component';
import { UserbusinessComponent } from './HOAuser/userbusiness/userbusiness.component';
import { ChatComponent } from './HOAuser/userchat/userchat.component';
import { PropertiesComponent } from './HOAuser/properties/properties.component';
import { HomeUserlistsComponent } from './HOA/home-userlists/home-userlists.component';


export const routes: Routes = [
  // HOAuser routes first
  { path: '', redirectTo: 'login', pathMatch: 'full', },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { title: 'Dashboard' } },
  { path: 'properties', component: PropertiesComponent, canActivate: [authGuard], title: 'Properties' },
  // { path: 'profile', component: ProfileComponent, canActivate: [authGuard], data: { title: 'My Profile' } },
  // { path: 'userdues', component: UserduesComponent, canActivate: [authGuard], data: { title: 'HOA Dues' } },
  // { path: 'cmtyrules', component: CmtyrulesComponent, canActivate: [authGuard], data: { title: 'Community Rules' } },
  { path: 'maintenancereq', component: MaintenancereqComponent, canActivate: [authGuard], data: { title: 'Maintenance Requests' } },
  { path: 'cmntyevents', component: CmntyeventsComponent,  data: { title: 'Community Events' } }, //canActivate: [authGuard],
  { path: 'userchat', component: ChatComponent, canActivate: [authGuard], data: { title: 'Communications' } },
  { path: 'login', component: LoginComponent, title: 'login' },
  { path: 'register', component: RegisterComponent, title: 'register' },

  // Admin routes
  { path: '', redirectTo: 'admin_login', pathMatch: 'full', },
  { path: 'home', component: HomeComponent,  title: 'Home' }, //canActivate: [authGuard],
  // { path: 'payment', component: PaymentComponent, canActivate: [authGuard], title: 'Payment' },
  { path: 'residents', component: ResidentsComponent,  title: 'Residents' }, //canActivate: [authGuard],
  { path: 'events', component: EventsComponent,  title: 'Events' },  //canActivate: [authGuard],
  // { path: 'rules', component: RulesComponent, canActivate: [authGuard], title: 'Rules' },
  { path: 'maintenance', component: MaintenanceComponent,  title: 'Maintenance' }, //canActivate: [authGuard],
  { path: 'communications', component: CommunicationsComponent,  title: 'Communications' },  //canActivate: [authGuard],
  { path: 'property-list', component: PropertyListComponent, title: 'Property List' },
  // { path: 'settings', component: SettingsComponent, canActivate: [authGuard], title: 'Settings' },
  { path: 'admin_login', component: LoginAdminComponent, title: 'Admin Login' },
  { path: 'register_admin', component: RegisterAdminComponent, title: 'Admin Register' },
  { path: 'properties', component: PropertiesComponent, title: 'Properties' },
  { path: 'users-list', component: HomeUserlistsComponent, title: 'Properties' },



  { path: '**', redirectTo: 'home' },
];
