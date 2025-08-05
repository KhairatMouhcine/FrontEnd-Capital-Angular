import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CratJour {
  id: number;
  cratId: number;
  date: string;
  jourSemaine: string;
  am: boolean;
  pm: boolean;
}

export interface Crat {
  id: number;
  affectationId: number;
  mois: string;
  nombreJours: number;
  jours: CratJour[];
}

@Injectable({
  providedIn: 'root'
})
export class CraService {
  private apiUrl = 'https://localhost:9443/api/crat';

  constructor(private http: HttpClient) {}

  getCratsByAffectationId(id: number): Observable<Crat[]> {
    return this.http.get<Crat[]>(`${this.apiUrl}/cratbyId?id=${id}`);
  }

  getCratJours(cratId: number): Observable<CratJour[]> {
    return this.http.get<CratJour[]>(`${this.apiUrl}/craJourbyId?cratId=${cratId}`);
  }

  updateCratJours(jours: CratJour[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/updateJours`, jours);
  }
}
