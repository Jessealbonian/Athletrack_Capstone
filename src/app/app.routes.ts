import { Routes } from '@angular/router';
import { HomeComponent } from './Coaches/home/home.component';
import { EventsComponent } from './Coaches/events/events.component';
import { ClassComponent } from './Coaches/Class/Class.component';
import { CommunicationsComponent } from './Coaches/communications/communications.component';
import { LoginAdminComponent } from './Coaches/login-admin/login-admin.component';
import { authGuard } from './services/auth.guard';
import { RegisterAdminComponent } from './Coaches/register-admin/register-admin.component';
import { RoutinehistoryComponent } from './Coaches/Routinehistory/Routinehistory.component';

//import { ResidentsComponent } from './Coaches/residents/residents.component';
//import { PaymentComponent } from './Coaches/payment/payment.component';
//import { RulesComponent } from './Coaches/rules/rules.component';
//import { BusinessComponent } from './Coaches/business/business.component';
//import { PropertyListComponent } from './Coaches/property-list/property-list.component'; 
//import { SettingsComponent } from './Coaches/settings/settings.component';

//StudentAthletes routes
import { DashboardComponent } from './StudentAthletes/dashboard/dashboard.component';
import { ProfileComponent } from './StudentAthletes/profile/profile.component';
import { RoutinesComponent } from './StudentAthletes/Routines/Routines.component';
import { CmntyeventsComponent } from './StudentAthletes/cmntyevents/cmntyevents.component';
import { LoginComponent } from './StudentAthletes/login/login.component';
import { RegisterComponent } from './StudentAthletes/register/register.component';
import { taskComponent } from './StudentAthletes/tasks/task.component';
//import { ChatComponent } from './StudentAthletes/userchat/userchat.component';

// import { UserduesComponent } from './StudentAthletes/userdues/userdues.component';
//import { UserbusinessComponent } from './StudentAthletes/userbusiness/userbusiness.component';
//import { PropertiesComponent } from './StudentAthletes/properties/properties.component';
//import { HomeUserlistsComponent } from './Coaches/home-userlists/home-userlists.component';


export const routes: Routes = [
  // StudentAthletes routes first
  { path: '', redirectTo: 'login', pathMatch: 'full', },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { title: 'Dashboard' } },
  { path: 'Routines', component: RoutinesComponent, canActivate: [authGuard], data: { title: 'Community Rules' } },
  { path: 'task', component: taskComponent, canActivate: [authGuard], data: { title: 'Routines Requests' } },
  { path: 'cmntyevents', component: CmntyeventsComponent,  data: { title: 'Community Events' } }, //canActivate: [authGuard],
  //{ path: 'userchat', component: ChatComponent, canActivate: [authGuard], data: { title: 'Communications' } },
  { path: 'login', component: LoginComponent, title: 'login' },
  { path: 'register', component: RegisterComponent, title: 'register' },

//{ path: 'properties', component: PropertiesComponent, canActivate: [authGuard], title: 'Properties' },
  // { path: 'profile', component: ProfileComponent, canActivate: [authGuard], data: { title: 'My Profile' } },
  // { path: 'userdues', component: UserduesComponent, canActivate: [authGuard], data: { title: 'Coaches Dues' } },


  // Admin routes
  { path: '', redirectTo: 'admin_login', pathMatch: 'full', },
  { path: 'home', component: HomeComponent,  title: 'Home' }, //canActivate: [authGuard],
  { path: 'events', component: EventsComponent,  title: 'Events' },  //canActivate: [authGuard],
  { path: 'Class', component: ClassComponent,  title: 'Class' }, //canActivate: [authGuard],
  { path: 'communications', component: CommunicationsComponent,  title: 'Communications' },  //canActivate: [authGuard],
  { path: 'routinehistory', component: RoutinehistoryComponent,  title: 'Routine History' },
  { path: 'admin_login', component: LoginAdminComponent, title: 'Admin Login' },
  { path: 'register_admin', component: RegisterAdminComponent, title: 'Admin Register' },

// { path: 'payment', component: PaymentComponent, canActivate: [authGuard], title: 'Payment' },
// //{ path: 'residents', component: ResidentsComponent,  title: 'Residents' }, //canActivate: [authGuard],  
// { path: 'rules', component: RulesComponent, canActivate: [authGuard], title: 'Rules' },
//{ path: 'property-list', component: PropertyListComponent, title: 'Property List' },
// { path: 'settings', component: SettingsComponent, canActivate: [authGuard], title: 'Settings' },
//{ path: 'properties', component: PropertiesComponent, title: 'Properties' },
//{ path: 'users-list', component: HomeUserlistsComponent, title: 'Properties' },



  { path: '**', redirectTo: 'home' },
];
