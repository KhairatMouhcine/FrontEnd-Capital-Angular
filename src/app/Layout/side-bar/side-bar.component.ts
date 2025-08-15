import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Nécessaire pour *ngIf
import { RouterModule } from '@angular/router'; // si tu utilises routerLink

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ Ajoute CommonModule ici
  templateUrl: './side-bar.component.html'
})
export class SideBarComponent {
  role = localStorage.getItem('auth_token')
    ? JSON.parse(atob(localStorage.getItem('auth_token')!.split('.')[1]))["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    : null;

  isAdmin(): boolean {
    return this.role === 'admin';
  }
  isRh(): boolean {
    return this.role === 'rh';
  }
  isPrestataire(): boolean {
  return this.role === 'prestataire';
}
  isManager(): boolean {
  return this.role === 'manager';
}
}
