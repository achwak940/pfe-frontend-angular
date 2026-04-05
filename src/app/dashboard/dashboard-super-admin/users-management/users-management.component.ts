import { Component, OnInit, HostBinding, Renderer2, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { StatistiqueUserTotalService } from '../statistique-user-total.service';


@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {

  nombreUsersTotal!:number
  nombreUsersTotalActifs!:number
  nombreUsersTotalInActifs!:number
  nombreAdmins!:number
  users: any[] = [];
  constructor(private service:StatistiqueUserTotalService) { }
  getNombreTotalUsers()
  {
    this.service.getNombreAllUsers().subscribe(
      {
        next :(res:any)=>{
          this.nombreUsersTotal=res.nombreUsersTotal

        },
        error:(err)=>{
          console.log(err)
        }
      }
    )
  }
   getNombreTotalUsersActifs()
  {
    this.service.getNombreAllUsersActifs().subscribe(
      {
        next :(res:any)=>{
         this.nombreUsersTotalActifs=res.NombreUsersActifs
         console.log(this.nombreUsersTotalActifs)

        },
        error:(err)=>{
          console.log(err)
        }
      }
    )
  }
     getNombreTotalUsersInActifs()
  {
    this.service.getNombreAllUsersInactifs().subscribe(
      {
        next :(res:any)=>{
         this.nombreUsersTotalInActifs=res.NombreUsersInActifs
         console.log(this.nombreUsersTotalActifs)

        },
        error:(err)=>{
          console.log(err)
        }
      }
    )
  }
    getNombreAdmins()
  {
    this.service.getNombreAllAdmins().subscribe(
      {
        next :(res:any)=>{
         this.nombreAdmins=res.NombreAdmins
         console.log(this.nombreAdmins)

        },
        error:(err)=>{
          console.log(err)
        }
      }
    )
  }
  getAllUsers(){
    this.service.getAllUsers().subscribe(
      {
        next:(res:any)=>{
          this.users=res
          console.log(this.users)

        }
      }
    )

  }
  ngOnInit(): void {
    this.getNombreTotalUsers()
    this.getNombreTotalUsersActifs()
    this. getNombreTotalUsersInActifs()
    this.getNombreAdmins()
    this.getAllUsers()
  }
}