import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← AJOUTER CET IMPORT

import { DashboardRoutingModule } from './dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { SuperAdminDashboardComponent } from './super-admin-dashboard/super-admin-dashboard.component';
import { UsersManagementComponent } from './users-management/users-management.component';
import { GestionEnquetesComponent } from './gestion-enquetes/gestion-enquetes.component';
import { GestionQuestionsComponent } from './gestion-questions/gestion-questions.component';
import { AnalyseReportingComponent } from './analyse-reporting/analyse-reporting.component';
import { FeedbackSupportComponent } from './feedback-support/feedback-support.component';


@NgModule({
  declarations: [
    AdminDashboardComponent,
    SuperAdminDashboardComponent,
    UsersManagementComponent,
    GestionEnquetesComponent,
    GestionQuestionsComponent,
    AnalyseReportingComponent,
    FeedbackSupportComponent
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