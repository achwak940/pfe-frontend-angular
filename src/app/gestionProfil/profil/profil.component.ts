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
        // Vérifier si les données sont dans data.profil ou directement dans data
        if (data && data.profil) {
          this.userInfo = data.profil;
        } else if (data) {
          this.userInfo = data;
        }
        
        this.isLoading = false;
        
        // Mettre à jour localStorage avec les dernières données
        if (this.userInfo) {
          localStorage.setItem('currentUser', JSON.stringify(this.userInfo));
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.errorMessage = err.error?.message || 'Impossible de charger les informations du profil';
        this.isLoading = false;
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Helper method pour afficher la photo de profil
  getPhotoUrl(): string {
    if (this.userInfo?.photo_profil) {
      return `http://localhost:3000/${this.userInfo.photo_profil}`;
    }
    return 'assets/default-avatar.png';
  }
}