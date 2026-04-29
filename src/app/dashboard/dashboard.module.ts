import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { UsersManagementComponent } from './dashboard-super-admin/users-management/users-management.component';
import { MessangerComponent } from './messanger/messanger.component';
import { GereRolesComponent } from './dashboard-super-admin/gere-roles/gere-roles.component';
import { ParametreComponent } from './dashboard-super-admin/parametre/parametre.component';

// ❌ NE PAS IMPORTER AdminDashboardComponent s'il existe
// import { AdminDashboardComponent } from './dashboard-admin/admin-dashboard.component';

@NgModule({
  declarations: [
    UsersManagementComponent,
    MessangerComponent,
    GereRolesComponent,
    ParametreComponent,

    // ❌ NE PAS DECLARER AdminDashboardComponent ici
  ],
  imports: [CommonModule, FormsModule, RouterModule, DashboardRoutingModule,ReactiveFormsModule,],
  exports: [UsersManagementComponent],
})
export class DashboardModule {}
