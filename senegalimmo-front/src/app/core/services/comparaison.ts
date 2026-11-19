import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Annonce } from '../modeles/annonce';

/** Cas « Comparer des biens » : GET /annonces/comparer?ids[]=…, de deux à quatre annonces publiées. */
@Injectable({ providedIn: 'root' })
export class ComparaisonService {
  private readonly http = inject(HttpClient);
  private readonly url = `${ENVIRONNEMENT.apiUrl}/annonces/comparer`;

  comparer(ids: readonly string[]): Observable<Annonce[]> {
    const params = ids.reduce((p, id) => p.append('ids[]', id), new HttpParams());
    return this.http.get<Annonce[]>(this.url, { params });
  }
}
