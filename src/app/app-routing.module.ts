// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { YoloPredictComponent } from './yolo-predict/yolo-predict.component';
import { ProfilComponent } from './gestionProfil/profil/profil.component';
import { ModfifierProfilComponent } from './gestionProfil/modfifier-profil/modfifier-profil.component';
import { DetailesUserComponent } from './dashboard/dashboard-super-admin/detailes-user/detailes-user.component';
import { MessangerComponent } from './dashboard/messanger/messanger.component';
import { GereRolesComponent } from './dashboard/dashboard-super-admin/gere-roles/gere-roles.component';
import { ParametreComponent } from './dashboard/dashboard-super-admin/parametre/parametre.component';
import { DetailesRecComponent } from './dashboard/dashboard-super-admin/detailes-rec/detailes-rec.component';
import { OublierMdpComponent } from './oublier-mdp/oublier-mdp.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { UsersManagementComponent } from './dashboard/dashboard-super-admin/users-management/users-management.component';
import { SidebarComponent } from './dashboard/dashboard-super-admin/sidebar/sidebar.component';
import { BoiteMessangerComponent } from './dashboard/boite-messanger/boite-messanger.component';
import { PageAcceuilComponent } from './page-acceuil/page-acceuil.component';

const routes: Routes = [
  { path: '', redirectTo: '/acceuil', pathMatch: 'full' },
  { path: 'acceuil', component: PageAcceuilComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'predict', component: YoloPredictComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'modifier-profil', component: ModfifierProfilComponent },
  { path: 'messanger', component: MessangerComponent },
  { path: 'gereRoles', component: GereRolesComponent },
  { path: 'parametre', component: ParametreComponent },
  { path: 'detailesRec', component: DetailesRecComponent },
  { path: 'oubliermotdepasse', component: OublierMdpComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'gereusers', component: UsersManagementComponent },
  { path: 'menu', component: SidebarComponent },
  { path: 'boiteMessanger', component: BoiteMessangerComponent },
  { path: 'login', component: LoginComponent },

  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard-admin/dashboard-admin.module').then(
        (m) => m.DashboardAdminModule,
      ),
  },
  {
    path: 'super-admin-dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard-super-admin/super-admin/super-admin.module').then(
        (m) => m.SuperAdminModule,
      ),
  },

  { path: 'detailes-user', component: DetailesUserComponent },

  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
