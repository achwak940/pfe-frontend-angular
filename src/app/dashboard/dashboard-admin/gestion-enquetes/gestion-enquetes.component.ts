import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EnqueteService } from '../enquete.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-enquetes',
  templateUrl: './gestion-enquetes.component.html',
  styleUrls: ['./gestion-enquetes.component.css']
})
export class GestionEnquetesComponent implements OnInit {
  currentUser!: any;
  userID!: number;
  enquetes: any[] = [];
  filteredEnquetes: any[] = [];
  stats = {
    fermes: 0,
    publiees: 0,
    brouillons: 0,
    archivees: 0
  };

  // Pour la recherche et le filtre
  searchText: string = '';
  selectedFilter: string = 'Toutes';
  selectedTypeParticipation: string = 'TOUS';
  dateDebut: string = '';
  dateFin: string = '';

  // Statistiques dynamiques globales
  globalStats: any = {
    totalReponses: 0,
    tauxReponseGlobal: 0,
    reponsesParJour: [],
    participationParType: {
      anonyme: 0,
      connecte: 0
    },
    evolutionParMois: []
  };

  loadingStats: boolean = false;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType = 'success';

  constructor(private service: EnqueteService, private router: Router) { }

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userID = this.currentUser.id;
    }

    this.loadEnquetes();
    this.loadGlobalStats();
  }

  loadEnquetes(): void {
    this.service.getAllEnquete(this.userID).subscribe(
      (res: any[]) => {
        this.enquetes = res;
        this.updateStats();
        this.applyFilters();
      },
      (err) => {
        console.error("Erreur de récupération des enquêtes", err);
        this.showToastMessage('Erreur de chargement des enquêtes', 'error');
      }
    );
  }

  // Charger les statistiques globales depuis l'API
  loadGlobalStats(): void {
    this.loadingStats = true;
    
    // Récupérer les statistiques globales
    this.service.getTauxReponseAdmin(this.userID).subscribe(
      (res: any) => {
        this.globalStats.tauxReponseGlobal = res.taux_reponse || 0;
      },
      (err) => {
        console.error('Erreur chargement taux réponse', err);
      }
    );

    // Récupérer le nombre total de participants
    this.service.getNombreParticipants(this.userID).subscribe(
      (res: any) => {
        this.globalStats.totalReponses = res.totalusers || 0;
      },
      (err) => {
        console.error('Erreur chargement participants', err);
      }
    );

    // Récupérer l'évolution des réponses
    this.service.getEvolutionReponsesAdmin(this.userID).subscribe(
      (res: any[]) => {
        this.globalStats.reponsesParJour = res || [];
        this.prepareEvolutionData();
      },
      (err) => {
        console.error('Erreur chargement évolution', err);
        this.loadingStats = false;
      }
    );

    // Récupérer les statistiques par type de participation
    setTimeout(() => {
      this.globalStats.participationParType = {
        anonyme: this.enquetes.filter(e => e.typeParticipation === 'ANONYME').length,
        connecte: this.enquetes.filter(e => e.typeParticipation === 'CONNECTE' || !e.typeParticipation).length
      };
      this.loadingStats = false;
    }, 1000);
  }

  prepareEvolutionData(): void {
    // Traiter les données d'évolution pour le graphique
    if (this.globalStats.reponsesParJour && this.globalStats.reponsesParJour.length > 0) {
      const groupedByMonth = this.groupByMonth(this.globalStats.reponsesParJour);
      this.globalStats.evolutionParMois = groupedByMonth;
    }
  }

  groupByMonth(data: any[]): any[] {
    const months: { [key: string]: number } = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += item.count;
    });
    
    return Object.keys(months).map(key => ({
      month: key,
      monthName: this.getMonthName(key),
      count: months[key]
    }));
  }

  getMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  }

  updateStats(): void {
    this.stats.fermes = this.enquetes.filter(e => e.statut === 'Fermee').length;
    this.stats.publiees = this.enquetes.filter(e => e.statut === 'Publiée').length;
    this.stats.brouillons = this.enquetes.filter(e => e.statut === 'Brouillon').length;
    this.stats.archivees = this.enquetes.filter(e => e.statut === 'Archivée').length;
  }

  // Appliquer tous les filtres
  applyFilters(): void {
    let filtered = [...this.enquetes];

    // Filtre par statut
    if (this.selectedFilter !== 'Toutes') {
      filtered = filtered.filter(e => {
        const statut = e.statut?.toLowerCase().trim();
        const filterStatut = this.selectedFilter.toLowerCase().trim();
        
        if (filterStatut === 'fermee') return statut === 'fermee';
        if (filterStatut === 'publiée') return statut === 'publiée';
        if (filterStatut === 'brouillon') return statut === 'brouillon';
        if (filterStatut === 'archivée') return statut === 'archivée';
        
        return false;
      });
    }

    // Filtre par type de participation
    if (this.selectedTypeParticipation !== 'TOUS') {
      filtered = filtered.filter(e => {
        const typeParticipation = e.typeParticipation?.toUpperCase().trim();
        return typeParticipation === this.selectedTypeParticipation;
      });
    }

    // Filtre par recherche texte
    if (this.searchText.trim() !== '') {
      const text = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(e =>
        (e.titre?.toLowerCase() || '').includes(text) ||
        (e.description?.toLowerCase() || '').includes(text) ||
        (e.id?.toString() || '').includes(text)
      );
    }

    // Filtre par date
    if (this.dateDebut || this.dateFin) {
      filtered = filtered.filter(e => {
        if (!e.createAt) return true;
        
        const dateCreation = new Date(e.createAt);
        dateCreation.setHours(0, 0, 0, 0);
        
        if (this.dateDebut) {
          const debut = new Date(this.dateDebut);
          debut.setHours(0, 0, 0, 0);
          if (dateCreation < debut) return false;
        }
        
        if (this.dateFin) {
          const fin = new Date(this.dateFin);
          fin.setHours(23, 59, 59, 999);
          if (dateCreation > fin) return false;
        }
        
        return true;
      });
    }

    this.filteredEnquetes = filtered;
  }

  // Méthode appelée quand le filtre de statut change
  onStatutFilterChange(statut: string): void {
    this.selectedFilter = statut;
    this.applyFilters();
  }

  // Méthode appelée quand le filtre de type de participation change
  onTypeParticipationChange(type: string): void {
    this.selectedTypeParticipation = type;
    this.applyFilters();
  }

  // Vérifier si un filtre est actif
  isFilterActive(): boolean {
    return this.searchText.trim() !== '' || 
           this.selectedFilter !== 'Toutes' || 
           this.selectedTypeParticipation !== 'TOUS' || 
           this.dateDebut !== '' || 
           this.dateFin !== '';
  }

  // Réinitialiser tous les filtres
  clearAllFilters(): void {
    this.searchText = '';
    this.selectedFilter = 'Toutes';
    this.selectedTypeParticipation = 'TOUS';
    this.dateDebut = '';
    this.dateFin = '';
    this.applyFilters();
    this.showToastMessage('Filtres réinitialisés', 'success');
  }

  // Effacer la recherche
  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  // Appliquer le filtre de date
  applyDateFilter(): void {
    this.applyFilters();
  }

  // Effacer le filtre de date
  clearDateFilter(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.applyFilters();
  }

  // Input search
  onSearchInput(): void {
    this.applyFilters();
  }

  // Supprimer une enquête
  deleteEnquete(id: any): void {
    Swal.fire({
      title: 'Confirmation de suppression',
      text: 'Voulez-vous vraiment supprimer cette enquête ? Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.removeEnquete(id).subscribe(
          (res) => {
            this.enquetes = this.enquetes.filter(e => e.id !== id);
            this.updateStats();
            this.applyFilters();
            this.loadGlobalStats(); // Recharger les stats globales
            this.showToastMessage('Enquête supprimée avec succès', 'success');
          },
          (err) => {
            console.error('Erreur lors de la suppression', err);
            this.showToastMessage('Erreur lors de la suppression', 'error');
          }
        );
      }
    });
  }

  // Publier une enquête
  publishEnquete(enquete: any): void {
    Swal.fire({
      title: 'Publier l\'enquête',
      text: `Voulez-vous publier l'enquête "${enquete.titre}" ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9D50BB',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, publier',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.publishEnquete(enquete.id).subscribe(
          (res) => {
            enquete.statut = 'Publiée';
            this.updateStats();
            this.applyFilters();
            this.showToastMessage('Enquête publiée avec succès', 'success');
          },
          (err) => {
            console.error('Erreur lors de la publication', err);
            this.showToastMessage('Erreur lors de la publication', 'error');
          }
        );
      }
    });
  }

  // Voir les statistiques d'une enquête
  viewStats(enquete: any): void {
    this.router.navigate(['/DetailEnquete', enquete.id]);
  }

  // Afficher un toast
  showToastMessage(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  // Statistiques calculées dynamiquement
  calculateTotalResponses(): number {
    return this.globalStats.totalReponses;
  }

  calculateResponseRate(): number {
    return this.globalStats.tauxReponseGlobal;
  }

  getAnonymePercentage(): number {
    const total = this.enquetes.length;
    if (total === 0) return 0;
    const anonymeCount = this.enquetes.filter(e => e.typeParticipation === 'ANONYME').length;
    return Math.round((anonymeCount / total) * 100);
  }

  getConnectePercentage(): number {
    const total = this.enquetes.length;
    if (total === 0) return 0;
    const connecteCount = this.enquetes.filter(e => e.typeParticipation === 'CONNECTE' || !e.typeParticipation).length;
    return Math.round((connecteCount / total) * 100);
  }

  getAnonymeDashArray(): string {
    const percentage = this.getAnonymePercentage();
    const circumference = 2 * Math.PI * 40;
    return (percentage / 100 * circumference).toString();
  }

  getConnecteDashArray(): string {
    const percentage = this.getConnectePercentage();
    const circumference = 2 * Math.PI * 40;
    return (percentage / 100 * circumference).toString();
  }

  getConnecteDashOffset(): string {
    const anonymePercentage = this.getAnonymePercentage();
    const circumference = 2 * Math.PI * 40;
    return (anonymePercentage / 100 * circumference).toString();
  }

  // Méthode pour obtenir le maximum des réponses pour le graphique
  getMaxReponses(): number {
    if (!this.globalStats.evolutionParMois || this.globalStats.evolutionParMois.length === 0) return 100;
    return Math.max(...this.globalStats.evolutionParMois.map((item: any) => item.count), 100);
  }
}