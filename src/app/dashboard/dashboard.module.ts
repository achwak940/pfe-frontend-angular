// dashboard.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { UsersManagementComponent } from './dashboard-super-admin/users-management/users-management.component';
import { MessangerComponent } from './messanger/messanger.component';
import { GereRolesComponent } from './dashboard-super-admin/gere-roles/gere-roles.component';
import { ParametreComponent } from './dashboard-super-admin/parametre/parametre.component';
import { DetailesRecComponent } from './dashboard-super-admin/detailes-rec/detailes-rec.component';

// 🔥 AJOUTER CET IMPORT
import { GestionReclamationComponent } from './dashboard-admin/gestion-reclamation/gestion-reclamation.component';
import { BoiteMessangerComponent } from './boite-messanger/boite-messanger.component';
import { SidebarComponent } from './dashboard-super-admin/sidebar/sidebar.component';

@NgModule({
  declarations: [
    UsersManagementComponent,
    MessangerComponent,
    GereRolesComponent,
    ParametreComponent,
    DetailesRecComponent,
    GestionReclamationComponent,
    BoiteMessangerComponent,
    SidebarComponent,      // 🔥 AJOUTER ICI
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DashboardRoutingModule,
    ReactiveFormsModule,
  ],
  exports: [
    DetailesRecComponent,             // 🔥 EXPORTER SI NÉCESSAIRE POUR D'AUTRES MODULES
    GestionReclamationComponent,  
    BoiteMessangerComponent    // 🔥 EXPORTER SI BESOIN AILLEURS
  ],
})
export class DashboardModule { }