import { Component, OnInit } from '@angular/core';
import { DashboardAdminService } from '../dashboard-admin.service';

@Component({
  selector: 'app-gestion-enquetes',
  templateUrl: './gestion-enquetes.component.html',
  styleUrls: ['./gestion-enquetes.component.css']
})
export class GestionEnquetesComponent implements OnInit {

  enquetes: any[] = [];
  stats = {
    actives: 0,
    publiees: 0,
    brouillons: 0
  };

  // Pour la recherche et le filtre
  searchText: string = '';
  selectedFilter: string = 'Toutes';

  constructor(private service: DashboardAdminService) { }

  ngOnInit(): void {
    const userID = 6; // remplacer par l'ID réel connecté
    this.service.getAllEnquete(userID).subscribe(
      (res: any[]) => {
        this.enquetes = res;

        // Calcul des stats
        this.stats.actives = res.filter(e => e.statut === 'Fermee').length;
        this.stats.publiees = res.filter(e => e.statut === 'Publiée').length;
        this.stats.brouillons = res.filter(e => e.statut === 'Brouillon').length;
      },
      (err) => console.error("Erreur de récupération des enquêtes", err)
    );
  }

  // Filtrer les enquêtes par statut
  filterByStatut(statut: string) {
    let filtered = this.enquetes;

    if (statut !== 'Toutes') {
      filtered = filtered.filter(e => e.statut === statut);
    }

    // Filtre par recherche
    if (this.searchText.trim() !== '') {
      const text = this.searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.titre.toLowerCase().includes(text) ||
        e.description.toLowerCase().includes(text) ||
        e.id.toString().includes(text)
      );
    }

    return filtered;
  }

  // Supprimer une enquête (juste mock ici)
  deleteEnquete(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cette enquête ?')) {
      this.enquetes = this.enquetes.filter(e => e.id !== id);

      // Recalcul des stats
      this.stats.actives = this.enquetes.filter(e => e.statut === 'Fermee').length;
      this.stats.publiees = this.enquetes.filter(e => e.statut === 'Publiée').length;
      this.stats.brouillons = this.enquetes.filter(e => e.statut === 'Brouillon').length;
    }
  }
  // Propriétés à ajouter
showModal = false;
showToast = false;
toastMessage = '';
toastType = 'success';

// Méthodes pour les statistiques
calculateTotalResponses(): number {
  return this.enquetes.reduce((total, e) => total + (e.participants || 0), 0);
}

calculateResponseRate(): number {
  const totalParticipants = this.enquetes.reduce((total, e) => total + (e.totalParticipants || 0), 0);
  const totalResponses = this.calculateTotalResponses();
  return totalParticipants > 0 ? Math.round((totalResponses / totalParticipants) * 100) : 0;
}

getAnonymePercentage(): number {
  const anonymeCount = this.enquetes.filter(e => e.typeParticipation === 'anonyme').length;
  return this.enquetes.length > 0 ? Math.round((anonymeCount / this.enquetes.length) * 100) : 0;
}

getConnectePercentage(): number {
  const connecteCount = this.enquetes.filter(e => e.typeParticipation === 'connecte' || !e.typeParticipation).length;
  return this.enquetes.length > 0 ? Math.round((connecteCount / this.enquetes.length) * 100) : 0;
}

getAnonymeDashArray(): string {
  const percentage = this.getAnonymePercentage();
  const circumference = 2 * Math.PI * 40; // r=40
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

// Méthodes utilitaires
copyLink(enqueteId: string): void {
  navigator.clipboard.writeText(`https://survey.app/${enqueteId.toLowerCase()}`);
  this.showToastMessage('Lien copié dans le presse-papier !', 'success');
}

closeModal(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    this.showModal = false;
  }
}

showToastMessage(message: string, type: string = 'success'): void {
  this.toastMessage = message;
  this.toastType = type;
  this.showToast = true;
  
  setTimeout(() => {
    this.showToast = false;
  }, 3000);
}

// Pour ouvrir le modal
openNewSurveyModal(): void {
  this.showModal = true;
}
}