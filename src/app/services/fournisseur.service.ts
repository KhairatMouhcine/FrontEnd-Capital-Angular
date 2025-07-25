import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Fournisseur {
  id?: number;
  donneesJson: any; // ou JsonObject si typé
}

@Injectable({
  providedIn: 'root'
})
export class  FournisseurService {
  private apiUrl = 'https://localhost:7285/api/vendor';
  private api = 'https://localhost:7038/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.apiUrl);
  }
  analyseKbis(file: File): Observable<any> {
      const form = new FormData();
      form.append('file', file);              
      return this.http.post<any>(`${this.api}/upload/analyse`, form);
    }
  getById(id: number): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.apiUrl}/${id}`);
  }

  create(fournisseur: Fournisseur): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(this.apiUrl, fournisseur);
  }

  update(id: number, fournisseur: Fournisseur): Observable<void> {
     console.log(fournisseur)
    return this.http.put<void>(`${this.apiUrl}/${id}`, fournisseur);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
