import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Router } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
    ]),
    rememberMe: new FormControl(false),
  });

  errorMessage: string = '';
  currentUser: any = null;
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private serviceAuth: LoginService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (token) {
      const savedUser = localStorage.getItem('currentUser');

      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.redirectBasedOnRole();
      }

      console.log('TOKEN:', token);
      console.log('USER:', this.currentUser);
    }

    this.loginForm.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });

    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true,
      });
    }

    this.initializeGoogleSignIn();
  }

  // ================= GOOGLE =================
  initializeGoogleSignIn(): void {
    if (!document.getElementById('google-script')) {
      const script = document.createElement('script');
      script.id = 'google-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    setTimeout(() => {
      if (typeof google !== 'undefined') {
        this.renderGoogleButton();
      }
    }, 1200);
  }

  renderGoogleButton(): void {
    const btn = document.getElementById('google-signin-button');

    if (!btn) return;

    google.accounts.id.initialize({
      client_id:
        '161266384329-jr3pa6k3smcc37ke3ambls5gfhdukpdb.apps.googleusercontent.com',
      callback: (res: any) => this.handleGoogleLogin(res),
    });

    google.accounts.id.renderButton(btn, {
      theme: 'outline',
      size: 'large',
      width: '100%',
    });
  }

  handleGoogleLogin(response: any): void {
    this.isLoading = true;

    const idToken = response.credential;

    this.serviceAuth.loginWithGoogle(idToken).subscribe({
      next: (res: any) => {
        if (res?.token) {
          localStorage.setItem('token', res.token);

          if (res.user) {
            this.currentUser = res.user;
            localStorage.setItem('currentUser', JSON.stringify(res.user));
          }

          this.isLoading = false;
          this.redirectBasedOnRole();
        } else {
          this.errorMessage = res?.erreur || 'Google login failed';
          this.isLoading = false;
        }
      },
      error: () => {
        this.errorMessage = 'Erreur Google login';
        this.isLoading = false;
      },
    });
  }

  // ================= ROLE REDIRECT FIX =================
  private redirectBasedOnRole(): void {
    const role = this.currentUser?.role?.nom || this.currentUser?.role;

    if (!role) {
      this.router.navigate(['/']);
      return;
    }

    if (role === 'ROLE_ADMIN' || role === 'Administrateur') {
      this.router.navigate(['/admin-dashboard']);
    } else if (role === 'ROLE_SUPER_ADMIN') {
      this.router.navigate(['/super-admin-dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // ================= LOGIN =================
  submit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Formulaire invalide';
      return;
    }

    const email = (this.loginForm.value.email || '').trim();
    const password = (this.loginForm.value.password || '').trim();
    const rememberMe = this.loginForm.value.rememberMe;

    if (!email || !password) {
      this.errorMessage = 'Email et mot de passe requis';
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
        if (res?.token) {
          localStorage.setItem('token', res.token);

          if (res.user) {
            this.currentUser = res.user;
            localStorage.setItem('currentUser', JSON.stringify(res.user));
          }

          this.isLoading = false;
          this.redirectBasedOnRole();
        } else {
          this.errorMessage = res?.erreur || 'Login failed';
          this.isLoading = false;
        }
      },

      error: (err) => {
        this.errorMessage =
          err.status === 401
            ? 'Email ou mot de passe incorrect'
            : err.status === 403
              ? 'Accès refusé'
              : 'Erreur serveur';

        this.isLoading = false;
      },
    });
  }

  // ================= UI =================
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  forgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/oubliermotdepasse']);
  }

  signUp(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  logout(): void {
    localStorage.clear();
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  handleLogoError(): void {
    console.warn('Logo error');
  }
}
