import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';

interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7039/api'; // ✅ URL API


  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<any> {
    return this.http.post(this.apiUrl+"/Auth/login", credentials);
  }

  storeToken(token: string): void {
    localStorage.setItem('auth_token',token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }
  checkToken(userId: number): Observable<{ token: string }> {
    return this.http.get<{ token: string }>(`${this.apiUrl}/auth/check/${userId}`);
  }
  getUserIdFromToken(): number | null {
  const token = this.getToken();
  if (!token) return null;

  const decoded = this.decodeToken(token);
  return decoded?.id ? +decoded.id : null;
}
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    } catch (e) {
      return null;
    }
  }
refreshToken(userId: number) {
  return this.http.get<{ token: string }>(`${this.apiUrl}/auth/refresh-token/${userId}`);
}
clearToken(): void {
  localStorage.removeItem('auth_token');
}
logoutFromServer(userId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/auth/logout/${userId}`);
}
}
