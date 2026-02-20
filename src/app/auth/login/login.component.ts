import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  
  loginForm=new FormGroup({
    email:new FormControl('',[Validators.required,Validators.email]),
    password:new FormControl('',[Validators.required,Validators.minLength(8),
       Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
     
      ])
    
  })
  errorMessage:string=''
  currentUser:any=null

  constructor(private serviceAuth:LoginService,
    private router:Router) { }
 ngOnInit(): void {
  this.loginForm.valueChanges.subscribe(() => {
    this.errorMessage = '';
  });
}

submit(): void {
  if (this.loginForm.invalid) {
    this.errorMessage = 'Formulaire invalide';
    return;
  }

  const email = (this.loginForm.value.email || '').trim();
  const password = (this.loginForm.value.password || '').trim();

  if (!password) {
    this.errorMessage = 'Le mot de passe est obligatoire';
    return;
  }

  this.serviceAuth.loginPostRequest(email, password).subscribe({
    next: (res: any) => {
      if (res.token) {
        localStorage.setItem('token', res.token);
        this.currentUser=res.user
         localStorage.setItem('currentUser', JSON.stringify(res.user));
        if(this.currentUser.role==="ROLE_SUPER_ADMIN"){
            this.router.navigate(['/super-admin-dashboard']);
          
        }
        else if(this.currentUser.role==="ROLE_ADMIN"){

  this.router.navigate(['/admin-dashboard']);
        }else{
          this.router.navigate(['/'])

        }
        this.errorMessage = '';
      } else if (res.erreur) {
        this.errorMessage = res.erreur;
      }
    },
    error: (err) => {
      console.error('Http error', err);
      this.errorMessage = 'Erreur serveur';
    }
  });
}
}