import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private apiUrl = 'http://127.0.0.1:8000/api/admin';

  constructor(private http: HttpClient) {}

  getUsers(filters?: { role?: string; statut?: string; search?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.statut) params = params.set('statut', filters.statut);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<any[]>(`${this.apiUrl}/users`, { params });
  }

  toggleStatut(userId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}/statut`, {});
  }

  validerDocument(userId: number, action?: string): Observable<any> {
    const body = action ? { action } : {};
    return this.http.put<any>(`${this.apiUrl}/users/${userId}/valider`, body);
  }

  getDocument(userId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/users/${userId}/document`, { responseType: 'blob' });
  }

  exportStats(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-stats`, {
      responseType: 'blob'
    });
  }
}
