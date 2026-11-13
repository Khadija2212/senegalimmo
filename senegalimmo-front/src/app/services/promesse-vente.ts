import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PromesseVenteService {
  private apiUrl = 'http://127.0.0.1:8000/api/promesses-vente';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  create(data: { offre_id: number; date_limite: string; indemnite?: number | null; conditions?: string | null }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  sign(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/signer`, {});
  }

  pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}