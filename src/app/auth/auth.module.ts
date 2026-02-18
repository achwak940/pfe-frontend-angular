import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  exports: [LoginComponent]

})
export class AuthModule {}
