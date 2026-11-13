import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AlerteService {
  private api = 'http://127.0.0.1:8000/api/alertes';

  // Nombre d'alertes non lues, partagé entre la cloche et la page
  readonly nonLues = signal(0);

  constructor(private http: HttpClient) {}

  list(): Observable<{ non_lues: number; alertes: any[] }> {
    return this.http.get<{ non_lues: number; alertes: any[] }>(this.api).pipe(
      tap((r) => this.nonLues.set(r.non_lues))
    );
  }

  lire(id: number): Observable<any> {
    return this.http.post(`${this.api}/${id}/lire`, {});
  }

  lireTout(): Observable<any> {
    return this.http.post(`${this.api}/lire-tout`, {});
  }
}