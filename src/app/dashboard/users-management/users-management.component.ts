import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {

  constructor() { }
  users = [
    { name: 'Anya Malik', email: 'anya.malik@email.com', role: 'Admin', active: true, initials: 'AM' },
    { name: 'Ben Carter', email: 'ben.carter@email.com', role: 'Admin', active: true, initials: 'BC' },
    { name: 'Chloe Diaz', email: 'chloe.diaz@email.com', role: 'User', active: true, initials: 'CD' },
    { name: 'ABC', email: 'ben.carter@email.com', role: 'User', active: true, initials: 'BM' },
    { name: 'User', email: 'chloe.dizz.com', role: 'User', active: true, initials: 'BC' },
    { name: 'Calplin', email: 'chloe.diaz.com', role: 'User', active: true, initials: 'CD' },
  ];

  ngOnInit(): void {
  }

}
