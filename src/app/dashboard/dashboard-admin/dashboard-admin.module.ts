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
// Supprimer l'import de GestionReclamationComponent ici, car il est déclaré dans DashboardModule
// import { GestionReclamationComponent } from './gestion-reclamation/gestion-reclamation.component';
import { EnqueteDetailsComponent } from './enquete-details/enquete-details.component';
import { UserResponsesComponent } from './user-responses/user-responses.component';
import { UsersComponent } from './users/users.component';
// Importer DashboardModule pour avoir accès à GestionReclamationComponent et DetailesRecComponent
import { DashboardModule } from '../dashboard.module'; // à adapter selon le chemin

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
    
    // GestionReclamationComponent,  // ❌ retiré d'ici
    EnqueteDetailsComponent,
    UserResponsesComponent,
    UsersComponent,
    // ... autres composants propres à ce module
  ],
  imports: [
    CommonModule,
    DashboardAdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardModule,   // ⚠️ IMPORTANT : importe DashboardModule pour utiliser GestionReclamationComponent et DetailesRecComponent
  ],
  exports: [
    AdminDashboardComponent
  ]
})
export class DashboardAdminModule { }