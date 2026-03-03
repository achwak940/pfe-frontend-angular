import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EnqueteService } from '../enquete.service';
import { error } from 'console';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ajout-enquete',
  templateUrl: './ajout-enquete.component.html',
  styleUrls: ['./ajout-enquete.component.css']
})
export class AjoutEnqueteComponent implements OnInit {

  enqueteForm!: FormGroup;
  today = new Date().toISOString().split('T')[0];
  msgScusses =""
  



  participationType: { [key: string]: string } = {
    connecte: 'CONNECTE',
    anonyme: 'ANONYME'
  };

  constructor(private fb: FormBuilder,private service :EnqueteService) {}

  ngOnInit(): void {
    this.enqueteForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['',Validators.minLength(10)],
      dateFin: ['',Validators.required],
     
    });
  }

  

 addenquete(){
    const values=this.enqueteForm.value
   

    this.service.addNewEnqueteVide(values).subscribe(
      {
        next:res=>{
          if(res && res.data){
            this.msgScusses =res.message
               Swal.fire({
          icon: 'success',
          title: 'Succès 🎉',
          text: res.message,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
            this.enqueteForm.reset()

            //swwetalert
          }
        },
        error:err=>{
            Swal.fire({
        icon: 'error',
        title: 'Erreur ❌',
        text: err.error?.message || 'Une erreur est survenue',
        confirmButtonColor: '#d33'
      });
        }

      
      }
    )

  }

  onSubmit() {
    if (this.enqueteForm.invalid) return;
    this.addenquete()
  }

 
}