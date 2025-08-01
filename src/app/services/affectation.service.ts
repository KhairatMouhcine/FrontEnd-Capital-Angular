import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Affectation {
  idAffectation: number;
  clientId: number;
  profilId: number;
  denomination: string;
  nom: string;
  prenom: string;
  dateDebut?: string;
  dateFin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AffectationService {
  private apiUrl = 'https://localhost:7107/api/ClientProfil';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Affectation[]> {
    return this.http.get<Affectation[]>(this.apiUrl);
  }

  getById(id: number): Observable<Affectation> {
    return this.http.get<Affectation>(`${this.apiUrl}/${id}`);
  }

  create(affectation: Partial<Affectation>): Observable<Affectation> {
    console.log(affectation);
    return this.http.post<Affectation>(this.apiUrl, affectation);
  }

  update(id: number, affectation: Partial<Affectation>): Observable<void> {
    console.log(affectation);
    return this.http.put<void>(`${this.apiUrl}/${id}`, affectation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
getCurrent(): Observable<Affectation[]> {
  return this.http.get<Affectation[]>(`${this.apiUrl}/Current`);
}

}
