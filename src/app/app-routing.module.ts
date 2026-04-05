// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { YoloPredictComponent } from './yolo-predict/yolo-predict.component';
import { ProfilComponent } from './gestionProfil/profil/profil.component';
import { ModfifierProfilComponent } from './gestionProfil/modfifier-profil/modfifier-profil.component';
import { DetailesUserComponent } from './dashboard/dashboard-super-admin/detailes-user/detailes-user.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'predict', component: YoloPredictComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'modifier-profil', component: ModfifierProfilComponent },

  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard-admin/dashboard-admin.module').then(
        (m) => m.DashboardAdminModule
      ),
  },
  {
    path: 'super-admin-dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard-super-admin/super-admin/super-admin.module').then(
        (m) => m.SuperAdminModule
      ),
  },

  // 👇 حطها قبل **
  { path: 'detailes-user', component: DetailesUserComponent },

  // 👇 ديما في الاخر
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}