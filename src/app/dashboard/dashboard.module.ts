import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardRoutingModule } from './dashboard-routing.module';

// ✅ IMPORTER SEULEMENT LES COMPOSANTS QUI EXISTENT
import { SuperAdminDashboardComponent } from './dashboard-super-admin/super-admin-dashboard/super-admin-dashboard.component';
import { UsersManagementComponent } from './dashboard-super-admin/users-management/users-management.component';

// ❌ NE PAS IMPORTER AdminDashboardComponent s'il existe
// import { AdminDashboardComponent } from './dashboard-admin/admin-dashboard.component';

@NgModule({
  declarations: [
    SuperAdminDashboardComponent,
    UsersManagementComponent
    // ❌ NE PAS DECLARER AdminDashboardComponent ici
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DashboardRoutingModule,
  ],
  exports: [
    SuperAdminDashboardComponent,
    UsersManagementComponent
  ],
})
export class DashboardModule { }