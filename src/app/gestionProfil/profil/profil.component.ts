import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  
  userId: number = 0;
  currentUser: any = null;
  userInfo: UserInfo | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  debugInfo: string = ''; // Pour le débogage

  constructor(
    private service: GereProfilService, 
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    // Récupérer l'utilisateur depuis localStorage
    const user = localStorage.getItem('currentUser');
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = JSON.parse(user);
    this.userId = this.currentUser.id;
    this.debugInfo += `User ID: ${this.userId}\n`;
    
    if (this.userId) {
      this.getProfilUser();
    } else {
      this.errorMessage = 'ID utilisateur non trouvé';
      this.isLoading = false;
    }
  }

  getProfilUser(): void {
    this.isLoading = true;
    
    this.service.consulterProfil(this.userId).subscribe({
      next: (data: any) => {
        console.log('Données reçues du backend:', data); // Log complet
        
        // Vérifier si les données sont dans data.profil ou directement dans data
        if (data && data.profil) {
          this.userInfo = data.profil;
        } else if (data) {
          this.userInfo = data;
        }
        
        // Ajouter des informations de débogage
        this.debugInfo += `Photo path from backend: ${this.userInfo?.photo_profil}\n`;
        this.debugInfo += `Full URL: ${this.getPhotoUrl()}\n`;
        
        console.log('Photo path:', this.userInfo?.photo_profil);
        console.log('Photo URL:', this.getPhotoUrl());
        
        this.isLoading = false;
        
        // Mettre à jour localStorage avec les dernières données
        if (this.userInfo) {
          localStorage.setItem('currentUser', JSON.stringify(this.userInfo));
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.errorMessage = err.error?.message || 'Impossible de charger les informations du profil';
        this.debugInfo += `Erreur: ${this.errorMessage}\n`;
        this.isLoading = false;
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Méthode améliorée pour afficher la photo de profil avec plus de cas
  getPhotoUrl(): string {
    if (!this.userInfo?.photo_profil) {
      console.log('Pas de photo de profil, utilisation de default-avatar.png');
      return 'assets/default-avatar.png';
    }
    
    let photoPath = this.userInfo.photo_profil;
    console.log('Photo path original:', photoPath);
    
    // Normaliser le chemin (enlever les slashes au début si présents)
    if (photoPath.startsWith('/')) {
      photoPath = photoPath.substring(1);
    }
    
    // Cas 1: Chemin complet avec http:// ou https://
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // Cas 2: Chemin commence par 'uploads/'
    if (photoPath.startsWith('uploads/')) {
      return `http://localhost:3000/${photoPath}`;
    }
    
    // Cas 3: Chemin commence par 'profiles/'
    if (photoPath.startsWith('profiles/')) {
      return `http://localhost:3000/uploads/${photoPath}`;
    }
    
    // Cas 4: Juste le nom du fichier
    return `http://localhost:3000/uploads/profiles/${photoPath}`;
  }

  // Méthode pour tester si l'image existe
  testImageUrl(url: string): void {
    const img = new Image();
    img.onload = () => {
      console.log('Image chargée avec succès:', url);
      this.debugInfo += `✓ Image chargée: ${url}\n`;
    };
    img.onerror = () => {
      console.error('Erreur chargement image:', url);
      this.debugInfo += `✗ Erreur chargement: ${url}\n`;
    };
    img.src = url;
  }

  // Forcer le rechargement de l'image
  reloadImage(): void {
    const imgElement = document.querySelector('.profile-image') as HTMLImageElement;
    if (imgElement) {
      const currentUrl = imgElement.src;
      imgElement.src = '';
      setTimeout(() => {
        imgElement.src = currentUrl + '?t=' + new Date().getTime();
      }, 100);
    }
  }
}