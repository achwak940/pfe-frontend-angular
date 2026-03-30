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
  nombreUsersActifs!: number;
  currentUser!: any;
  userId!: number;
  msg!: string;
  nombreUsers!: number;
  utilisateurs: any[] = [];
  titreEnquetes: any[] = [];
  taux_reponse!: number;
  rechText: string = '';
  utilisateursFiltres: any[] = [];
  nombreUsersNouveaux!: number;
  //liste des id selectionnes
  utilisateurSelectionnes: Set<number> = new Set<number>();
  exportDropdownVisible = false;
  toggleExportDropdown() {
  this.exportDropdownVisible = !this.exportDropdownVisible;
}
  constructor(
    private service: StatistiquesService,
    private serviceEnquete: EnqueteService,
    private serviceExport: UsersService,
  ) {}
  getNombreUsersActis() {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userId = this.currentUser.id;
      this.service.getNombreParticipantsByUser(this.userId).subscribe({
        next: (res: any) => {
          this.nombreUsersActifs = res.totalusers;
          //console.log(res)
          //  console.log("yes")
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
    this.service.getAllUsersConnecte().subscribe({
      next: (res: any) => {
        this.utilisateurs = res.data;
        this.utilisateursFiltres = [...this.utilisateurs];
        //  console.log(this.utilisateurs)
      },
      error: () => {},
    });
  }
  getAllUsersConnecteNouveaux() {
    this.service.getAllUsersConnecteNouveaux().subscribe({
      next: (res: any) => {
        this.nombreUsersNouveaux = res;
        // console.log(this.nombreUsersNouveaux)
      },
      error: () => {},
    });
  }
  getTitreAllEnqueteCree() {
    this.serviceEnquete.getAllEnquete(this.userId).subscribe({
      next: (res: any[]) => {
        this.titreEnquetes = res;
        //console.log(this.titreEnquetes)
        // console.log(this.titreEnquetes)
      },
      error: () => {},
    });
  }
  getTauxReponseByAdmin() {
    this.service.getTauxReponseTotal(this.userId).subscribe({
      next: (res: any) => {
        this.taux_reponse = res.taux_reponse;
        //  console.log(this.taux_reponse)
      },
      error: () => {},
    });
  }
  filterUsers() {
    const search = this.rechText.toLowerCase(); // n7awlou kolch lowercase
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
    this.mettreAjoureComptuer();
  }
  chnagerSelectionUtilisateur(id: number, event: any) {
    if (event.target.checked) {
      this.utilisateurSelectionnes.add(id);
    } else {
      this.utilisateurSelectionnes.delete(id);
    }
    this.mettreAjoureComptuer();
  }
  mettreAjoureComptuer() {
    const count = this.utilisateurSelectionnes.size;
    const compteurTableau = document.getElementById('selectedCount');
    const compteurPanel = document.getElementById('panelSelectedCount');
    if (compteurTableau) compteurTableau.innerText = count.toString();
    if (compteurPanel) compteurPanel.innerText = count.toString();
  }
  ngOnInit(): void {
    this.getNombreUsersActis();
    this.getNombreUsers();
    this.getAllUsersConnecte();
    this.getTitreAllEnqueteCree();
    this.getTauxReponseByAdmin();
    this.getAllUsersConnecteNouveaux();
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
        console.log("trouveé")
      },
      error: () => {
        console.error('Error downloading file');
      },
    });
  }
  telechargementPdf(){
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
    }, error => {
      console.error('Erreur téléchargement CSV', error);
    });
}
  
}
