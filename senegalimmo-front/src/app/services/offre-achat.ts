import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OffreAchatService {
  private apiUrl = 'http://127.0.0.1:8000/api/offres-achat';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  create(data: { bien_id: number; montant: number; message?: string | null }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  act(id: number, data: { action: string; montant?: number | null; motif?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
}