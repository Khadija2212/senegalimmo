import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paiements`);
  }

  echeancier(contratId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/contrats/${contratId}/echeancier`);
  }

  initier(data: { bail_id?: number; promesse_id?: number; type: string; methode: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/paiements/initier`, data);
  }

  getByReference(reference: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/paiements/ref/${reference}`);
  }

  quittance(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/paiements/${id}/quittance`, { responseType: 'blob' });
  }
}
