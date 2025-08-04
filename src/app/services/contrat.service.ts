import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContratPayload {
  clientProfilId: number;
  objet: string;
  lieuExecution: string;
  clientContenu: string;      // on envoie "" (le back remplit)
  fournisseurContenu: string; // on envoie "" (le back remplit si fournisseur)
}

@Injectable({ providedIn: 'root' })
export class ContratService {
  // ⚠️ Mets ici le port réel de ContratMS
  private apiUrl = 'https://localhost:7071/api/Contrat';

  constructor(private http: HttpClient) {}

  genererPdf(payload: ContratPayload): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/generer-pdf`, payload, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
