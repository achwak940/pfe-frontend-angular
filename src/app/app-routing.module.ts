import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard/super-admin-dashboard.component';
import { RegisterComponent } from './auth/register/register.component';
import { UsersManagementComponent } from './dashboard/users-management/users-management.component';
import { GestionEnquetesComponent } from './dashboard/gestion-enquetes/gestion-enquetes.component';
import { GestionQuestionsComponent } from './dashboard/gestion-questions/gestion-questions.component';
import { AnalyseReportingComponent } from './dashboard/analyse-reporting/analyse-reporting.component';
import { FeedbackSupportComponent } from './dashboard/feedback-support/feedback-support.component';
import { GestionIaQuestionsComponent } from './dashboard/gestion-ia-questions/gestion-ia-questions.component';
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'super-admin-dashboard', component: SuperAdminDashboardComponent },
   { path: 'register', component: RegisterComponent },
   { path: 'users', component: UsersManagementComponent },
     { path: 'gestionEnquete', component: GestionEnquetesComponent },
      { path: 'gestionQuestions', component: GestionQuestionsComponent },
      { path: 'AnalyseReporting', component: AnalyseReportingComponent },
       { path: 'feedback', component: FeedbackSupportComponent },
       { path: 'QuestionIA', component: GestionIaQuestionsComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
