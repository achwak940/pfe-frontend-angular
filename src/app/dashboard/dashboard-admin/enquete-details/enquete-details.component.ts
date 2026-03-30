import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { EnqueteService } from '../enquete.service';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as html2canvas from 'html2canvas';
import * as jspdf from 'jspdf';

@Component({
  selector: 'app-enquete-details',
  templateUrl: './enquete-details.component.html',
  styleUrls: ['./enquete-details.component.css']
})
export class EnqueteDetailsComponent implements OnInit, AfterViewInit {

  @ViewChild('evolutionCanvas') evolutionCanvas!: ElementRef<HTMLCanvasElement>;
  
  constructor(
    private service: EnqueteService, 
    private route: ActivatedRoute,
    private router: Router
  ) { }
  
  currentUser!: any;
  userID!: number;
  enquetesDetailes: any = null;
  EnqueteId!: number;
  
  // Statistiques dynamiques
  stats: any = {
    totalReponses: 0,
    tauxReponse: 0,
    evolution: [],
    questionsStats: [],
    participationParJour: [],
    tempsMoyenReponse: 0
  };
  
  loadingStats: boolean = false;
  showStatsModal: boolean = false;
  selectedQuestionStats: any = null;
  qrCodeUrl: string = '';
  showQRCode: boolean = false;
  evolutionChartData: any = null;
  chartInstance: any = null;
  
  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userID = this.currentUser.id;
    }
    
    this.EnqueteId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Enquete ID:', this.EnqueteId);
    
    this.loadEnqueteDetails();
  }
  
  ngAfterViewInit(): void {
    // Le graphique sera chargé après les données
  }
  
  loadEnqueteDetails(): void {
    this.service.getAllEnquetesDetails(this.userID, this.EnqueteId).subscribe(
      (res: any) => {
        this.enquetesDetailes = res;
        console.log('Enquête chargée:', res);
        
        // Charger les statistiques si l'enquête est publiée
        if (this.enquetesDetailes.statut === 'Publiée') {
          this.loadStatistics();
        }
      },
      (err) => {
        console.error("Erreur de récupération des enquêtes", err);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de charger les détails de l\'enquête',
          icon: 'error'
        });
      }
    );
  }
  
  // Charger les statistiques dynamiques
  loadStatistics(): void {
    this.loadingStats = true;
    
    // Simuler des données de statistiques (à remplacer par vos appels API réels)
    setTimeout(() => {
      this.stats = {
        totalReponses: Math.floor(Math.random() * 100) + 10,
        tauxReponse: Math.floor(Math.random() * 80) + 20,
        evolution: [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 12 },
          { date: '2024-01-03', count: 8 },
          { date: '2024-01-04', count: 15 },
          { date: '2024-01-05', count: 22 },
          { date: '2024-01-06', count: 18 },
          { date: '2024-01-07', count: 25 }
        ],
        tempsMoyenReponse: Math.floor(Math.random() * 120) + 30,
        questionsStats: this.enquetesDetailes.questions?.map((q: any, index: number) => ({
          questionId: q.id,
          questionText: q.texte,
          reponsesCount: Math.floor(Math.random() * 50) + 5,
          distribution: q.options?.map((opt: any, i: number) => ({
            label: opt.texte,
            count: Math.floor(Math.random() * 30),
            percentage: Math.random() * 100
          })) || []
        }))
      };
      
      this.prepareEvolutionChart();
      this.loadingStats = false;
    }, 1000);
  }
  
  // Préparer les données pour le graphique d'évolution
  prepareEvolutionChart(): void {
    if (this.stats.evolution && this.stats.evolution.length > 0) {
      this.evolutionChartData = {
        labels: this.stats.evolution.map((item: any) => new Date(item.date).toLocaleDateString()),
        datasets: [{
          label: 'Nombre de réponses',
          data: this.stats.evolution.map((item: any) => item.count),
          borderColor: '#9D50BB',
          backgroundColor: 'rgba(157, 80, 187, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
      
      // Dessiner le graphique après un court délai
      setTimeout(() => {
        this.drawChart();
      }, 100);
    }
  }
  
  // Dessiner le graphique (version simplifiée sans bibliothèque externe)
  drawChart(): void {
    const canvas = this.evolutionCanvas?.nativeElement;
    if (!canvas || !this.evolutionChartData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dessiner les axes
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Axe Y
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    // Axe X
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Dessiner les données
    const data = this.evolutionChartData.datasets[0].data;
    const maxValue = Math.max(...data);
    const stepX = chartWidth / (data.length - 1);
    
    ctx.beginPath();
    ctx.strokeStyle = '#9D50BB';
    ctx.lineWidth = 2;
    
    data.forEach((value: number, index: number) => {
      const x = padding + index * stepX;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Ajouter les points
    data.forEach((value: number, index: number) => {
      const x = padding + index * stepX;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      ctx.beginPath();
      ctx.fillStyle = '#9D50BB';
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
  
  // Voir les statistiques d'une question
  viewQuestionStats(question: any): void {
    this.loadingStats = true;
    
    // Simuler des statistiques pour la question
    setTimeout(() => {
      const distribution = question.options?.map((opt: any) => ({
        label: opt.texte,
        count: Math.floor(Math.random() * 50),
        percentage: Math.random() * 100
      })) || [];
      
      this.selectedQuestionStats = {
        question: question,
        stats: {
          totalReponses: distribution.reduce((sum: number, d: any) => sum + d.count, 0),
          tauxReponse: Math.random() * 100,
          distribution: distribution,
          moyenne: question.type === 'rating' ? (Math.random() * 4 + 1) : null
        }
      };
      this.showStatsModal = true;
      this.loadingStats = false;
    }, 500);
  }
  
  // Générer QR Code
  generateQRCode(): void {
    Swal.fire({
      title: 'Génération du QR Code',
      html: 'Génération en cours...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Simuler la génération d'un QR Code
    setTimeout(() => {
      const qrData = `https://votre-app.com/enquete/${this.EnqueteId}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      this.qrCodeUrl = qrCodeUrl;
      this.showQRCode = true;
      
      Swal.close();
      
      Swal.fire({
        title: 'QR Code de l\'enquête',
        html: `
          <div style="text-align: center;">
            <img src="${qrCodeUrl}" style="max-width: 300px; margin: 20px auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <p style="margin-top: 15px;">Scannez ce code pour accéder à l'enquête</p>
            <button id="downloadQR" class="swal2-confirm swal2-styled" style="background-color: #9D50BB; margin-top: 10px;">
              <i class="fas fa-download"></i> Télécharger
            </button>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Fermer',
        didRender: () => {
          const downloadBtn = document.getElementById('downloadQR');
          if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadQRCode();
          }
        }
      });
    }, 1000);
  }
  
  // Télécharger le QR Code
  downloadQRCode(): void {
    if (this.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = this.qrCodeUrl;
      link.download = `qrcode_enquete_${this.EnqueteId}.png`;
      link.click();
    }
  }
  
  // Publier l'enquête
  publishEnquete(): void {
    Swal.fire({
      title: 'Publier l\'enquête ?',
      text: 'Une fois publiée, les utilisateurs pourront y répondre.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9D50BB',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, publier',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Publication en cours...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Simuler la publication
        setTimeout(() => {
          this.enquetesDetailes.statut = 'Publiée';
          Swal.fire({
            title: 'Succès !',
            text: 'L\'enquête a été publiée avec succès',
            icon: 'success'
          });
          this.loadStatistics();
        }, 1000);
      }
    });
  }
  
  // Archiver l'enquête
  archiveEnquete(): void {
    Swal.fire({
      title: 'Archiver l\'enquête ?',
      text: 'L\'enquête sera archivée et ne sera plus accessible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9D50BB',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, archiver',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.enquetesDetailes.statut = 'Archivée';
        Swal.fire({
          title: 'Succès !',
          text: 'L\'enquête a été archivée',
          icon: 'success'
        });
      }
    });
  }
  
  // Partager le lien
  shareLink(): void {
    const url = `${window.location.origin}/repondre/${this.EnqueteId}`;
    
    if (navigator.share) {
      navigator.share({
        title: this.enquetesDetailes?.titre,
        text: this.enquetesDetailes?.description,
        url: url
      }).catch(err => console.log('Erreur partage', err));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          title: 'Lien copié !',
          text: 'Le lien a été copié dans le presse-papier',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      });
    }
  }
  
  // Exporter les résultats en PDF
  exportToPDF(): void {
    const element = document.getElementById('details-content');
    if (element) {
      Swal.fire({
        title: 'Génération du PDF',
        text: 'Veuillez patienter...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      html2canvas.default(element, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const pageHeight = 277;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`enquete_${this.enquetesDetailes?.titre || 'details'}_${this.EnqueteId}.pdf`);
        Swal.close();
        Swal.fire({
          title: 'Succès !',
          text: 'Le PDF a été généré avec succès',
          icon: 'success',
          timer: 2000
        });
      }).catch((error: any) => {
        console.error('Erreur génération PDF', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de générer le PDF',
          icon: 'error'
        });
      });
    }
  }
  
  // Fermer la modal des stats
  closeStatsModal(): void {
    this.showStatsModal = false;
    this.selectedQuestionStats = null;
  }
  
  // Calculer le taux de progression
  getProgressPercentage(question: any): number {
    if (this.stats.totalReponses === 0) return 0;
    const questionStats = this.stats.questionsStats?.find((qs: any) => qs.questionId === question.id);
    return questionStats ? Math.round((questionStats.reponsesCount / this.stats.totalReponses) * 100) : 0;
  }
  
  // Formater la durée
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  }
  
  // Helper pour afficher le type en français
  getTypeLabel(type: string): string {
    const types: {[key: string]: string} = {
      'multiple': 'Choix multiple',
      'unique': 'Choix unique',
      'text': 'Texte libre',
      'rating': 'Évaluation étoiles',
      'scale': 'Échelle linéaire',
      'date': 'Date'
    };
    return types[type] || type;
  }
  
  getStarsArray(maxStars: number): number[] {
    return Array(maxStars || 5).fill(0);
  }
  
  getScalePoints(steps: number): number[] {
    return Array(steps || 5).fill(0);
  }
  
  goBack(): void {
    this.router.navigate(['/gestionEnquete']);
  }
  
  removeEnquete(): void {
    if (this.enquetesDetailes && this.enquetesDetailes.id) {
      const enqueteId = this.enquetesDetailes.id;
      const enqueteNom = this.enquetesDetailes.titre || 'cette enquête';
      
      Swal.fire({
        title: `Supprimer ${enqueteNom} ?`,
        html: `<p>Êtes-vous sûr de vouloir supprimer cette enquête ?</p><p class="text-danger"><strong>Cette action est irréversible !</strong></p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Suppression en cours...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });
          
          this.service.removeEnquete(enqueteId).subscribe(
            (response: any) => {
              Swal.fire({
                title: 'Succès !',
                text: 'L\'enquête a été supprimée avec succès.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              }).then(() => {
                this.router.navigate(['/gestionEnquete']);
              });
            },
            (error: any) => {
              let errorMessage = 'Une erreur est survenue lors de la suppression.';
              if (error.status === 404) errorMessage = 'L\'enquête n\'existe pas ou a déjà été supprimée.';
              else if (error.status === 403) errorMessage = 'Vous n\'avez pas les droits pour supprimer cette enquête.';
              else if (error.status === 500) errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
              
              Swal.fire({
                title: 'Erreur !',
                text: errorMessage,
                icon: 'error'
              });
            }
          );
        }
      });
    }
  }
}