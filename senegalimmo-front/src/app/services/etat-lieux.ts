import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EtatLieuxService {
  private apiUrl = 'http://127.0.0.1:8000/api/etats-des-lieux';

  constructor(private http: HttpClient) {}

  list(contratId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?contrat_id=${contratId}`);
  }

  create(data: FormData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  validate(id: number, remarque: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/valider`, { remarque });
  }
}