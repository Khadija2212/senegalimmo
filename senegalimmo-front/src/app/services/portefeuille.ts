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

  demander(data: { montant: number; methode: string; numero_beneficiaire: string }): Observable<any> {
    return this.http.post(`${this.api}/retraits`, data);
  }


  adminRetraits(statut: string): Observable<any[]> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    return this.http.get<any[]>(`${this.api}/admin/retraits`, { params });
  }

  traiter(id: number, data: { decision: 'approuver' | 'rejeter'; motif?: string }): Observable<any> {
    return this.http.post(`${this.api}/admin/retraits/${id}/traiter`, data);
  }

  payerCommission(id: number): Observable<any> {
    return this.http.put(`${this.api}/commissions/${id}/payer`, {});
  }
}