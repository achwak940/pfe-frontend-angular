// oublier-mdp.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';
import { ForgotPasswordResponse, OublierMdpService } from '../oublier-mdp.service';


@Component({
  selector: 'app-oublier-mdp',
  templateUrl: './oublier-mdp.component.html',
  styleUrls: ['./oublier-mdp.component.css'],
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
            style({ transform: 'translateX(2px)', offset: 0.6 }),
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
      state(
        'active',
        style({
          boxShadow: '0 4px 16px rgba(157,80,187,0.35)',
        }),
      ),
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
export class OublierMdpComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  emailFocus = false;

  // ── Renvoi avec compteur 5 minutes ────────────────────────────────────────
  resendAvailable = false;
  /** Délai total en secondes (300 = 5 min, configurable) */
  readonly RESEND_DELAY_SECONDS = 300;
  resendCooldown = this.RESEND_DELAY_SECONDS;
  timerProgress = 100; // 100 → 0 %
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // Countdown affiché en mm:ss
  get resendCountdownDisplay(): string {
    const m = Math.floor(this.resendCooldown / 60);
    const s = this.resendCooldown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 15,
  }));

  private sub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private oublierMdpService: OublierMdpService,
    private cdr: ChangeDetectorRef,
  ) {
    this.resetForm = this.fb.group({
      email: [
        '',
        {
          validators: [Validators.required, Validators.email],
          updateOn: 'blur',
        },
      ],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this._clearTimer();
  }

  get f() {
    return this.resetForm.controls;
  }

  // ── Soumission du formulaire ───────────────────────────────────────────────
  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const email: string = this.resetForm.value.email.trim();

    this.sub = this.oublierMdpService
      .forgotPassword(email)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: ForgotPasswordResponse) => {
          if (response.erreur) {
            // Le backend a renvoyé une erreur (ex: délai de renvoi non respecté)
            this.errorMessage = response.erreur;
            if (response.remainingSeconds) {
              // Reprendre le timer là où il en était côté serveur
              this._startTimer(response.remainingSeconds);
            }
          } else {
            // Succès
            this.successMessage =
              response.message ||
              'Un lien de réinitialisation a été envoyé à votre adresse email.';
            this.resetForm.reset();
            this.submitted = false;
            this._startTimer(this.RESEND_DELAY_SECONDS);
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

  // ── Renvoi du lien ─────────────────────────────────────────────────────────
  resendLink(): void {
    if (!this.resendAvailable) return;
    this._clearTimer();
    this.resendAvailable = false;
    this.resendCooldown = this.RESEND_DELAY_SECONDS;
    this.timerProgress = 100;
    this.onSubmit();
  }

  // ── Timer interne ──────────────────────────────────────────────────────────
  private _startTimer(seconds: number): void {
    this._clearTimer();
    this.resendAvailable = false;
    this.resendCooldown = seconds;
    this.timerProgress = (seconds / this.RESEND_DELAY_SECONDS) * 100;

    this.timerInterval = setInterval(() => {
      this.resendCooldown--;
      this.timerProgress =
        (this.resendCooldown / this.RESEND_DELAY_SECONDS) * 100;

      if (this.resendCooldown <= 0) {
        this._clearTimer();
        this.resendAvailable = true;
        this.resendCooldown = 0;
        this.timerProgress = 0;
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private _clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}