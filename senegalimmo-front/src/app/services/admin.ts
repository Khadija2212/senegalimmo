import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = 'http://127.0.0.1:8000/api/admin/utilisateurs';

  constructor(private http: HttpClient) {}

  utilisateurs(filtres: Record<string, string>): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(filtres).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<any[]>(this.api, { params });
  }

  statut(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.api}/${id}/statut`, { statut });
  }

  verification(id: number, decision: string, motif?: string): Observable<any> {
    return this.http.put(`${this.api}/${id}/verification`, { decision, motif });
  }

  document(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/document`, { responseType: 'blob' });
  }
}