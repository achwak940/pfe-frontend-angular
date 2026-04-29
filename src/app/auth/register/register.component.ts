import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RegisterService } from '../register.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  profilePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isReset = false; // Nouvelle variable pour gérer l'état de reset
  
  passwordStrength = {
    level: 0,
    text: 'Very Weak',
    class: 'very-weak'
  };

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder, 
    private registerService: RegisterService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registerForm = this.fb.group({
      prenom: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      ]],
      nom: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      telephone: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{8,}$/)
      ]],
      mot_de_passe: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(50),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });

    this.registerForm.get('mot_de_passe')?.valueChanges.subscribe(() => {
      if (!this.isReset) {
        this.updatePasswordStrength();
      }
    });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('mot_de_passe')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  triggerFileUpload(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        this.showErrorSweet('File size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showErrorSweet('Only JPEG, PNG, JPG, GIF, and WEBP files are allowed');
        return;
      }
      
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreview = reader.result;
      };
      reader.onerror = () => {
        this.showErrorSweet('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.profilePreview = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  updatePasswordStrength(): void {
    const password = this.registerForm.get('mot_de_passe')?.value || '';
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    
    let level = 0;
    if (strength >= 4) level = 1;
    if (strength >= 5) level = 2;
    if (strength >= 6) level = 3;
    if (strength >= 7 && password.length >= 12) level = 4;
    
    this.passwordStrength.level = level;
    
    switch(level) {
      case 0:
        this.passwordStrength.text = 'Very Weak';
        this.passwordStrength.class = 'very-weak';
        break;
      case 1:
        this.passwordStrength.text = 'Weak';
        this.passwordStrength.class = 'weak';
        break;
      case 2:
        this.passwordStrength.text = 'Fair';
        this.passwordStrength.class = 'fair';
        break;
      case 3:
        this.passwordStrength.text = 'Good';
        this.passwordStrength.class = 'good';
        break;
      case 4:
        this.passwordStrength.text = 'Strong';
        this.passwordStrength.class = 'strong';
        break;
    }
  }

  handleLogoError(): void {
    console.warn('Logo image not found at assets/images/logo.png');
  }

  showTerms(event: Event): void {
    event.preventDefault();
    Swal.fire({
      title: 'Terms and Conditions',
      html: `
        <div style="text-align: left;">
          <h3>1. Acceptance of Terms</h3>
          <p>By creating an account, you agree to these terms.</p>
          <h3>2. Privacy Policy</h3>
          <p>We are committed to protecting your personal data.</p>
          <h3>3. Account Responsibility</h3>
          <p>You are responsible for maintaining your account security.</p>
          <h3>4. Acceptable Use</h3>
          <p>You agree to use our services lawfully and appropriately.</p>
          <h3>5. Termination</h3>
          <p>We reserve the right to suspend accounts violating these terms.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'I Understand',
      confirmButtonColor: '#667eea',
      width: '600px'
    });
  }

  showErrorSweet(message: string): void {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#667eea',
      timer: 3000,
      timerProgressBar: true
    });
  }

  showSuccessSweet(message: string): void {
    Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      confirmButtonText: 'Go to Login',
      confirmButtonColor: '#667eea',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: true
    }).then((result) => {
      if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
        this.router.navigate(['/login']);
      }
    });
  }

  resetFormState(): void {
    // Marquer le reset
    this.isReset = true;
    
    // Réinitialiser les variables
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoading = false;
    this.showPassword = false;
    this.showConfirmPassword = false;
    
    // Réinitialiser le formulaire
    this.registerForm.reset({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      mot_de_passe: '',
      confirmPassword: '',
      acceptTerms: false
    });
    
    // Réinitialiser les erreurs du formulaire
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.controls[key].setErrors(null);
      this.registerForm.controls[key].markAsPristine();
      this.registerForm.controls[key].markAsUntouched();
    });
    
    // Réinitialiser la force du mot de passe
    this.passwordStrength = {
      level: 0,
      text: 'Very Weak',
      class: 'very-weak'
    };
    
    // Supprimer la photo
    this.removePhoto();
    
    // Attendre un tick pour désactiver le mode reset
    setTimeout(() => {
      this.isReset = false;
    }, 100);
  }

  submit(): void {
    // Réinitialiser les messages
    this.successMessage = '';
    this.errorMessage = '';
    
    // Marquer comme soumis
    this.submitted = true;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Vérifier si le formulaire est invalide
    if (this.registerForm.invalid) {
      const firstError = this.getFirstFormError();
      if (firstError) {
        this.showErrorSweet(firstError);
      }
      this.isLoading = false;
      return;
    }

    // Afficher le loader
    this.isLoading = true;

    // Préparer les données
    const formData = new FormData();
    formData.append('prenom', this.registerForm.get('prenom')?.value);
    formData.append('nom', this.registerForm.get('nom')?.value);
    formData.append('email', this.registerForm.get('email')?.value);
    formData.append('telephone', this.registerForm.get('telephone')?.value);
    formData.append('mot_de_passe', this.registerForm.get('mot_de_passe')?.value);
    
    if (this.selectedFile) {
      formData.append('photo_profil', this.selectedFile);
    }

    // Appel API
    this.registerService.registerUtilisateur(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        if (res && res.erreur) {
          const errorMsg = res.erreur.toLowerCase();
          if (errorMsg.includes('email')) {
            this.registerForm.controls['email'].setErrors({ serverError: res.erreur });
            this.showErrorSweet(res.erreur);
          } else if (errorMsg.includes('telephone') || errorMsg.includes('phone')) {
            this.registerForm.controls['telephone'].setErrors({ serverError: res.erreur });
            this.showErrorSweet(res.erreur);
          } else {
            this.showErrorSweet(res.erreur);
          }
        } else if (res && res.message) {
          this.successMessage = res.message || 'Registration successful!';
          
          // Afficher le message de succès avec SweetAlert
          Swal.fire({
            title: '🎉 Registration Successful!',
            html: `
              <div style="padding: 10px;">
                <p style="font-size: 16px; color: #2d3748;">${this.successMessage}</p>
                <div style="margin-top: 20px; padding: 10px; background: #f0fff4; border-radius: 10px;">
                  <p style="color: #38a169; font-size: 14px;">✓ Account created successfully</p>
                  <p style="color: #38a169; font-size: 14px;">✓ Welcome to our community</p>
                  <p style="color: #38a169; font-size: 14px;">✓ Redirecting to login...</p>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Go to Login',
            confirmButtonColor: '#667eea',
            background: '#ffffff',
            timer: 4000,
            timerProgressBar: true,
            showConfirmButton: true
          }).then((result) => {
            if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
              // Réinitialiser complètement le formulaire avant la navigation
              this.resetFormState();
              this.router.navigate(['/login']);
            }
          });
        } else {
          this.showSuccessSweet('Registration successful! Redirecting to login...');
          this.resetFormState();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Registration error:', err);
        
        let errorMessage = 'An error occurred. Please try again.';
        
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (err.status === 409) {
          errorMessage = 'This email is already registered. Please use another one.';
        } else if (err.status === 400) {
          errorMessage = 'Invalid data. Please check your information.';
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.showErrorSweet(errorMessage);
      }
    });
  }

  getFirstFormError(): string | null {
    const controls = this.registerForm.controls;
    
    for (const name in controls) {
      if (controls[name].errors) {
        const errors = controls[name].errors;
        
        if (errors?.['required']) {
          return `The field ${this.getFieldName(name)} is required.`;
        }
        if (errors?.['email']) {
          return 'Please enter a valid email address.';
        }
        if (errors?.['minlength']) {
          return `The field ${this.getFieldName(name)} must contain at least ${errors['minlength'].requiredLength} characters.`;
        }
        if (errors?.['maxlength']) {
          return `The field ${this.getFieldName(name)} cannot exceed ${errors['maxlength'].requiredLength} characters.`;
        }
        if (errors?.['pattern']) {
          if (name === 'prenom' || name === 'nom') {
            return `${this.getFieldName(name)} should contain only letters.`;
          }
          if (name === 'mot_de_passe') {
            return 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character.';
          }
          if (name === 'telephone') {
            return 'Phone number must contain at least 8 digits.';
          }
        }
        if (errors?.['passwordsMismatch']) {
          return 'Passwords do not match.';
        }
        if (errors?.['serverError']) {
          return errors['serverError'];
        }
      }
    }
    
    if (this.registerForm.errors?.['passwordsMismatch']) {
      return 'Passwords do not match.';
    }
    
    return null;
  }

  getFieldName(field: string): string {
    const names: { [key: string]: string } = {
      prenom: 'first name',
      nom: 'last name',
      email: 'email',
      telephone: 'phone number',
      mot_de_passe: 'password',
      confirmPassword: 'confirm password',
      acceptTerms: 'acceptance of terms'
    };
    return names[field] || field;
  }

  navigateToLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  get passwordsMismatch(): boolean {
    const password = this.registerForm.get('mot_de_passe');
    const confirm = this.registerForm.get('confirmPassword');
    return this.submitted && !this.isReset && password?.value && confirm?.value && 
           password.value !== confirm.value;
  }
}