import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardAdminRoutingModule } from './dashboard-admin-routing.module';
import { GestionEnquetesComponent } from './gestion-enquetes/gestion-enquetes.component';
import { GestionIaQuestionsComponent } from './gestion-ia-questions/gestion-ia-questions.component';
import { AnalyseReportingComponent } from './analyse-reporting/analyse-reporting.component';
import { FeedbackSupportComponent } from './feedback-support/feedback-support.component';
import { GestionQuestionsComponent } from './gestion-questions/gestion-questions.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AjoutEnqueteComponent } from './ajout-enquete/ajout-enquete.component';
import { ModifierEnqueteComponent } from './modifier-enquete/modifier-enquete.component';
import { GestionReclamationComponent } from './gestion-reclamation/gestion-reclamation.component';
import { EnqueteDetailsComponent } from './enquete-details/enquete-details.component';
import { UserResponsesComponent } from './user-responses/user-responses.component';
import { UsersComponent } from './users/users.component';


@NgModule({
  declarations: [
    AdminDashboardComponent,
    GestionEnquetesComponent,
    GestionQuestionsComponent,
    AnalyseReportingComponent,
    FeedbackSupportComponent,
    GestionIaQuestionsComponent,
    AjoutEnqueteComponent,
    ModifierEnqueteComponent,
    GestionReclamationComponent,
    EnqueteDetailsComponent,
    UserResponsesComponent,
    UsersComponent
  ],
  imports: [
    CommonModule,
    DashboardAdminRoutingModule,
     FormsModule,   
       ReactiveFormsModule
  ],
    exports: [
    AdminDashboardComponent
  ]

})
export class DashboardAdminModule { }
