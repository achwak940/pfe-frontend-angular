import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // ← AJOUT OBLIGATOIRE
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardAdminModule } from './dashboard/dashboard-admin/dashboard-admin.module';
import { YoloPredictComponent } from './yolo-predict/yolo-predict.component';
import { ProfilComponent } from './gestionProfil/profil/profil.component';
import { ModfifierProfilComponent } from './gestionProfil/modfifier-profil/modfifier-profil.component';
import { AiQuestionComponent } from './chatBot/ai-question/ai-question.component';
import { OublierMdpComponent } from './oublier-mdp/oublier-mdp.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PageAcceuilComponent } from './page-acceuil/page-acceuil.component';

@NgModule({
  declarations: [
    AppComponent,
    YoloPredictComponent,
    ProfilComponent,
    ModfifierProfilComponent,
    AiQuestionComponent,
    OublierMdpComponent,
    ResetPasswordComponent,
    PageAcceuilComponent,
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,    // ← INDISPENSABLE pour les animations
    AppRoutingModule,
    AuthModule,
    DashboardModule,
    DashboardAdminModule,
    ReactiveFormsModule,        // ← pour formGroup
    FormsModule                 // ← pour ngModel (si utilisé ailleurs)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }