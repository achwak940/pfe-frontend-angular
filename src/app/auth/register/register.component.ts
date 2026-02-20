import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterService } from '../register.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  successMessage = '';
  constructor(private fb: FormBuilder, private registerService: RegisterService) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
      ]]
    });
  }

  submit() {
    this.submitted = true;
    this.successMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    // Appel au service
    this.registerService.registerUtilisateur(this.registerForm.value).subscribe({
      next: res => {
        // Si le back renvoie une erreur spécifique au champ
        if (res.erreur) {
          // Exemple : si c'est l'email qui existe déjà
          if (res.erreur.includes("email")) {
            this.registerForm.controls['email'].setErrors({ serverError: res.erreur });
          } else {
            // Pour les autres erreurs globales
            alert(res.erreur);
          }
        } else {
          this.successMessage = res.message;
          this.registerForm.reset();
          this.submitted = false;
        }
      },
      error: err => {
        alert("Erreur serveur : " + err.message);
      }
    });
  }
}