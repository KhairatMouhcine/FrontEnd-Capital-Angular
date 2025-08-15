import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../app/services/auth.service'; // adapte le chemin

@Component({
  selector: 'app-nav-layout',
  imports: [],
  templateUrl: './nav-layout.component.html',
  styleUrl: './nav-layout.component.css'
})
export class NavLayoutComponent {
  currentPage: string = '';
  constructor(private auth: AuthService,private router: Router) {
    this.router.events.subscribe(() => {
      // Exemple : /admin/dashboard → ["", "admin", "dashboard"]
      const segments = this.router.url.split('/');
      if (segments.length > 1) {
        this.currentPage = segments[1]; // prend ce qui vient après le 1er "/"
      }
    });
  }
  logout(): void {
  const userId = this.auth.getUserIdFromToken(); // 🔐 Récupère l'ID à partir du token

  if (!userId) {
    this.auth.clearToken(); // Aucun ID ? On supprime juste le token local
    this.router.navigate(['/login']);
    return;
  }

  // Appel à l'API pour supprimer le token côté serveur
  this.auth.logoutFromServer(userId).subscribe({
    next: () => {
      console.log('✅ Token supprimé côté serveur');
      this.auth.clearToken();
      this.router.navigate(['']);
    },
    error: (err) => {
      console.warn('⚠️ Erreur lors de la déconnexion serveur :', err);
      this.auth.clearToken(); // Supprime quand même localement
      this.router.navigate(['']);
    }
  });
}

}
