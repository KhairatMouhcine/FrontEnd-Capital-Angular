import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit, OnDestroy {
  private refreshSub?: Subscription;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // ✅ Étape 1 : Vérifie si token présent
    const token = this.auth.getToken();
    if (!token) {
      console.warn('🔒 Aucun token trouvé, utilisateur non connecté.');
      return;
    }

    // ✅ Étape 2 : Récupère l’ID depuis le token
    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      console.warn('⛔ Token invalide : aucun ID trouvé.');
      return;
    }

    // ✅ Étape 3 : Lancer le rafraîchissement automatique
    this.refreshSub = interval(15*60*1000).subscribe(() => {
      console.log(`🔁 Tentative de refresh pour l'userId ${userId}`);
      this.auth.refreshToken(userId).subscribe({
        next: (res) => {
          console.log('✅ Nouveau token reçu :', res.token);
          this.auth.storeToken(res.token);
        },
        error: (err) => {
          console.error('❌ Échec du rafraîchissement, déconnexion');
          console.error(err);
          this.auth.clearToken();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }
}
