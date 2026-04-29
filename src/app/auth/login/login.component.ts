import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Router } from '@angular/router';

// Déclaration pour Google API
declare const google: any;

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
    rememberMe: new FormControl(false)
  });
  
  errorMessage: string = '';
  currentUser: any = null;
  showPassword: boolean = false;
  isLoading: boolean = false; // Pour afficher un loader

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

    // Initialiser Google Sign-In
    this.initializeGoogleSignIn();
  }

  // Initialiser Google Sign-In
  initializeGoogleSignIn(): void {
    // Charger le script Google si pas déjà chargé
    if (!document.querySelector('#google-script')) {
      const script = document.createElement('script');
      script.id = 'google-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Attendre que le script soit chargé
    setTimeout(() => {
      if (typeof google !== 'undefined') {
        this.renderGoogleButton();
      }
    }, 1000);
  }

  // Rendre le bouton Google
  renderGoogleButton(): void {
    const buttonElement = document.getElementById('google-signin-button');
    if (buttonElement && typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '161266384329-jr3pa6k3smcc37ke3ambls5gfhdukpdb.apps.googleusercontent.com', // Remplacez par votre client ID
        callback: (response: any) => this.handleGoogleLogin(response)
      });
      
      google.accounts.id.renderButton(
        buttonElement,
        { 
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular'
        }
      );
    }
  }

  // Gérer la réponse de Google
  async handleGoogleLogin(response: any): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const idToken = response.credential;
      
      this.serviceAuth.loginWithGoogle(idToken).subscribe({
        next: (res: any) => {
          if (res && res.token) {
            // Sauvegarde du token
            localStorage.setItem('token', res.token);
            
            // Sauvegarde de l'utilisateur
            if (res.user) {
              this.currentUser = res.user;
              localStorage.setItem('currentUser', JSON.stringify(res.user));
            }
            
            this.isLoading = false;
            this.errorMessage = '';
            
            // Redirection basée sur le rôle
            this.redirectBasedOnRole();
          } else if (res && res.erreur) {
            this.errorMessage = res.erreur;
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Google login error:', err);
          this.errorMessage = 'Erreur lors de l\'authentification Google';
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.errorMessage = 'Erreur lors de l\'authentification Google';
      this.isLoading = false;
    }
  }

  // Redirection basée sur le rôle
  private redirectBasedOnRole(): void {
    if (this.currentUser && this.currentUser.role) {
      if (this.currentUser.role === "ADMIN" || this.currentUser.role === "ROLE_ADMIN") {
        this.router.navigate(['/admin-dashboard']);
      } else if (this.currentUser.role === "SUPER_ADMIN" || this.currentUser.role === "ROLE_SUPER_ADMIN") {
        this.router.navigate(['/super-admin-dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  // Méthode pour afficher/masquer le mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Méthode de soumission
  submit(): void {
    this.errorMessage = '';
    
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

    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    this.isLoading = true;

    this.serviceAuth.loginPostRequest(email, password).subscribe({
      next: (res: any) => {
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          
          if (res.user) {
            this.currentUser = res.user;
            localStorage.setItem('currentUser', JSON.stringify(res.user));
          }
          
          this.errorMessage = '';
          this.isLoading = false;
          this.redirectBasedOnRole();
        } else if (res && res.erreur) {
          this.errorMessage = res.erreur;
          this.isLoading = false;
        } else if (res && res.message) {
          this.errorMessage = res.message;
          this.isLoading = false;
        } else {
          this.errorMessage = 'Erreur lors de la connexion';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Http error:', err);
        
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
        this.isLoading = false;
      }
    });
  }

  forgotPassword(event: Event): void {
    event.preventDefault();
    const email = this.loginForm.get('email')?.value;
    
    if (email && email.trim()) {
      this.router.navigate(['/forgot-password'], { queryParams: { email: email } });
    } else {
      this.router.navigate(['/forgot-password']);
    }
  }

  signUp(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('savedEmail');
    this.currentUser = null;
    this.loginForm.reset();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !!this.currentUser;
  }
  // Dans login.component.ts
handleLogoError() {
  // Optionnel: logger l'erreur ou utiliser un logo par défaut
  console.warn('Logo not found, using default');
}
}