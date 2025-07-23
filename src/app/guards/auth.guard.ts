import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

canActivate(): Observable<boolean> {
  const userId = this.auth.getUserIdFromToken(); 
  const localToken = this.auth.getToken();

  if (!userId || !localToken) {
    console.warn('❌ Aucune authentification :', { userId, localToken });
    this.clearAndRedirect();
    return of(false);
  }

  return this.auth.checkToken(userId).pipe(
    map((res) => {
      const serverToken = res.token;
      console.log('🔐 Token localStorage :', localToken);
      console.log('🔐 Token depuis /check/{id} :', serverToken);

      if (serverToken === localToken) {
        return true;
      } else {
        console.warn('⚠️ Tokens ne correspondent pas. Redirection...');
        this.clearAndRedirect();
        return false;
      }
    }),
    catchError((error) => {
      console.error('❌ Erreur lors du check token:', error);
      this.clearAndRedirect();
      return of(false);
    })
  );
}


  private clearAndRedirect(): void {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/']);
  }
}
