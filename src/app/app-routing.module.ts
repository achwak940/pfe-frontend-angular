import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard/super-admin-dashboard.component';
import { RegisterComponent } from './auth/register/register.component';
import { UsersManagementComponent } from './dashboard/users-management/users-management.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'super-admin-dashboard', component: SuperAdminDashboardComponent },
   { path: 'register', component: RegisterComponent },
   { path: 'users', component: UsersManagementComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
