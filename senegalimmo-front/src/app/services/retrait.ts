import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RetraitService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/retraits`);
  }

  demander(data: { montant: number; methode: string; numero_beneficiaire: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/retraits`, data);
  }

  traiter(id: number, data: { decision: 'approuver' | 'rejeter'; motif?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/retraits/${id}/traiter`, data);
  }
}
