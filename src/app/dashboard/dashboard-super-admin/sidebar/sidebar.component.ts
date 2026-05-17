import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isDarkTheme: boolean = false;
  @Output() themeToggled = new EventEmitter<void>();

  toggleTheme(): void {
    this.themeToggled.emit(); // Correct avec EventEmitter d'Angular
  }
}