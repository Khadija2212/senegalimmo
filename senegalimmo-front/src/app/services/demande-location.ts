import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DemandeLocationService {
  private apiUrl = 'http://127.0.0.1:8000/api/demandes-location';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateStatut(id: number, statut: string, motif?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { statut, motif_refus: motif });
  }
}