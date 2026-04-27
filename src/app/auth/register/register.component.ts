import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterService } from '../register.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  successMessage = '';
  isLoading = false;
  showPassword = false;
  profilePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  
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
    this.registerForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
      ]],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, JPG, and GIF files are allowed');
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreview = reader.result;
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

  updatePasswordStrength(): void {
    const password = this.registerForm.get('mot_de_passe')?.value || '';
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    
    // Normalize strength level (0-4)
    let level = 0;
    if (strength >= 3) level = 1;
    if (strength >= 4) level = 2;
    if (strength >= 5) level = 3;
    if (strength >= 6 && password.length >= 12) level = 4;
    
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

  submit() {
    this.submitted = true;
    this.successMessage = '';
    this.isLoading = true;

    if (this.registerForm.invalid) {
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    formData.append('prenom', this.registerForm.get('prenom')?.value);
    formData.append('nom', this.registerForm.get('nom')?.value);
    formData.append('email', this.registerForm.get('email')?.value);
    formData.append('mot_de_passe', this.registerForm.get('mot_de_passe')?.value);
    
    if (this.selectedFile) {
      formData.append('photo_profil', this.selectedFile);
    }

    this.registerService.registerUtilisateur(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        if (res.erreur) {
          if (res.erreur.includes("email")) {
            this.registerForm.controls['email'].setErrors({ serverError: res.erreur });
          } else {
            alert(res.erreur);
          }
        } else {
          this.successMessage = res.message || 'Registration successful!';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert("Server error: " + (err.error?.message || err.message));
      }
    });
  }

  navigateToLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }
}