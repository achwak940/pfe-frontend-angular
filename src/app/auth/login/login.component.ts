import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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

  constructor() { }

  ngOnInit(): void {

  }
  submit(){
  if(this.loginForm.valid){
    console.log(this.loginForm.value);
  }
  else{
    console.log("form is not valid");
  }
}}
