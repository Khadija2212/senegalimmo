import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { AnnonceDetaillee, CriteresRecherche, PageAnnonces, PointCarte } from '../modeles/annonce';

/** Cas « Rechercher un bien », « Filtrer », « Afficher sur la carte », « Consulter une annonce ». */
@Injectable({ providedIn: 'root' })
export class AnnoncesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${ENVIRONNEMENT.apiUrl}/annonces`;

  rechercher(criteres: CriteresRecherche, page = 1): Observable<PageAnnonces> {
    return this.http.get<PageAnnonces>(this.url, {
      params: versParametres(criteres).set('page', page),
    });
  }

  carte(criteres: CriteresRecherche): Observable<PointCarte[]> {
    return this.http.get<PointCarte[]>(`${this.url}/carte`, { params: versParametres(criteres) });
  }

  consulter(id: string): Observable<AnnonceDetaillee> {
    return this.http.get<AnnonceDetaillee>(`${this.url}/${id}`);
  }
}

function versParametres(criteres: CriteresRecherche): HttpParams {
  let params = new HttpParams();
  for (const [cle, valeur] of Object.entries(criteres)) {
    if (valeur === undefined || valeur === null || valeur === '') continue;
    params = params.set(cle, typeof valeur === 'boolean' ? Number(valeur) : valeur);
  }
  return params;
}
