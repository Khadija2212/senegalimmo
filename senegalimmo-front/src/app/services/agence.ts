import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgenceService {
  private api = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  /* Mandats */
  mandats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/mandats`);
  }

  agences(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/agences`);
  }

  creerMandat(data: any): Observable<any> {
    return this.http.post(`${this.api}/mandats`, data);
  }

  actionMandat(id: number, data: { action: string; motif?: string }): Observable<any> {
    return this.http.put(`${this.api}/mandats/${id}`, data);
  }

  assigner(id: number, agentId: number | null): Observable<any> {
    return this.http.put(`${this.api}/mandats/${id}/agent`, { agent_id: agentId });
  }

  biensGeres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/biens-geres`);
  }

  /* Agents */
  agents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/agents`);
  }

  creerAgent(data: any): Observable<any> {
    return this.http.post(`${this.api}/agents`, data);
  }

  statutAgent(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.api}/agents/${id}/statut`, { statut });
  }

  /* Commissions */
  commissions(): Observable<any> {
    return this.http.get<any>(`${this.api}/commissions`);
  }

  regler(id: number): Observable<any> {
    return this.http.put(`${this.api}/commissions/${id}/regler`, {});
  }
    payerCommission(id: number): Observable<any> {
    return this.http.put(`${this.api}/commissions/${id}/payer`, {});
  }
}