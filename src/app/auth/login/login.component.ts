import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
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

  constructor(private serviceAuth:LoginService) { }
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
        console.log(res.token)
        console.log(this.currentUser)
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