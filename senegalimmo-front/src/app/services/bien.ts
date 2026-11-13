import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BienService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/biens`);
  }

  getPublic(filters: Record<string, any>): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<any[]>(`${this.apiUrl}/biens-publics`, { params });
  }
   getOnePublic(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biens-publics/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/biens`, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/biens/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/biens/${id}`);
  }
    addPhotos(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/biens/${id}/photos`, data);
  }

  removePhoto(id: number, photo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/biens/${id}/photos/supprimer`, { photo });
  }
}