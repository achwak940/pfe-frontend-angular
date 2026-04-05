import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperAdminDashboardComponent } from '../super-admin-dashboard/super-admin-dashboard.component';
import { DetailesUserComponent } from '../detailes-user/detailes-user.component';

const routes: Routes = [
  {
    path: '',
    component: SuperAdminDashboardComponent, // layout parent
    children: [
        { path: '', redirectTo: 'detailes-user', pathMatch: 'full' },
      { path: 'detailes-user', component: DetailesUserComponent },
      // tu peux ajouter d'autres routes enfant ici
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperAdminRoutingModule { }