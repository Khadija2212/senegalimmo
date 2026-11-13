import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private api = 'http://127.0.0.1:8000/api/profil';

  constructor(private http: HttpClient) {}

  get(): Observable<any> {
    return this.http.get<any>(this.api);
  }

  update(data: any): Observable<any> {
    return this.http.put<any>(this.api, data);
  }

  changerMotDePasse(data: any): Observable<any> {
    return this.http.put(`${this.api}/mot-de-passe`, data);
  }

  envoyerDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('document', file);
    return this.http.post(`${this.api}/document`, formData);
  }

  voirDocument(): Observable<Blob> {
    return this.http.get(`${this.api}/document`, { responseType: 'blob' });
  }
}