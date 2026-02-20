import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← AJOUTER CET IMPORT

import { DashboardRoutingModule } from './dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { SuperAdminDashboardComponent } from './super-admin-dashboard/super-admin-dashboard.component';


@NgModule({
  declarations: [
    AdminDashboardComponent,
    SuperAdminDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule, // ← AJOUTER ICI
    DashboardRoutingModule
  ],
  exports: [
    AdminDashboardComponent,
    SuperAdminDashboardComponent
  ]
})
export class DashboardModule { }