// reset-password.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';
import { OublierMdpService } from '../oublier-mdp.service';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px) scale(0.98)' }),
        animate(
          '0.6s cubic-bezier(0.2, 0.8, 0.4, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '0.3s ease-out',
          style({ opacity: 0, transform: 'translateY(-20px)' }),
        ),
      ]),
    ]),
    trigger('logoBounce', [
      transition(':enter', [
        animate(
          '0.8s cubic-bezier(0.2, 0.8, 0.4, 1)',
          keyframes([
            style({ opacity: 0, transform: 'scale(0.3)', offset: 0 }),
            style({ opacity: 1, transform: 'scale(1.1)', offset: 0.5 }),
            style({ transform: 'scale(0.95)', offset: 0.7 }),
            style({ transform: 'scale(1)', offset: 1 }),
          ]),
        ),
      ]),
    ]),
    trigger('formSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate(
          '0.5s 0.2s cubic-bezier(0.2, 0.8, 0.4, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ]),
    ]),
    trigger('inputFocus', [
      state('true', style({ transform: 'scale(1.01)' })),
      state('false', style({ transform: 'scale(1)' })),
      transition('false => true', animate('0.3s ease-out')),
      transition('true => false', animate('0.2s ease-in')),
    ]),
    trigger('iconMorph', [
      state('default', style({ transform: 'scale(1)', color: '#6b7280' })),
      state('focused', style({ transform: 'scale(1.15)', color: '#9D50BB' })),
      transition('default <=> focused', animate('0.3s ease')),
    ]),
    trigger('checkPop', [
      transition(':enter', [
        animate(
          '0.4s cubic-bezier(0.2, 0.8, 0.4, 1)',
          keyframes([
            style({
              transform: 'scale(0) rotate(-180deg)',
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: 'scale(1.2) rotate(10deg)',
              opacity: 1,
              offset: 0.6,
            }),
            style({ transform: 'scale(1) rotate(0deg)', offset: 1 }),
          ]),
        ),
      ]),
    ]),
    trigger('errorShake', [
      transition(':enter', [
        animate(
          '0.5s ease-out',
          keyframes([
            style({ transform: 'translateX(0)', offset: 0 }),
            style({ transform: 'translateX(-8px)', offset: 0.1 }),
            style({ transform: 'translateX(7px)', offset: 0.2 }),
            style({ transform: 'translateX(-6px)', offset: 0.3 }),
            style({ transform: 'translateX(5px)', offset: 0.4 }),
            style({ transform: 'translateX(-3px)', offset: 0.5 }),
            style({ transform: 'translateX(0)', offset: 1 }),
          ]),
        ),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('0.2s ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('btnPulse', [
      state('active', style({ boxShadow: '0 4px 16px rgba(157,80,187,0.35)' })),
      state('inactive', style({ boxShadow: 'none' })),
      transition('inactive => active', animate('0.3s ease-out')),
      transition('active => inactive', animate('0.2s ease-in')),
    ]),
    trigger('successScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate(
          '0.5s cubic-bezier(0.2, 0.8, 0.4, 1)',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
      ]),
    ]),
  ],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  tokenValid = false;
  tokenExpired = false;
  token: string | null = null;

  showPassword = false;
  showConfirmPassword = false;
  passwordFocus = false;
  confirmPasswordFocus = false;

  passwordStrength = 0;
  strengthLabel = '';
  strengthColor = '';

  /** Compte à rebours de redirection après succès */
  redirectCountdown = 5;
  private redirectInterval: ReturnType<typeof setInterval> | null = null;
  private sub: Subscription | null = null;

  particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 15,
  }));

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private oublierMdpService: OublierMdpService,
    private cdr: ChangeDetectorRef,
  ) {
    this.resetForm = this.fb.group({
      password: [
        '',
        {
          validators: [Validators.required, Validators.minLength(8)],
          updateOn: 'change',
        },
      ],
      confirmPassword: [
        '',
        {
          validators: [Validators.required, this.passwordMatchValidator.bind(this)],
          updateOn: 'change',
        },
      ],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || null;
      if (this.token && this.token.length > 10) {
        this.tokenValid = true;
      } else {
        this.tokenValid = false;
        this.errorMessage =
          'Lien de réinitialisation invalide ou manquant. Veuillez demander un nouveau lien.';
      }
    });

    this.resetForm.get('password')?.valueChanges.subscribe((value: string) => {
      this.updatePasswordStrength(value);
      this.resetForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.redirectInterval) clearInterval(this.redirectInterval);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = this.resetForm?.get('password')?.value;
    if (password && control.value && password !== control.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get f() {
    return this.resetForm.controls;
  }

  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.strengthLabel = '';
      this.strengthColor = '';
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;

    this.passwordStrength = Math.min(strength, 100);

    if (this.passwordStrength < 40) {
      this.strengthLabel = 'Faible';
      this.strengthColor = '#ef4444';
    } else if (this.passwordStrength < 70) {
      this.strengthLabel = 'Moyen';
      this.strengthColor = '#f59e0b';
    } else {
      this.strengthLabel = 'Fort';
      this.strengthColor = '#10b981';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.tokenValid) {
      this.errorMessage =
        'Lien de réinitialisation invalide. Veuillez demander un nouveau lien.';
      return;
    }

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.sub = this.oublierMdpService
      .resetPassword(this.token!, this.resetForm.value.password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          if (response.erreur) {
            this.errorMessage = response.erreur;
            if (response.expired) {
              this.tokenExpired = true;
              this.tokenValid = false;
            }
          } else {
            this.successMessage =
              response.message || 'Mot de passe modifié avec succès !';
            this.resetForm.reset();
            this.submitted = false;
            this.passwordStrength = 0;
            this._startRedirectCountdown();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage =
            err.message || 'Une erreur est survenue. Veuillez réessayer.';
          this.cdr.markForCheck();
        },
      });
  }

  /** Décompte 5s avant redirection vers /login */
  private _startRedirectCountdown(): void {
    this.redirectCountdown = 5;
    this.redirectInterval = setInterval(() => {
      this.redirectCountdown--;
      this.cdr.markForCheck();
      if (this.redirectCountdown <= 0) {
        if (this.redirectInterval) clearInterval(this.redirectInterval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
  // Inside ResetPasswordComponent class

private get passwordValue(): string {
  return this.resetForm?.get('password')?.value || '';
}

hasMinLength(): boolean {
  return this.passwordValue.length >= 8;
}

hasUpperCase(): boolean {
  return /[A-Z]/.test(this.passwordValue);
}

hasLowerCase(): boolean {
  return /[a-z]/.test(this.passwordValue);
}

hasNumber(): boolean {
  return /[0-9]/.test(this.passwordValue);
}

hasSpecialChar(): boolean {
  // Use the same special char regex you had in the template
  return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordValue);
}
}