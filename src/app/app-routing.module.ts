import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SuperAdminDashboardComponent } from './dashboard/dashboard-super-admin/super-admin-dashboard/super-admin-dashboard.component';
import { RegisterComponent } from './auth/register/register.component';
import { UsersManagementComponent } from './dashboard/dashboard-super-admin/users-management/users-management.component';
import { AdminDashboardComponent } from './dashboard/dashboard-admin/admin-dashboard.component';
import { YoloPredictComponent } from './yolo-predict/yolo-predict.component';
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
   { path: 'predict', component: YoloPredictComponent },
  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard-admin/dashboard-admin.module').then(
        (m) => m.DashboardAdminModule,
      ),
  },
  { path: 'super-admin-dashboard', component: SuperAdminDashboardComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'users', component: UsersManagementComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
