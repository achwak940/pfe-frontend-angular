import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { GereProfilService } from '../gere-profil.service';

interface UserInfo {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  photo_profil: string;
  role: string;
  statut: string;
  est_verifie: boolean;
  date_creation: string;
  date_modification: string;
}

@Component({
  selector: 'app-modfifier-profil',
  templateUrl: './modfifier-profil.component.html',
  styleUrls: ['./modfifier-profil.component.css']
})
export class ModfifierProfilComponent implements OnInit {
  
  profileForm!: FormGroup;
  submitted = false;
  isLoading = false;
  isLoadingData = true; // Ajout de cette propriété
  errorMessage: string = ''; // Ajout pour les erreurs
  userInfo: UserInfo | null = null;
  photoPreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  userId: number = 0;
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private profilService: GereProfilService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoadingData = true;
    
    // Récupérer l'ID utilisateur
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = JSON.parse(storedUser);
    this.userId = currentUser.id;

    // Appel API pour récupérer les données
    this.profilService.consulterProfil(this.userId).subscribe({
      next: (response: any) => {
        // Vérifier la structure de la réponse
        if (response && response.profil) {
          this.userInfo = response.profil;
        } else if (response) {
          this.userInfo = response;
        }
        
        this.isLoadingData = false;
        this.initializeForm();
        
        // Définir la prévisualisation de la photo
        if (this.userInfo?.photo_profil) {
          this.photoPreview = `http://localhost:3000/${this.userInfo.photo_profil}`;
        }
      },
      error: (err: any) => {
        this.isLoadingData = false;
        this.errorMessage = err.error?.message || 'Impossible de charger vos informations';
        console.error('Erreur:', err);
        
        Swal.fire({
          title: 'Erreur!',
          text: this.errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#667eea'
        });
      }
    });
  }

  initializeForm(): void {
    this.profileForm = this.fb.group({
      prenom: [this.userInfo?.prenom || '', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      ]],
      nom: [this.userInfo?.nom || '', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      ]],
      email: [this.userInfo?.email || '', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      telephone: [this.userInfo?.telephone || '', [
        Validators.required,
        Validators.pattern(/^[0-9]{8,}$/)
      ]]
    });
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        this.showError('La taille du fichier doit être inférieure à 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Formats acceptés: JPEG, PNG, JPG, WEBP');
        return;
      }
      
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result;
      };
      reader.onerror = () => {
        this.showError('Erreur lors de la lecture du fichier');
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.profileForm.invalid) {
      const firstError = this.getFirstFormError();
      if (firstError) {
        this.showError(firstError);
      }
      return;
    }

    this.isLoading = true;

    const updatedData: any = {
      prenom: this.profileForm.get('prenom')?.value,
      nom: this.profileForm.get('nom')?.value,
      email: this.profileForm.get('email')?.value,
      telephone: this.profileForm.get('telephone')?.value
    };

    this.profilService.updateUser(this.userId, updatedData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // Mettre à jour localStorage
        const updatedUser = {
          ...this.userInfo,
          prenom: updatedData.prenom,
          nom: updatedData.nom,
          email: updatedData.email,
          telephone: updatedData.telephone,
          date_modification: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        Swal.fire({
          title: 'Succès!',
          text: 'Votre profil a été modifié avec succès',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#667eea',
          timer: 2000,
          timerProgressBar: true
        }).then(() => {
          this.goBack();
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        
        let errorMessage = 'Erreur lors de la mise à jour';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 409) {
          errorMessage = 'Cet email est déjà utilisé';
        } else if (err.status === 400) {
          errorMessage = 'Données invalides';
        }
        
        this.showError(errorMessage);
      }
    });
  }

  getFirstFormError(): string | null {
    const controls = this.profileForm.controls;
    
    for (const name in controls) {
      if (controls[name].errors) {
        const errors = controls[name].errors;
        
        if (errors?.['required']) {
          return `Le champ ${this.getFieldName(name)} est requis.`;
        }
        if (errors?.['email']) {
          return 'Veuillez entrer une adresse email valide.';
        }
        if (errors?.['minlength']) {
          return `Le champ ${this.getFieldName(name)} doit contenir au moins ${errors['minlength'].requiredLength} caractères.`;
        }
        if (errors?.['pattern']) {
          if (name === 'prenom' || name === 'nom') {
            return `Le ${this.getFieldName(name)} ne doit contenir que des lettres.`;
          }
          if (name === 'telephone') {
            return 'Le numéro de téléphone doit contenir au moins 8 chiffres.';
          }
        }
      }
    }
    return null;
  }

  getFieldName(field: string): string {
    const names: { [key: string]: string } = {
      prenom: 'prénom',
      nom: 'nom',
      email: 'email',
      telephone: 'téléphone'
    };
    return names[field] || field;
  }

  showError(message: string): void {
    Swal.fire({
      title: 'Erreur!',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#667eea'
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}