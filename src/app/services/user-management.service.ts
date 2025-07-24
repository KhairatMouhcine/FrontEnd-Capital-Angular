import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
  token?: string | null;
  password?: string; // jamais renvoyé côté API en clair, mais on laisse optionnel
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private apiUrl = 'https://localhost:7039/api/UserManagement';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private buildHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.buildHeaders() });
  }

  // (Optionnel, si tu veux plus tard) updateUser(...)
}
