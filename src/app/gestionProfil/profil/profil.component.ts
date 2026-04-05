import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GereProfilService } from '../gere-profil.service';
import { subscribe } from 'diagnostics_channel';
@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  userId!:number
  currentUser!: any;
  userInfo: any;
  constructor(private service:GereProfilService, private router: Router) { }
  ngOnInit(): void {
       const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userId = this.currentUser.id;
     // console.log(this.userId)
     this.getProfilUser();
    }
  }
  getProfilUser(){
    this.service.consulterProfil(this.userId).subscribe({
      next:(data:any)=>{
        this.userInfo = data.profil;
      },
      error:(err)=>{
        console.log(err)
      }
      
    })
  }
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
