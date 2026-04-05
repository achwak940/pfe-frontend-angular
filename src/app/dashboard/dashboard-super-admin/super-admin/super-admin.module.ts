import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { DetailesUserComponent } from '../detailes-user/detailes-user.component';
import { SuperAdminDashboardComponent } from '../super-admin-dashboard/super-admin-dashboard.component';


@NgModule({
  declarations: [
    DetailesUserComponent,
    SuperAdminDashboardComponent
  ],
  imports: [
    CommonModule,
    SuperAdminRoutingModule
  ]
})
export class SuperAdminModule { }
