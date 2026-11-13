import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  conversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`);
  }

  thread(avec: number, bien?: number | null): Observable<any> {
    let params = new HttpParams().set('avec', String(avec));
    if (bien) params = params.set('bien', String(bien));
    return this.http.get<any>(`${this.apiUrl}/messages`, { params });
  }

  send(data: { destinataire_id: number; contenu: string; bien_id?: number | null }): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, data);
  }
}