import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotationService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  aFaire(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notations/a-faire`);
  }

  noter(data: { bien_id: number; note: number; commentaire?: string | null }): Observable<any> {
    return this.http.post(`${this.apiUrl}/notations`, data);
  }

  avis(proprietaireId: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/proprietaires/${proprietaireId}/avis`);
  }
}