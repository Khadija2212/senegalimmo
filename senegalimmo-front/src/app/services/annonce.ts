import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnnonceService {
  private apiUrl = 'http://127.0.0.1:8000/api/annonces';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  publish(bienId: number): Observable<any> {
    return this.http.post(this.apiUrl, { bien_id: bienId });
  }

  moderate(id: number, data: { statut: string; motif_rejet?: string; verifie?: boolean }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  setVerification(id: number, verifie: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/verification`, { verifie });
  }

  withdraw(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}