import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortefeuilleService {
  private api = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  portefeuille(): Observable<any> {
    return this.http.get<any>(`${this.api}/portefeuille`);
  }

  demander(data: { montant: number; methode: string; numero_telephone: string }): Observable<any> {
    return this.http.post(`${this.api}/retraits`, data);
  }

  preuve(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/retraits/${id}/preuve`, { responseType: 'blob' });
  }

  adminRetraits(statut: string): Observable<any[]> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    return this.http.get<any[]>(`${this.api}/admin/retraits`, { params });
  }

  traiter(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.api}/admin/retraits/${id}/traiter`, data);
  }

  payerCommission(id: number): Observable<any> {
    return this.http.put(`${this.api}/commissions/${id}/payer`, {});
  }
}