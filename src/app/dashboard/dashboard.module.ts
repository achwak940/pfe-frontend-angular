import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // ← pour routerLink et routerLinkActive

import { DashboardRoutingModule } from './dashboard-routing.module';

import { SuperAdminDashboardComponent } from './super-admin-dashboard/super-admin-dashboard.component';
import { UsersManagementComponent } from './users-management/users-management.component';

@NgModule({
  declarations: [
    SuperAdminDashboardComponent,
    UsersManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,           // ← nécessaire pour routerLink et ngClass
    DashboardRoutingModule
  ],
  exports: [
    SuperAdminDashboardComponent, 
    UsersManagementComponent
  ],
})
export class DashboardModule {}