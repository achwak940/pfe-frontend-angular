import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionEnquetesComponent } from './gestion-enquetes/gestion-enquetes.component';
import { GestionQuestionsComponent } from './gestion-questions/gestion-questions.component';
import { AnalyseReportingComponent } from './analyse-reporting/analyse-reporting.component';
import { FeedbackSupportComponent } from './feedback-support/feedback-support.component';
import { GestionIaQuestionsComponent } from './gestion-ia-questions/gestion-ia-questions.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import * as path from 'path';
import { AjoutEnqueteComponent } from './ajout-enquete/ajout-enquete.component';
import { ModifierEnqueteComponent } from './modifier-enquete/modifier-enquete.component';
import { GestionReclamationComponent } from './gestion-reclamation/gestion-reclamation.component';

const routes: Routes = [
  { 
    path: '', 
    component: AdminDashboardComponent, // layout parent
    children: [
      { path: 'gestionEnquete', component: GestionEnquetesComponent },
      { path: 'gestionQuestions', component: GestionQuestionsComponent },
      { path: 'AnalyseReporting', component: AnalyseReportingComponent },
      { path: 'feedback', component: FeedbackSupportComponent },
      { path: 'QuestionIA', component: GestionIaQuestionsComponent },
      { path: 'AjoutEnquete', component: AjoutEnqueteComponent },
      { path: 'ModifierEnquete/:id', component: ModifierEnqueteComponent },
      { path: 'gestionReclamation', component: GestionReclamationComponent },
    ] 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardAdminRoutingModule { }
