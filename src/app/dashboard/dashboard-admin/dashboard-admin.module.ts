import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardAdminRoutingModule } from './dashboard-admin-routing.module';
import { GestionEnquetesComponent } from './gestion-enquetes/gestion-enquetes.component';
import { GestionIaQuestionsComponent } from './gestion-ia-questions/gestion-ia-questions.component';
import { AnalyseReportingComponent } from './analyse-reporting/analyse-reporting.component';
import { FeedbackSupportComponent } from './feedback-support/feedback-support.component';
import { GestionQuestionsComponent } from './gestion-questions/gestion-questions.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AdminDashboardComponent,
    GestionEnquetesComponent,
    GestionQuestionsComponent,
    AnalyseReportingComponent,
    FeedbackSupportComponent,
    GestionIaQuestionsComponent
  ],
  imports: [
    CommonModule,
    DashboardAdminRoutingModule,
     FormsModule,   
  ],
    exports: [
    AdminDashboardComponent
  ]

})
export class DashboardAdminModule { }
