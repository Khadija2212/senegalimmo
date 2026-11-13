import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalementService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/signalements`);
  }

  signaler(data: { bien_id: number; motif: string; description?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signalements`, data);
  }

  traiter(id: number, data: { statut: string; reponse_admin?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/signalements/${id}`, data);
  }
}
