// src/app/dashboard/dashboard-admin/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { StatistiquesService } from '../statistiques.service';
import { EnqueteService } from '../enquete.service';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  // Variables existantes
  nombreUsersActifs!: number;
  currentUser!: any;
  userId!: number;
  msg!: string;
  nombreUsers!: number;
  utilisateurs: any[] = [];
  clients: any[] = [];
  titreEnquetes: any[] = [];
  taux_reponse!: number;
  rechText: string = '';
  utilisateursFiltres: any[] = [];
  nombreUsersNouveaux!: number;
  utilisateurSelectionnes: Set<number> = new Set<number>();
  exportDropdownVisible = false;

  // Variables pour le partage
  showShareModal = false;
  selectedEnqueteId: number | null = null;
  selectedEnqueteTitre: string = '';
  selectedEnqueteDescription: string = '';
  shareUrl: string = '';
  qrCodeUrl: string = '';
  shareLinks: any = {};
  emailMessage: string = '';
  showToast = false;
  toastMessage = '';
  isNativeShareAvailable = false;
  shareDropdownOpen: number | null = null;
  selectedSurveyId: number | null = null;
  whatsappMessage: string = '';
  instagramLinkCopied = false;

  constructor(
    private service: StatistiquesService,
    private serviceEnquete: EnqueteService,
    private serviceExport: UsersService,
  ) {}

  ngOnInit(): void {
    this.getNombreUsersActis();
    this.getNombreUsers();
    this.getAllUsersConnecte();
    this.getTitreAllEnqueteCree();
    this.getTauxReponseByAdmin();
    this.getAllUsersConnecteNouveaux();
    this.isNativeShareAvailable = this.serviceExport.isNativeShareAvailable();
  }

  // ========== MÉTHODES EXISTANTES ==========
  getNombreUsersActis() {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userId = this.currentUser.id;
      this.service.getNombreParticipantsByUser(this.userId).subscribe({
        next: (res: any) => {
          this.nombreUsersActifs = res.totalusers;
        },
        error: () => {},
      });
    } else {
      this.msg = 'filed id user';
    }
  }

  getNombreUsers() {
    this.service.getNombreTotalUsers().subscribe({
      next: (res: any) => {
        this.nombreUsers = res;
      },
    });
  }

  getAllUsersConnecte() {
    this.service.getMesClients().subscribe({
      next: (res: any) => {
        this.utilisateurs = res.rep.data;
        this.clients = res.rep.data;
        this.utilisateursFiltres = res.rep.data;
      },
      error: () => {},
    });
  }

  getAllUsersConnecteNouveaux() {
    this.service.getAllUsersConnecteNouveaux().subscribe({
      next: (res: any) => {
        this.nombreUsersNouveaux = res;
      },
      error: () => {},
    });
  }

  getTitreAllEnqueteCree() {
    this.serviceEnquete.getAllEnquete(this.userId).subscribe({
      next: (res: any[]) => {
        this.titreEnquetes = res;
      },
      error: () => {},
    });
  }

  getTauxReponseByAdmin() {
    this.service.getTauxReponseTotal(this.userId).subscribe({
      next: (res: any) => {
        this.taux_reponse = res.taux_reponse;
      },
      error: () => {},
    });
  }

  filterUsers() {
    const search = this.rechText.toLowerCase();
    this.utilisateursFiltres = this.utilisateurs.filter((user) => {
      return (
        (user.nom && user.nom.toLowerCase().includes(search)) ||
        (user.prenom && user.prenom.toLowerCase().includes(search)) ||
        (user.email && user.email.toLowerCase().includes(search)) ||
        (user.telephone && user.telephone.toLowerCase().includes(search))
      );
    });
  }

  changerSelectionTout(event: any) {
    if (event.target.checked) {
      this.utilisateursFiltres.forEach((u) =>
        this.utilisateurSelectionnes.add(u.id),
      );
    } else {
      this.utilisateurSelectionnes.clear();
    }
    this.mettreAJourCompteur();
  }

  changerSelectionUtilisateur(id: number, event: any) {
    if (event.target.checked) {
      this.utilisateurSelectionnes.add(id);
    } else {
      this.utilisateurSelectionnes.delete(id);
    }
    this.mettreAJourCompteur();
  }

  mettreAJourCompteur() {
    const count = this.utilisateurSelectionnes.size;
    const compteurTableau = document.getElementById('selectedCount');
    const compteurPanel = document.getElementById('panelSelectedCount');
    if (compteurTableau) compteurTableau.innerText = count.toString();
    if (compteurPanel) compteurPanel.innerText = count.toString();
  }

  toggleExportDropdown() {
    this.exportDropdownVisible = !this.exportDropdownVisible;
  }

  downloadExcel() {
    this.serviceExport.exportUsersConnecte().subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = (window as any).URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_connecte.xlsx';
        a.click();
        (window as any).URL.revokeObjectURL(url);
      },
      error: () => {
        console.error('Error downloading file');
      },
    });
  }

  telechargementPdf() {
    this.serviceExport.exportUsersConnectePdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_connecte.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur téléchargement PDF', err);
      }
    });
  }

  downloadCSV() {
    this.serviceExport.exportUsersConnecteCsv()
      .subscribe((data: Blob) => {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }, (error: any) => {
        console.error('Erreur téléchargement CSV', error);
      });
  }

  setDefaultImage(event: any) {
    event.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  }

  // ========== MÉTHODES DE PARTAGE ==========

  toggleShareDropdown(userId: number) {
    this.shareDropdownOpen = this.shareDropdownOpen === userId ? null : userId;
  }

  shareOnWhatsApp(phoneNumber?: string) {
    const lien = this.shareUrl || window.location.href;
    const messageTexte = this.whatsappMessage
      ? this.whatsappMessage.replace('{{URL}}', lien)
      : `📊 *${this.selectedEnqueteTitre || 'Enquête'}*\n\n${this.selectedEnqueteDescription || 'Participez à notre enquête'}\n\n🔗 ${lien}\n\nMerci pour votre participation !`;
    
    this.serviceExport.shareOnWhatsApp(phoneNumber || null, messageTexte);
    this.showToastMessage('Ouverture WhatsApp...');
  }

  shareOnFacebook() {
    if (!this.shareUrl) {
      this.showToastMessage('Aucun lien à partager');
      return;
    }
    this.serviceExport.shareOnFacebook(this.shareUrl);
    this.showToastMessage('Ouverture Facebook...');
  }

  shareOnMessenger() {
    if (!this.shareUrl) {
      this.showToastMessage('Aucun lien à partager');
      return;
    }
    this.serviceExport.shareOnMessenger(this.shareUrl);
    this.showToastMessage('Ouverture Messenger...');
  }

  async shareOnInstagram() {
    const lien = this.shareUrl || window.location.href;
    await this.serviceExport.shareOnInstagram(lien);
    this.instagramLinkCopied = true;
    setTimeout(() => { this.instagramLinkCopied = false; }, 8000);
    this.showToastMessage('✅ Lien copié ! Collez-le dans votre story ou message Instagram');
  }

  async shareUserDirect(reseau: string, user: any) {
    this.shareDropdownOpen = null;

    if (!this.selectedSurveyId) {
      this.showToastMessage(`⚠️ Veuillez d'abord sélectionner une enquête dans le panneau ci-dessous`);
      return;
    }

    if (!this.shareUrl) {
      const enquete = this.titreEnquetes.find((e: any) => e.id === this.selectedSurveyId);
      if (enquete) {
        this.selectedEnqueteTitre = enquete.titre;
        this.selectedEnqueteDescription = enquete.description || '';
      }
      try {
        const res = await this.serviceExport.getAllShareInfo(this.selectedSurveyId).toPromise();
        this.shareUrl = res.url;
      } catch {
        this.shareUrl = `http://localhost:4200/repondre/${this.selectedSurveyId}`;
      }
    }

    switch (reseau) {
      case 'whatsapp':
        this.shareOnWhatsApp(user.telephone);
        break;
      case 'facebook':
        this.shareOnFacebook();
        break;
      case 'messenger':
        this.shareOnMessenger();
        break;
      case 'instagram':
        await this.serviceExport.copyToClipboard(this.shareUrl);
        this.showToastMessage('✅ Lien copié ! Collez-le dans votre story ou message Instagram');
        break;
      case 'email':
        this.shareByEmail([user.email]);
        break;
      default:
        this.showToastMessage('Réseau non reconnu');
    }
  }

  shareByEmail(emails: string[]) {
    if (!this.selectedEnqueteId) {
      this.showToastMessage('⚠️ Veuillez sélectionner une enquête');
      return;
    }

    const validEmails = emails.filter(e => e && e !== '');
    if (validEmails.length === 0) {
      this.showToastMessage('⚠️ Aucun email valide');
      return;
    }

    const customMessage = `Bonjour,

Je vous invite à participer à l'enquête "${this.selectedEnqueteTitre}".

${this.selectedEnqueteDescription || 'Votre avis est précieux pour nous améliorer.'}

🔗 Lien direct : {{URL}}

⏱️ Durée estimée : 2-3 minutes
🔒 Vos réponses sont anonymes et confidentielles

Merci d'avance pour votre participation !

Cordialement,
L'équipe`;

    this.showToastMessage(`📧 Envoi en cours à ${validEmails.length} utilisateur(s)...`);

    this.serviceExport.sendEnqueteByEmailWithTemplate(
      this.selectedEnqueteId,
      validEmails,
      customMessage
    ).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToastMessage(`✅ ${res.envoyes?.length || validEmails.length} email(s) envoyé(s) avec succès !`);
        } else {
          this.showToastMessage(`⚠️ ${res.message}`);
        }
      },
      error: (err: any) => {
        console.error('Erreur envoi email:', err);
        this.showToastMessage(`❌ Erreur lors de l'envoi des emails`);
      }
    });
  }

  shareByEmailAuto() {
    if (!this.selectedEnqueteId) {
      this.showToastMessage('⚠️ Veuillez d\'abord sélectionner une enquête');
      return;
    }

    if (this.utilisateurSelectionnes.size === 0) {
      this.showToastMessage('⚠️ Veuillez sélectionner au moins un utilisateur');
      return;
    }

    const selectedUsers = this.utilisateurs.filter(u => this.utilisateurSelectionnes.has(u.id));
    const emails = selectedUsers.map((u: any) => u.email).filter((e: string) => !!e);

    if (emails.length === 0) {
      this.showToastMessage(`⚠️ Aucun utilisateur sélectionné n'a d'adresse email`);
      return;
    }

    this.shareByEmail(emails);
  }

  async copyLink() {
    const lien = this.shareUrl || window.location.href;
    const success = await this.serviceExport.copyToClipboard(lien);
    if (success) {
      this.showToastMessage('✅ Lien copié dans le presse-papier !');
    }
  }

  downloadQRCode() {
    if (this.selectedEnqueteId) {
      this.serviceExport.downloadQRCode(this.selectedEnqueteId).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qrcode_enquete_${this.selectedEnqueteId}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.showToastMessage('✅ QR Code téléchargé !');
        },
        error: (err: any) => {
          console.error('Erreur téléchargement QR Code:', err);
          this.showToastMessage('❌ Erreur lors du téléchargement du QR Code');
        }
      });
    } else {
      this.showToastMessage('⚠️ Veuillez sélectionner une enquête');
    }
  }

  async shareNative() {
    const success = await this.serviceExport.shareNative({
      title: this.selectedEnqueteTitre || 'Enquête',
      text: this.selectedEnqueteDescription || 'Participez à notre enquête',
      url: this.shareUrl || window.location.href
    });
    if (success) {
      this.showToastMessage('Partagé avec succès !');
    }
  }

  async openShareModal(enqueteId: number | null, titre: string, description: string) {
    if (!enqueteId) {
      this.showToastMessage('Veuillez sélectionner une enquête');
      return;
    }

    this.selectedEnqueteId = enqueteId;
    this.selectedEnqueteTitre = titre;
    this.selectedEnqueteDescription = description;
    this.showShareModal = true;

    this.qrCodeUrl = this.serviceExport.getQRCodeUrl(enqueteId);
    this.whatsappMessage = `📊 *${titre}*\n\n${description || 'Participez à notre enquête'}\n\n🔗 {{URL}}\n\nMerci pour votre participation !`;

    try {
      const res = await this.serviceExport.getAllShareInfo(enqueteId).toPromise();
      this.shareUrl = res.url;
      this.shareLinks = res.shareLinks || {};
    } catch (err) {
      this.shareUrl = `http://localhost:4200/repondre/${enqueteId}`;
    }
  }

  closeShareModal() {
    this.showShareModal = false;
    this.selectedEnqueteId = null;
    this.emailMessage = '';
    this.shareDropdownOpen = null;
    this.instagramLinkCopied = false;
    this.shareUrl = '';
  }

  async sendSelectedSurvey() {
    if (!this.selectedSurveyId) {
      this.showToastMessage('⚠️ Veuillez sélectionner une enquête');
      return;
    }
    if (this.utilisateurSelectionnes.size === 0) {
      this.showToastMessage('⚠️ Veuillez sélectionner au moins un utilisateur');
      return;
    }

    const selectedUsers = this.utilisateurs.filter(u => this.utilisateurSelectionnes.has(u.id));
    const emails = selectedUsers.map((u: any) => u.email).filter((e: string) => !!e);

    if (emails.length === 0) {
      this.showToastMessage(`⚠️ Aucun utilisateur sélectionné n'a d'adresse email`);
      return;
    }

    if (!this.shareUrl) {
      try {
        const res = await this.serviceExport.getAllShareInfo(this.selectedSurveyId).toPromise();
        this.shareUrl = res.url;
        const enquete = this.titreEnquetes.find((e: any) => e.id === this.selectedSurveyId);
        if (enquete) {
          this.selectedEnqueteTitre = enquete.titre;
          this.selectedEnqueteDescription = enquete.description || '';
          this.selectedEnqueteId = enquete.id;
        }
      } catch {
        this.shareUrl = `http://localhost:4200/repondre/${this.selectedSurveyId}`;
        this.selectedEnqueteId = this.selectedSurveyId;
      }
    }

    const customMessage = `Bonjour,

Je vous invite à participer à l'enquête "${this.selectedEnqueteTitre}".

${this.selectedEnqueteDescription || 'Votre avis est précieux pour nous améliorer.'}

🔗 Lien direct : {{URL}}

⏱️ Durée estimée : 2-3 minutes
🔒 Vos réponses sont anonymes et confidentielles

Merci d'avance pour votre participation !

Cordialement,
L'équipe`;

    this.showToastMessage(`📧 Envoi en cours à ${emails.length} utilisateur(s)...`);

    this.serviceExport.sendEnqueteByEmailWithTemplate(
      this.selectedSurveyId,
      emails,
      customMessage
    ).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToastMessage(`✅ ${res.envoyes?.length || emails.length} email(s) envoyé(s) avec succès !`);
        } else {
          this.showToastMessage(`⚠️ ${res.message}`);
        }
      },
      error: (err: any) => {
        console.error('Erreur envoi:', err);
        this.showToastMessage(`❌ Erreur lors de l'envoi. Vérifiez la configuration email.`);
      }
    });
  }

  async copyUserLink(userId: number) {
    if (!this.selectedEnqueteId) {
      this.showToastMessage(`Veuillez d'abord sélectionner une enquête`);
      return;
    }
    const url = `http://localhost:4200/repondre/${this.selectedEnqueteId}?userId=${userId}`;
    await this.serviceExport.copyToClipboard(url);
    this.showToastMessage('✅ Lien utilisateur copié !');
  }

  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}