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
  
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    ]),
    rememberMe: new FormControl(false) // Ajout du champ rememberMe
  });
  
  errorMessage: string = '';
  currentUser: any = null;
  showPassword: boolean = false; // Pour le toggle du mot de passe

  constructor(
    private serviceAuth: LoginService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('token');
    if (token) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.redirectBasedOnRole();
      }
    }

    // Réinitialiser l'erreur quand l'utilisateur tape
    this.loginForm.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });

    // Restaurer l'email si "Remember me" était coché
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({ email: savedEmail });
      this.loginForm.patchValue({ rememberMe: true });
    }
  }

  // Méthode pour afficher/masquer le mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Redirection basée sur le rôle
  private redirectBasedOnRole(): void {
    if (this.currentUser && this.currentUser.role) {
      if (this.currentUser.role === "ROLE_SUPER_ADMIN") {
        this.router.navigate(['/super-admin-dashboard']);
      } else if (this.currentUser.role === "ROLE_ADMIN") {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  // Méthode de soumission
  submit(): void {
    // Réinitialiser l'erreur
    this.errorMessage = '';
    
    // Vérifier si le formulaire est invalide
    if (this.loginForm.invalid) {
      if (this.loginForm.get('email')?.invalid) {
        this.errorMessage = 'Veuillez entrer un email valide';
      } else if (this.loginForm.get('password')?.invalid) {
        const passwordErrors = this.loginForm.get('password')?.errors;
        if (passwordErrors?.['required']) {
          this.errorMessage = 'Le mot de passe est obligatoire';
        } else if (passwordErrors?.['minlength']) {
          this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
        } else if (passwordErrors?.['pattern']) {
          this.errorMessage = 'Le mot de passe doit contenir au moins une majuscule, un chiffre et un symbole';
        }
      } else {
        this.errorMessage = 'Formulaire invalide';
      }
      return;
    }

    const email = (this.loginForm.value.email || '').trim();
    const password = (this.loginForm.value.password || '').trim();
    const rememberMe = this.loginForm.value.rememberMe;

    if (!email || !password) {
      this.errorMessage = 'Email et mot de passe sont obligatoires';
      return;
    }

    // Gérer la sauvegarde de l'email si "Remember me" est coché
    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    // Appel au service d'authentification
    this.serviceAuth.loginPostRequest(email, password).subscribe({
      next: (res: any) => {
        if (res && res.token) {
          // Sauvegarde du token
          localStorage.setItem('token', res.token);
          
          // Sauvegarde de l'utilisateur
          if (res.user) {
            this.currentUser = res.user;
            localStorage.setItem('currentUser', JSON.stringify(res.user));
          } else if (res.username || res.email) {
            // Si l'API retourne l'utilisateur directement
            this.currentUser = res;
            localStorage.setItem('currentUser', JSON.stringify(res));
          }
          
          // Réinitialiser l'erreur
          this.errorMessage = '';
          
          // Redirection basée sur le rôle
          this.redirectBasedOnRole();
          
        } else if (res && res.erreur) {
          this.errorMessage = res.erreur;
        } else if (res && res.message) {
          this.errorMessage = res.message;
        } else {
          this.errorMessage = 'Erreur lors de la connexion';
        }
      },
      error: (err) => {
        console.error('Http error:', err);
        
        // Gestion des erreurs HTTP
        if (err.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 403) {
          this.errorMessage = 'Accès non autorisé';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur';
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
        }
      }
    });
  }

  // Méthode pour le mot de passe oublié
  forgotPassword(event: Event): void {
    event.preventDefault();
    const email = this.loginForm.get('email')?.value;
    
    if (email && email.trim()) {
      // Rediriger vers la page de réinitialisation avec l'email pré-rempli
      this.router.navigate(['/forgot-password'], { queryParams: { email: email } });
    } else {
      this.router.navigate(['/forgot-password']);
    }
  }

  // Méthode pour l'inscription
  signUp(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  // Méthode de déconnexion (optionnelle)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('savedEmail');
    this.currentUser = null;
    this.loginForm.reset();
    this.router.navigate(['/login']);
  }

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !!this.currentUser;
  }
}