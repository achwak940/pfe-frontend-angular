import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FormsModule } from '@angular/forms';
import { DashboardAdminModule } from './dashboard/dashboard-admin/dashboard-admin.module';
import { YoloPredictComponent } from './yolo-predict/yolo-predict.component';
import { ProfilComponent } from './gestionProfil/profil/profil.component';
import { ModfifierProfilComponent } from './gestionProfil/modfifier-profil/modfifier-profil.component';

// ✅ SUPPRIMEZ CETTE IMPORTATION
// import { DashboardAdminModule } from './dashboard/dashboard-admin/dashboard-admin.module';

@NgModule({
  declarations: [AppComponent, YoloPredictComponent, ProfilComponent, ModfifierProfilComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AuthModule,
    FormsModule,
    DashboardAdminModule, // ✅ Une seule fois
    // ✅ NE PAS METTRE DashboardAdminModule ICI
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
