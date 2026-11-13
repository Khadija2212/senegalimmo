import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getFavoris(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favoris`);
  }

  getFavorisIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/favoris/ids`);
  }

  toggle(bienId: number): Observable<{ message: string; est_favori: boolean }> {
    return this.http.post<{ message: string; est_favori: boolean }>(`${this.apiUrl}/favoris/toggle`, {
      bien_id: bienId
    });
  }
}
