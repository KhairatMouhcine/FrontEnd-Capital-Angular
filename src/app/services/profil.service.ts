import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Optionnel : crée une interface profil dans un fichier séparé
export interface Profil {
  id?: number;
  userId?: number;
  donneesJson?: any;
  idFournisseur?: number;
}

export interface MatchResult {
  profileId: number;
  displayName: string;
  score: number;          // 0..1
  reason: string;
  matchedSkills: string[];
}

@Injectable({ providedIn: 'root' })
export class ProfilService {
  private apiUrl = 'https://localhost:7079/api/profil';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
      // ajoute ici un token si besoin : 'Authorization': `Bearer ${token}`
    })
  };

  constructor(private http: HttpClient) {}

  // 🔍 Lire tous les profils
  getAll(): Observable<Profil[]> {
    return this.http.get<Profil[]>(this.apiUrl);
  }
getFournisseurs() {
  return this.http.get<any[]>('https://localhost:7285/api/vendor');
}
  // 🔍 Lire un profil par ID
  get(id: number): Observable<Profil> {
    return this.http.get<Profil>(`${this.apiUrl}/${id}`);
  }

  // ➕ Créer un profil
  create(profil: any): Observable<Profil> {
    console.log(profil)
    return this.http.post<Profil>(this.apiUrl, profil, this.httpOptions);
  }

  // ✏️ Mettre à jour un profil
  update(id: number, profil: any): Observable<void> {
    console.log(profil);
    return this.http.put<void>(`${this.apiUrl}/${id}`, profil, this.httpOptions);
  }

  // ❌ Supprimer un profil
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  matchProfiles(offerText: string): Observable<MatchResult[]> {
    return this.http.post<MatchResult[]>(
      `${this.apiUrl}/match`,           // => https://localhost:7079/api/profil/match
      { offerText },
      this.httpOptions
    );
  }
  // 📷 Récupérer la photo du profil (Blob)
  getPhoto(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/photo`, { responseType: 'blob' });
  }

  // 📤 Uploader / remplacer la photo (jpg/png/webp, max 5 MB)
  // ⚠️ Ne PAS utiliser this.httpOptions ici : pas de 'Content-Type: application/json'
  uploadPhoto(id: number, file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post(`${this.apiUrl}/${id}/photo`, form, { responseType: 'text' });
  }

}  






